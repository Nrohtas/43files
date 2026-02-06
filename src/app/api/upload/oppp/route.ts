import { NextRequest, NextResponse } from 'next/server';
import { pool } from '@/lib/db';
import { verifyToken } from '@/lib/jwt';
import * as XLSX from 'xlsx';
import { RowDataPacket } from 'mysql2';

export async function POST(request: NextRequest) {
    try {
        // Authenticate
        const authHeader = request.headers.get('Authorization');
        const token = authHeader?.split(' ')[1];
        if (!token) {
            return NextResponse.json({ success: false, error: 'Unauthorized: No token provided' }, { status: 401 });
        }

        const decoded = verifyToken(token);

        if (!decoded || typeof decoded !== 'object') {
            return NextResponse.json({ success: false, error: 'Unauthorized: Invalid token' }, { status: 401 });
        }

        if (!('username' in decoded)) {
            return NextResponse.json({ success: false, error: 'Unauthorized: Token missing username' }, { status: 401 });
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

        // Find header row dynamically
        const range = XLSX.utils.decode_range(sheet['!ref'] || 'A1');
        const rows = XLSX.utils.sheet_to_json(sheet, { header: 1, range: 0, defval: null });

        let headerRowIndex = 0;
        for (let i = 0; i < rows.length; i++) {
            const rowStr = JSON.stringify(rows[i] || []);
            if (rowStr.includes('แฟ้มข้อมูล')) {
                headerRowIndex = i;
                break;
            }
        }

        const jsonData = XLSX.utils.sheet_to_json(sheet, { range: headerRowIndex, defval: null });

        if (jsonData.length === 0) {
            throw new Error('File is empty or could not be parsed');
        }

        // 2. Fetch Hospital Data for Logic (hostype_new)
        const [hospitals] = await pool.query<RowDataPacket[]>('SELECT hospcode, hostype_new FROM hospital');
        const hospitalMap = new Map<string, string>();
        hospitals.forEach(h => {
            hospitalMap.set(String(h.hospcode), String(h.hostype_new));
        });

        // 3. Define Logic for status
        const calculateStatus = (hostype: string | null, serviceVal: any) => {
            const service = parseInt(serviceVal) || 0;
            const type = parseInt(hostype || '0');

            if ([13, 18, 21].includes(type)) return service > 99 ? 'Y' : 'N';
            if ([5, 12].includes(type)) return service > 9999 ? 'Y' : 'N';
            if ([8].includes(type)) return service > 499 ? 'Y' : 'N';
            if ([11].includes(type)) return service > 499 ? 'Y' : 'N';
            if ([7].includes(type)) return service > 4999 ? 'Y' : 'N';

            return 'N';
        };

        // 4. Calculate Fiscal Year (b_year)
        const today = new Date();
        const month = today.getMonth() + 1; // 1-12
        const yearAD = today.getFullYear();
        // If Oct-Dec (10,11,12), Fiscal Year is Next Year. Else Current Year.
        // Thai Year = AD + 543
        const fiscalYearAD = month >= 10 ? yearAD + 1 : yearAD;
        const b_year = String(fiscalYearAD + 543);

        // 5. Process Rows
        let successCount = 0;
        let failCount = 0;
        let firstError = '';

        // Columns required for OPPP
        // pass10, reject10, result10, status10, ...
        const months = ['10', '11', '12', '01', '02', '03', '04', '05', '06', '07', '08', '09'];

        for (const [index, row] of (jsonData as any[]).entries()) {
            const normalizedRow: any = {};
            for (const key in row) {
                normalizedRow[key] = row[key]; // Keep original case for now or normalize if headers vary
            }

            // FILTER: 'แฟ้มข้อมูล' == 'SERVICE'
            if (normalizedRow['แฟ้มข้อมูล'] !== 'SERVICE') {
                continue; // Skip non-SERVICE rows
            }

            // Extract hospcode (Keep only numbers)
            let hospcodeRaw = String(normalizedRow['หน่วยบริการ'] || '');
            const hospcode = hospcodeRaw.replace(/\D/g, '');

            if (!hospcode) {
                continue; // Skip if no hospcode
            }

            // Extract areacode from 'อำเภอ' (Keep only digits)
            const areacode = String(normalizedRow['อำเภอ'] || '').replace(/\D/g, '');

            const hostype_new = hospitalMap.get(hospcode) || null;

            // Build Insert Object
            const insertObj: any = {};
            insertObj.hospcode = hospcode;
            insertObj.b_year = b_year;
            insertObj.areacode = areacode; // New Requirement
            insertObj.id = `${hospcode}_${b_year}`; // Composite ID
            insertObj.d_update = new Date();
            insertObj.datafile = normalizedRow['แฟ้มข้อมูล'] || null; // เก็บค่าจากคอลัมน์แฟ้มข้อมูล

            // Loop months to map columns
            for (const m of months) {
                // Excel Columns: pass10, reject10, result10 ...
                // Map directly
                if (normalizedRow[`pass${m}`] !== undefined) insertObj[`pass${m}`] = normalizedRow[`pass${m}`];
                if (normalizedRow[`reject${m}`] !== undefined) insertObj[`reject${m}`] = normalizedRow[`reject${m}`];

                const resultVal = normalizedRow[`result${m}`];
                if (resultVal !== undefined) {
                    insertObj[`result${m}`] = resultVal;
                    // Calculate Status
                    insertObj[`status${m}`] = calculateStatus(hostype_new, resultVal);
                }
            }

            // Construct SQL
            const columns = Object.keys(insertObj);
            const values = Object.values(insertObj);
            const placeholders = columns.map(() => '?').join(', ');
            const updates = columns.map(col => `${col} = VALUES(${col})`).join(', ');

            const sql = `INSERT INTO oppp (${columns.join(', ')}) VALUES (${placeholders}) ON DUPLICATE KEY UPDATE ${updates}`;

            try {
                await pool.query(sql, values);
                successCount++;
            } catch (err: any) {
                if (!firstError) firstError = err.message;
                failCount++;
                console.error('Row Error:', err);
            }
        }

        // Insert log
        try {
            // Extract YYYYMM from filename (e.g., ..._202602_...)
            // Looks for 6 digits
            const match = file.name.match(/(\d{6})/);
            const fileLog = match ? match[0] : b_year; // Fallback to b_year if not found

            await pool.query(
                `INSERT INTO fileupload (file_name, file_type, file_size, file_time, file_log, username) 
                 VALUES (?, ?, ?, NOW(), ?, ?)`,
                [file.name, 'oppp', file.size, fileLog, username]
            );
        } catch (e) { }

        return NextResponse.json({
            success: true,
            processed: successCount,
            failed: failCount,
            error: firstError
        });

    } catch (error) {
        console.error('OPPP Upload Global Error:', error);
        return NextResponse.json({
            success: false,
            error: error instanceof Error ? error.message : 'Internal Server Error'
        }, { status: 500 });
    }
}
