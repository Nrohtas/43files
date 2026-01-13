import { NextResponse } from 'next/server';
import { pool } from '@/lib/db';
import * as xlsx from 'xlsx';
import { RowDataPacket } from 'mysql2';

export async function POST(request: Request) {
    try {
        const formData = await request.formData();
        const file = formData.get('file') as File | null;
        const username = formData.get('username') as string | null;

        if (!file) {
            return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
        }

        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        const workbook = xlsx.read(buffer, { type: 'buffer' });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        const rawData = xlsx.utils.sheet_to_json(sheet) as any[];

        if (rawData.length === 0) {
            return NextResponse.json({ error: 'Excel file is empty' }, { status: 400 });
        }

        const [hospRows] = await pool.query<RowDataPacket[]>('SELECT hospcode, hostype_new FROM hospital');
        const hospTypeMap = new Map<string, number>();
        hospRows.forEach((row: any) => {
            hospTypeMap.set(row.hospcode, parseInt(row.hostype_new));
        });

        const validRows: any[] = [];
        const warnings: string[] = [];

        const calculateSentdata = (hostype: number | undefined, service: number): string => {
            if (hostype === undefined) return 'N';
            if ([13, 18, 21].includes(hostype)) return service > 199 ? 'Y' : 'N';
            if ([5, 12].includes(hostype)) return service > 19999 ? 'Y' : 'N';
            if (hostype === 8) return service > 999 ? 'Y' : 'N';
            if (hostype === 11) return service > 599 ? 'Y' : 'N';
            if (hostype === 7) return service > 7999 ? 'Y' : 'N';
            return 'N';
        };

        rawData.forEach((row) => {
            if (!row.hospcode || !row.year_th || !row.month_no || row.service === undefined || row.service === null) {
                return;
            }
            const serviceValue = parseFloat(row.service) || 0;
            const serviceApprove = parseFloat(row.service_pass || row.service_approve) || 0;
            const serviceReject = parseFloat(row.service_reject) || 0;
            const hospcode = row.hospcode.toString().replace(/\D/g, ''); // Sanitize
            const hostype = hospTypeMap.get(hospcode);

            if (hostype === undefined) {
                if (!warnings.includes(hospcode)) warnings.push(hospcode);
            }

            const sentdataValue = calculateSentdata(hostype, serviceValue);
            const monthNo = row.month_no.toString().padStart(2, '0');

            validRows.push([
                hospcode,
                row.year_th,
                monthNo,
                sentdataValue,
                serviceValue,
                serviceApprove,
                serviceReject,
                new Date()
            ]);
        });

        if (validRows.length === 0) {
            return NextResponse.json({
                error: 'No valid rows found. Missing required columns.'
            }, { status: 400 });
        }

        const sql = `
            INSERT INTO oppp (hospcode, year_th, month_no, sentdata, service, service_pass, service_reject, d_update) 
            VALUES ? 
            ON DUPLICATE KEY UPDATE 
            sentdata = VALUES(sentdata),
            service = VALUES(service), 
            service_pass = VALUES(service_pass),
            service_reject = VALUES(service_reject),
            d_update = VALUES(d_update)
        `;

        const [result] = await pool.query<any>(sql, [validRows]);

        const firstRow = rawData.find(row => row.year_th && row.month_no);
        if (firstRow) {
            const yearTh = firstRow.year_th.toString().slice(-2);
            const monthNo = firstRow.month_no.toString().padStart(2, '0');
            const fileLog = yearTh + monthNo;

            const fileMetadataSql = `
                INSERT INTO fileupload (file_name, file_log, file_type, username, file_size, file_time)
                VALUES (?, ?, ?, ?, ?, ?)
             `;
            await pool.query(fileMetadataSql, [
                file.name,
                fileLog,
                'oppp',
                username,
                file.size,
                new Date()
            ]);
        }

        const response: any = {
            success: true,
            message: `Successfully processed ${validRows.length} rows`,
            affectedRows: result.affectedRows
        };
        if (warnings.length > 0) {
            response.warnings = `${warnings.length} hospcode(s) not found in hospital table: ${warnings.slice(0, 5).join(', ')}${warnings.length > 5 ? '...' : ''}`;
        }
        return NextResponse.json(response);

    } catch (error) {
        console.error('OPPP Upload handling error:', error);
        return NextResponse.json({ error: 'Internal server error processing file: ' + error }, { status: 500 });
    }
}
