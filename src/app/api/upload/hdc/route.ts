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
        // const username = data.get('username') as string || 'Unknown'; // Use token username instead

        if (!file) {
            return NextResponse.json({ success: false, error: 'No file uploaded' }, { status: 400 });
        }

        const buffer = Buffer.from(await file.arrayBuffer());
        const uploadDir = path.join(process.cwd(), 'fileupload');

        try {
            await mkdir(uploadDir, { recursive: true });
        } catch (e) {
            // Directory likely exists
        }

        const filePath = path.join(uploadDir, file.name);
        await writeFile(filePath, buffer);

        // --- Process File Logic ---

        // 1. Read Excel
        const workbook = XLSX.read(buffer, { type: 'buffer' });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];

        // Use raw: false to try and get formatted strings, but usually raw: true is safer for numbers.
        // Let's use clean raw data.
        const jsonData = XLSX.utils.sheet_to_json(sheet, { defval: null });

        if (jsonData.length === 0) {
            throw new Error('File is empty or could not be parsed');
        }

        console.log(`[HDC Upload] Processing ${jsonData.length} rows from ${file.name}`);

        // 2. Fetch Hospital Data for Logic
        const [hospitals] = await pool.query<RowDataPacket[]>('SELECT hospcode, hostype_new FROM hospital');
        const hospitalMap = new Map<string, string>();
        hospitals.forEach(h => {
            hospitalMap.set(String(h.hospcode), String(h.hostype_new));
        });

        // 3. Prepare Insert/Update Query
        let successCount = 0;
        let failCount = 0;
        let periodLog = '';
        let firstError = '';

        // Valid columns in 'hdc' table (lowercase)
        // From schema check: hospcode, year_th, month_no, sentdata, service, d_update
        const validColumns = ['hospcode', 'year_th', 'month_no', 'sentdata', 'service', 'd_update'];

        for (const [index, row] of (jsonData as any[]).entries()) {
            // Normalize keys to lowercase for matching
            const normalizedRow: any = {};
            for (const key in row) {
                normalizedRow[key.toLowerCase()] = row[key];
            }

            // Ensure required PKs exist
            if (!normalizedRow['hospcode'] || !normalizedRow['year_th'] || !normalizedRow['month_no']) {
                // If missing vital keys, skip (but log first few)
                if (failCount < 3) console.warn(`[HDC Upload] Row ${index + 1} missing PKs:`, JSON.stringify(row));
                failCount++;
                continue;
            }

            const hospcode = String(normalizedRow['hospcode']);
            const year_th = String(normalizedRow['year_th']);
            const month_no = String(normalizedRow['month_no']).padStart(2, '0'); // Ensure '1' -> '01'

            // Capture period for log (YYYYMM)
            if (!periodLog) periodLog = `${year_th}${month_no}`;

            const hostype_new = hospitalMap.get(hospcode);
            const service = Number(normalizedRow['service'] || 0);
            let sentdata = 'N';

            // Logic for sentdata
            if (hospcode === '10613') {
                sentdata = service > 129 ? 'Y' : 'N';
            } else if (hostype_new) {
                if (['13', '18', '21'].includes(hostype_new)) {
                    sentdata = service > 199 ? 'Y' : 'N';
                } else if (['5', '12'].includes(hostype_new)) {
                    sentdata = service > 19999 ? 'Y' : 'N';
                } else if (hostype_new === '8') {
                    sentdata = service > 999 ? 'Y' : 'N';
                } else if (hostype_new === '11') {
                    sentdata = service > 599 ? 'Y' : 'N';
                } else if (hostype_new === '7') {
                    sentdata = service > 7999 ? 'Y' : 'N';
                } else {
                    sentdata = 'N';
                }
            } else {
                sentdata = 'N';
            }

            // Prepare Insert Data
            const insertData: any = {
                hospcode,
                year_th,
                month_no,
                service,
                sentdata,
                d_update: new Date() // Set current timestamp
            };

            const columns = Object.keys(insertData);
            const values = Object.values(insertData); // all defined now

            const placeholders = columns.map(() => '?').join(', ');
            const updates = columns.map(col => `${col} = VALUES(${col})`).join(', ');

            const sql = `INSERT INTO hdc (${columns.join(', ')}) VALUES (${placeholders}) ON DUPLICATE KEY UPDATE ${updates}`;

            try {
                await pool.query(sql, values);
                successCount++;
            } catch (err: any) {
                if (!firstError) firstError = err.message;
                if (failCount < 5) console.error(`[HDC Upload] DB Error row ${index + 1}:`, err.message);
                failCount++;
            }
        }

        const fileLog = periodLog || '-';

        // Insert log into fileupload table
        try {
            const finalLog = `OK:${successCount},Err:${failCount}`;
            await pool.query(
                `INSERT INTO fileupload (file_name, file_type, file_size, file_time, file_log, username) 
                 VALUES (?, ?, ?, NOW(), ?, ?)`,
                [file.name, 'hdc', file.size, fileLog, username]
            );
        } catch (dbError) {
            console.error('Database logging error:', dbError);
        }

        console.log(`[HDC Upload] Completed. Success: ${successCount}, Failed: ${failCount}`);

        if (successCount === 0 && failCount > 0) {
            return NextResponse.json({
                success: false,
                error: `All rows failed. First error: ${firstError}. Check server console for details.`
            }, { status: 400 });
        }

        return NextResponse.json({ success: true, processed: successCount, failed: failCount });
    } catch (error) {
        console.error('HDC Upload Global Error:', error);
        return NextResponse.json({
            success: false,
            error: error instanceof Error ? error.message : 'Internal Server Error'
        }, { status: 500 });
    }
}
