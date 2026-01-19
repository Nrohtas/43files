import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';
import { pool } from '@/lib/db';
import { verifyToken } from '@/lib/jwt';
import * as XLSX from 'xlsx';
import { RowDataPacket } from 'mysql2';

export async function POST(request: NextRequest) {
    try {
        // Authenticate
        const authHeader = request.headers.get('Authorization');
        const token = authHeader?.split(' ')[1];
        const decoded = token ? verifyToken(token) : null;

        if (!decoded || typeof decoded !== 'object' || !('username' in decoded)) {
            return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
        }

        const username = (decoded as any).username || 'Unknown';

        const data = await request.formData();
        const file: File | null = data.get('file') as unknown as File;

        if (!file) {
            return NextResponse.json({ success: false, error: 'No file uploaded' }, { status: 400 });
        }

        const buffer = Buffer.from(await file.arrayBuffer());

        // 1. Read Excel
        const workbook = XLSX.read(buffer, { type: 'buffer' });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(sheet, { defval: null });

        if (jsonData.length === 0) {
            throw new Error('File is empty or could not be parsed');
        }



        // 2. Fetch Hospital Data for Logic (hostype_new)
        const [hospitals] = await pool.query<RowDataPacket[]>('SELECT hospcode, hostype_new FROM hospital');
        const hospitalMap = new Map<string, string>();
        hospitals.forEach(h => {
            hospitalMap.set(String(h.hospcode), String(h.hostype_new));
        });

        // 3. Define Logic for sentdata
        const calculateStatus = (hostype: string | null, serviceVal: any) => {
            const service = parseInt(serviceVal) || 0;
            const type = parseInt(hostype || '0');

            if ([13, 18, 21].includes(type)) return service > 99 ? 'Y' : 'N';
            if ([5, 12].includes(type)) return service > 9999 ? 'Y' : 'N';
            if (type === 8) return service > 499 ? 'Y' : 'N';
            if (type === 11) return service > 499 ? 'Y' : 'N';
            if (type === 7) return service > 4999 ? 'Y' : 'N';

            return 'N';
        };

        // 4. Process Rows
        let successCount = 0;
        let failCount = 0;
        let periodLog = '';
        let firstError = '';

        // List of all valid columns in 'hdc' to filter input
        const hdcColumns = [
            'id', 'hospcode', 'areacode', 'date_com', 'b_year', 'target', 'result',
            'result10', 'status10', 'result11', 'status11', 'result12', 'status12',
            'result01', 'status01', 'result02', 'status02', 'result03', 'status03',
            'result04', 'status04', 'result05', 'status05', 'result06', 'status06',
            'result07', 'status07', 'result08', 'status08', 'result09', 'status09'
        ];

        for (const [index, row] of (jsonData as any[]).entries()) {
            const normalizedRow: any = {};
            for (const key in row) {
                normalizedRow[key.toLowerCase()] = row[key];
            }

            // Required basic fields
            const hospcode = String(normalizedRow['hospcode'] || '');
            const b_year = String(normalizedRow['b_year'] || normalizedRow['year_th'] || '');
            const month_no = normalizedRow['month_no'] ? String(normalizedRow['month_no']).padStart(2, '0') : null;

            if (!hospcode || !b_year) {
                failCount++;
                continue;
            }

            if (!periodLog && month_no) periodLog = `${b_year}${month_no}`;

            const hostype_new = hospitalMap.get(hospcode) || null;
            const service = normalizedRow['service'] !== undefined ? normalizedRow['service'] : normalizedRow['result'];

            // Build dynamic insert object
            const insertObj: any = {};

            // 1. Copy matching fields from excel
            for (const col of hdcColumns) {
                if (normalizedRow[col] !== undefined) {
                    insertObj[col] = normalizedRow[col];
                }
            }

            // 2. Basic fields override
            insertObj.hospcode = hospcode;
            insertObj.b_year = b_year;
            insertObj.id = `${hospcode}_${b_year}`;
            insertObj.d_update = new Date();

            // 3. Monthly Logic: if month_no is present, we map 'service' to the right result/status columns
            if (month_no) {
                const resultCol = `result${month_no}`;
                const statusCol = `status${month_no}`;

                if (service !== undefined) {
                    insertObj[resultCol] = service;
                    insertObj[statusCol] = calculateStatus(hostype_new, service);
                }
            }

            // Construct SQL
            const columns = Object.keys(insertObj);
            const values = Object.values(insertObj);
            const placeholders = columns.map(() => '?').join(', ');
            const updates = columns.map(col => `${col} = VALUES(${col})`).join(', ');

            const sql = `INSERT INTO hdc (${columns.join(', ')}) VALUES (${placeholders}) ON DUPLICATE KEY UPDATE ${updates}`;

            try {
                await pool.query(sql, values);
                successCount++;
            } catch (err: any) {
                if (!firstError) firstError = err.message;
                failCount++;
            }
        }

        // Insert log
        const fileLog = periodLog || '-';
        try {
            await pool.query(
                `INSERT INTO fileupload (file_name, file_type, file_size, file_time, file_log, username) 
                 VALUES (?, ?, ?, NOW(), ?, ?)`,
                [file.name, 'hdc', file.size, fileLog, username]
            );
        } catch (e) { }

        return NextResponse.json({ success: true, processed: successCount, failed: failCount });
    } catch (error) {
        console.error('HDC Upload Global Error:', error);
        return NextResponse.json({
            success: false,
            error: error instanceof Error ? error.message : 'Internal Server Error'
        }, { status: 500 });
    }
}
