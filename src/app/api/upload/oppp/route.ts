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

        const jsonData = XLSX.utils.sheet_to_json(sheet, { defval: null });

        if (jsonData.length === 0) {
            throw new Error('File is empty or could not be parsed');
        }

        console.log(`[OPPP Upload] Processing ${jsonData.length} rows from ${file.name}`);

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

        for (const [index, row] of (jsonData as any[]).entries()) {
            // Normalize keys to lowercase for matching
            const normalizedRow: any = {};
            for (const key in row) {
                normalizedRow[key.toLowerCase()] = row[key];
            }

            // Extract numeric hospcode
            let rawHospcode = normalizedRow['hospcode'];
            let hospcode = '';

            if (rawHospcode) {
                // Remove non-digits
                hospcode = String(rawHospcode).replace(/\D/g, '');
            }

            if (!hospcode) {
                // Try to fallback if user has weird column name?
                // But strict requirement says "column hospcode"
                if (failCount < 3) console.warn(`[OPPP Upload] Row ${index + 1} invalid/missing hospcode:`, JSON.stringify(row));
                failCount++;
                continue;
            }

            // Required fields
            // Assuming year_th, month_no are required for PK
            const year_th = String(normalizedRow['year_th'] || '');
            const month_no = normalizedRow['month_no'] ? String(normalizedRow['month_no']).padStart(2, '0') : '';

            if (!year_th || !month_no) {
                if (failCount < 3) console.warn(`[OPPP Upload] Row ${index + 1} missing year/month:`, JSON.stringify(row));
                failCount++;
                continue;
            }

            // Capture period for log
            if (!periodLog) periodLog = `${year_th}${month_no}`;

            const hostype_new = hospitalMap.get(hospcode);
            const service = Number(normalizedRow['service'] || 0);

            // Other fields
            // User requested service_approve -> service_pass
            // Assuming the Excel column name is also 'service_pass' OR mapping 'service_approve' to 'service_pass' in DB?
            // "service_approve แก้เป็น service_pass" likely means the DB column is service_pass (or user wants it to be) and maybe excel too.
            // But previous instruction said "column service_approve stores in table oppp field service_approve".
            // Now "service_approve -> service_pass". 
            // I will assume the target DB column is `service_pass` and read from `service_pass` (or fallback to approve).

            const service_pass = Number(normalizedRow['service_pass'] || normalizedRow['service_approve'] || 0);
            const service_reject = Number(normalizedRow['service_reject'] || 0);

            let sentdata = 'N';

            // Logic for sentdata (Same as HDC)
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
                service_pass, // Renamed from service_approve
                service_reject,
                service,
                sentdata,
                d_update: new Date()
            };

            const columns = Object.keys(insertData);
            const values = Object.values(insertData);

            const placeholders = columns.map(() => '?').join(', ');
            const updates = columns.map(col => `${col} = VALUES(${col})`).join(', ');

            const sql = `INSERT INTO oppp (${columns.join(', ')}) VALUES (${placeholders}) ON DUPLICATE KEY UPDATE ${updates}`;

            try {
                await pool.query(sql, values);
                successCount++;
            } catch (err: any) {
                if (!firstError) firstError = err.message;
                if (failCount < 5) console.error(`[OPPP Upload] DB Error row ${index + 1}:`, err.message);
                failCount++;
            }
        }

        const fileLog = periodLog || '-';

        // Insert log into fileupload table
        try {
            await pool.query(
                `INSERT INTO fileupload (file_name, file_type, file_size, file_time, file_log, username) 
                 VALUES (?, ?, ?, NOW(), ?, ?)`,
                [file.name, 'oppp', file.size, fileLog, username]
            );
        } catch (dbError) {
            console.error('Database logging error:', dbError);
        }

        console.log(`[OPPP Upload] Completed. Success: ${successCount}, Failed: ${failCount}`);

        if (successCount === 0 && failCount > 0) {
            return NextResponse.json({
                success: false,
                error: `All rows failed. First error: ${firstError}. Check server console for details.`
            }, { status: 400 });
        }

        return NextResponse.json({ success: true, processed: successCount, failed: failCount });
    } catch (error) {
        console.error('OPPP Upload Global Error:', error);
        return NextResponse.json({
            success: false,
            error: error instanceof Error ? error.message : 'Internal Server Error'
        }, { status: 500 });
    }
}
