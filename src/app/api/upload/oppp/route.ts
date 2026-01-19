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



        // 2. Prepare Insert/Update Query
        let successCount = 0;
        let failCount = 0;
        let periodLog = '';

        for (const [index, row] of (jsonData as any[]).entries()) {
            const normalizedRow: any = {};
            for (const key in row) {
                normalizedRow[key.toLowerCase()] = row[key];
            }

            let rawHospcode = normalizedRow['hospcode'];
            let hospcode = rawHospcode ? String(rawHospcode).replace(/\D/g, '') : '';

            if (!hospcode) {
                failCount++;
                continue;
            }

            const b_year = String(normalizedRow['b_year'] || normalizedRow['year_th'] || '');
            const month_no = normalizedRow['month_no'] ? String(normalizedRow['month_no']).padStart(2, '0') : '';

            if (!b_year || !month_no) {
                failCount++;
                continue;
            }

            if (!periodLog) periodLog = `${b_year}${month_no}`;

            const service = Number(normalizedRow['service'] || 0);
            const service_pass = Number(normalizedRow['service_pass'] || normalizedRow['service_approve'] || 0);
            const service_reject = Number(normalizedRow['service_reject'] || 0);
            const sentdata = normalizedRow['sentdata'] || (service > 189 ? 'Y' : 'N'); // Keep existing logic or use provided

            // Prepare Insert Data
            const insertData: any = {
                hospcode,
                b_year,
                month_no,
                service_pass,
                service_reject,
                service,
                sentdata,
                d_update: new Date()
            };

            const columns = Object.keys(insertData);
            const values = Object.values(insertData);
            const placeholders = columns.map(() => '?').join(', ');
            const updates = columns.map(col => `${col} = VALUES(${col})`).join(', ');

            const sql = `INSERT INTO oppp (hospcode, b_year, month_no, service_pass, service_reject, service, sentdata, d_update) 
                         VALUES (?, ?, ?, ?, ?, ?, ?, ?) 
                         ON DUPLICATE KEY UPDATE service_pass=VALUES(service_pass), service_reject=VALUES(service_reject), service=VALUES(service), sentdata=VALUES(sentdata), d_update=VALUES(d_update)`;

            try {
                await pool.query(sql, values);
                successCount++;
            } catch (err: any) {
                failCount++;
            }
        }

        const fileLog = periodLog || '-';
        try {
            await pool.query(
                `INSERT INTO fileupload (file_name, file_type, file_size, file_time, file_log, username) 
                 VALUES (?, ?, ?, NOW(), ?, ?)`,
                [file.name, 'oppp', file.size, fileLog, username]
            );
        } catch (e) { }

        return NextResponse.json({ success: true, processed: successCount, failed: failCount });
    } catch (error) {
        console.error('OPPP Upload Global Error:', error);
        return NextResponse.json({
            success: false,
            error: error instanceof Error ? error.message : 'Internal Server Error'
        }, { status: 500 });
    }
}
