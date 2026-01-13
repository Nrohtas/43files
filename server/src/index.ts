
import express, { Request, Response } from 'express';
import mysql from 'mysql2';
import cors from 'cors';
import dotenv from 'dotenv';
import multer from 'multer';
import * as xlsx from 'xlsx';

// Load environment variables
const envFile = process.env.NODE_ENV === 'production' ? '.env.production' : '.env';
dotenv.config({ path: envFile });
console.log(`Loaded environment from ${envFile}`);

// Create Express app
const app = express();
const port = process.env.PORT || 3000;

// Enable CORS
app.use(cors());
app.use(express.json());

// Database connection configuration
const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || 'root',
    database: process.env.DB_NAME || '43files'
};

// Create a connection pool
const pool = mysql.createPool(dbConfig);

// Test database connection
pool.getConnection((err, connection) => {
    if (err) {
        console.error('Error connecting to database:', err);
    } else {
        console.log('Successfully connected to MySQL database: 43files');
        connection.release();
    }
});

// Configure Multer for memory storage (process files in RAM)
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// Health Check Endpoint
app.get('/', (req: Request, res: Response) => {
    res.json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        service: '43files-api'
    });
});


// API endpoint to login
app.post('/api/login', (req: Request, res: Response) => {
    const { username, password } = req.body;

    if (!username || !password) {
        res.status(400).json({ error: 'Username and password are required' });
        return;
    }

    const sql = 'SELECT * FROM users WHERE username = ? AND password = ?'; // In production, use hashed passwords!

    pool.query(sql, [username, password], (err, results: any) => {
        if (err) {
            console.error('Login error:', err);
            res.status(500).json({ error: 'Database error' });
            return;
        }

        if (results.length > 0) {
            const user = results[0];
            res.json({
                success: true,
                user: {
                    username: user.username,  // Return username
                    role: user.level || 'user', // Use 'level' field from database
                    email: user.email,
                    fname: user.fname,
                    lname: user.lname
                }
            });
        } else {
            res.status(401).json({ error: 'Invalid credentials' });
        }
    });
});

// Endpoint to upload HDC Excel file
app.post('/api/upload/hdc', upload.single('file'), async (req: Request, res: Response) => {
    try {
        if (!req.file) {
            res.status(400).json({ error: 'No file uploaded' });
            return;
        }

        // Function to calculate sentdata based on hostype_new and service value
        const calculateSentdata = (hostype: number | null, service: number): string => {
            if (hostype === null || hostype === undefined) return 'N';

            // hostype_new in (13,18,21): service > 199 = Y
            if ([13, 18, 21].includes(hostype)) {
                return service > 199 ? 'Y' : 'N';
            }
            // hostype_new in (5,12): service > 19999 = Y
            if ([5, 12].includes(hostype)) {
                return service > 19999 ? 'Y' : 'N';
            }
            // hostype_new in (8): service > 999 = Y
            if (hostype === 8) {
                return service > 999 ? 'Y' : 'N';
            }
            // hostype_new in (11): service > 599 = Y
            if (hostype === 11) {
                return service > 599 ? 'Y' : 'N';
            }
            // hostype_new in (7): service > 7999 = Y
            if (hostype === 7) {
                return service > 7999 ? 'Y' : 'N';
            }

            // Default fallback for other hostype values
            return 'N';
        };

        // Pre-fetch hospital types from database
        const hospitalTypesPromise = new Promise<Map<string, number>>((resolve, reject) => {
            pool.query('SELECT hospcode, hostype_new FROM hospital', (err, results: any) => {
                if (err) {
                    reject(err);
                    return;
                }
                const hospTypeMap = new Map<string, number>();
                results.forEach((row: any) => {
                    // Convert hostype_new to number to ensure proper comparison
                    const hostype = parseInt(row.hostype_new);
                    hospTypeMap.set(row.hospcode, hostype);
                });
                resolve(hospTypeMap);
            });
        });

        const hospTypeMap = await hospitalTypesPromise;

        const workbook = xlsx.read(req.file.buffer, { type: 'buffer' });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];

        const rawData = xlsx.utils.sheet_to_json(sheet) as any[];

        if (rawData.length === 0) {
            res.status(400).json({ error: 'Excel file is empty' });
            return;
        }

        const validRows: any[] = [];
        const warnings: string[] = [];

        rawData.forEach((row) => {
            if (!row.hospcode || !row.year_th || !row.month_no || row.service === undefined || row.service === null) {
                return;
            }

            const serviceValue = parseFloat(row.service) || 0;
            const hospcode = row.hospcode.toString();
            const hostype = hospTypeMap.get(hospcode);

            // Warning if hospcode not found in hospital table
            if (hostype === undefined) {
                if (!warnings.includes(hospcode)) {
                    warnings.push(hospcode);
                }
            }

            const sentdataValue = calculateSentdata(hostype || null, serviceValue);

            // Debug logging for the first few records
            if (validRows.length < 5) {
                console.log(`DEBUG: hospcode=${hospcode}, hostype=${hostype}, service=${serviceValue}, sentdata=${sentdataValue}`);
            }

            // Ensure month_no is 2-digit format
            const monthNo = row.month_no.toString().padStart(2, '0');

            validRows.push([
                hospcode,
                row.year_th,
                monthNo,
                sentdataValue,
                serviceValue,
                new Date()
            ]);
        });

        if (validRows.length === 0) {
            res.status(400).json({ error: 'No valid rows found to insert' });
            return;
        }

        const sql = `
            INSERT INTO hdc (hospcode, year_th, month_no, sentdata, service, d_update) 
            VALUES ? 
            ON DUPLICATE KEY UPDATE 
            sentdata = VALUES(sentdata),
            service = VALUES(service), 
            d_update = VALUES(d_update)
        `;

        pool.query(sql, [validRows], (err, result: any) => {
            if (err) {
                console.error('Insert error:', err);
                res.status(500).json({ error: 'Database insertion error' });
                return;
            }

            // Extract metadata for fileupload table
            // Get year_th and month_no from the first valid row (assuming all rows have same period)
            const firstRow = rawData.find(row => row.year_th && row.month_no);

            if (firstRow && req.file) {
                const yearTh = firstRow.year_th.toString().slice(-2); // Get last 2 digits (e.g., 2568 -> 68)
                const monthNo = firstRow.month_no.toString().padStart(2, '0'); // Ensure 2 digits
                const fileLog = yearTh + monthNo; // Combine (e.g., "6810")

                // Get username from request body
                const username = req.body.username || null;

                const fileMetadataSql = `
                    INSERT INTO fileupload (file_name, file_log, file_type, username, file_size, file_time)
                    VALUES (?, ?, ?, ?, ?, ?)
                `;

                const fileMetadata = [
                    req.file.originalname,
                    fileLog,
                    'hdc',
                    username,
                    req.file.size, // Size in bytes
                    new Date()
                ];

                pool.query(fileMetadataSql, fileMetadata, (fileErr) => {
                    if (fileErr) {
                        console.error('File metadata insert error:', fileErr);
                        // Don't fail the main operation, just log the error
                    } else {
                        console.log(`File metadata logged: ${req.file!.originalname} (${fileLog}) by ${username || 'unknown'}`);
                    }
                });
            }

            const response: any = {
                success: true,
                message: `Successfully processed ${validRows.length} rows`,
                affectedRows: result.affectedRows
            };

            if (warnings.length > 0) {
                response.warnings = `${warnings.length} hospcode(s) not found in hospital table: ${warnings.slice(0, 5).join(', ')}${warnings.length > 5 ? '...' : ''}`;
            }

            res.json(response);
        });

    } catch (error) {
        console.error('Upload handling error:', error);
        res.status(500).json({ error: 'Internal server error processing file' });
    }
});

// Endpoint to upload OPPP Excel file
app.post('/api/upload/oppp', upload.single('file'), async (req: Request, res: Response) => {
    try {
        if (!req.file) {
            res.status(400).json({ error: 'No file uploaded' });
            return;
        }

        // Function to calculate sentdata for OPPP based on hostype_new and service value
        // Using similar logic to HDC for consistency
        const calculateSentdata = (hostype: number | null, service: number): string => {
            if (hostype === null || hostype === undefined) return 'N';

            // hostype_new in (13,18,21): service > 199 = Y
            if ([13, 18, 21].includes(hostype)) {
                return service > 199 ? 'Y' : 'N';
            }
            // hostype_new in (5,12): service > 19999 = Y
            if ([5, 12].includes(hostype)) {
                return service > 19999 ? 'Y' : 'N';
            }
            // hostype_new in (8): service > 999 = Y
            if (hostype === 8) {
                return service > 999 ? 'Y' : 'N';
            }
            // hostype_new in (11): service > 599 = Y
            if (hostype === 11) {
                return service > 599 ? 'Y' : 'N';
            }
            // hostype_new in (7): service > 7999 = Y
            if (hostype === 7) {
                return service > 7999 ? 'Y' : 'N';
            }

            // Default fallback for other hostype values
            return 'N';
        };

        // Pre-fetch hospital types from database
        const hospitalTypesPromise = new Promise<Map<string, number>>((resolve, reject) => {
            pool.query('SELECT hospcode, hostype_new FROM hospital', (err, results: any) => {
                if (err) {
                    reject(err);
                    return;
                }
                const hospTypeMap = new Map<string, number>();
                results.forEach((row: any) => {
                    const hostype = parseInt(row.hostype_new);
                    hospTypeMap.set(row.hospcode, hostype);
                });
                resolve(hospTypeMap);
            });
        });

        const hospTypeMap = await hospitalTypesPromise;

        const workbook = xlsx.read(req.file.buffer, { type: 'buffer' });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];

        const rawData = xlsx.utils.sheet_to_json(sheet) as any[];

        if (rawData.length === 0) {
            res.status(400).json({ error: 'Excel file is empty' });
            return;
        }

        const validRows: any[] = [];
        const warnings: string[] = [];

        rawData.forEach((row) => {
            if (!row.hospcode || !row.year_th || !row.month_no || row.service === undefined || row.service === null) {
                return;
            }

            const serviceValue = parseFloat(row.service) || 0;
            const serviceApprove = parseFloat(row.service_approve) || 0;
            const serviceReject = parseFloat(row.service_reject) || 0;
            // Sanitize hospcode: remove all non-numeric characters
            const hospcode = row.hospcode.toString().replace(/\D/g, '');
            const hostype = hospTypeMap.get(hospcode);

            // Warning if hospcode not found in hospital table
            if (hostype === undefined) {
                if (!warnings.includes(hospcode)) {
                    warnings.push(hospcode);
                }
            }

            const sentdataValue = calculateSentdata(hostype || null, serviceValue);

            // Debug logging for the first few records
            if (validRows.length < 5) {
                console.log(`DEBUG OPPP: hospcode=${hospcode}, hostype=${hostype}, service=${serviceValue}, approve=${serviceApprove}, reject=${serviceReject}, sentdata=${sentdataValue}`);
            }

            // Ensure month_no is 2-digit format
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
            const firstRowHeaders = rawData.length > 0 ? Object.keys(rawData[0]).join(', ') : 'None';
            console.log('DEBUG: OPPP Upload Failed. Detected headers:', firstRowHeaders);
            res.status(400).json({
                error: `No valid rows found. Missing required columns (hospcode, year_th, month_no, service). Detected headers: ${firstRowHeaders}`
            });
            return;
        }

        const sql = `
            INSERT INTO oppp (hospcode, year_th, month_no, sentdata, service, service_approve, service_reject, d_update) 
            VALUES ? 
            ON DUPLICATE KEY UPDATE 
            sentdata = VALUES(sentdata),
            service = VALUES(service), 
            service_approve = VALUES(service_approve),
            service_reject = VALUES(service_reject),
            d_update = VALUES(d_update)
        `;

        pool.query(sql, [validRows], (err, result: any) => {
            if (err) {
                console.error('Insert error:', err);
                res.status(500).json({ error: 'Database insertion error: ' + err.message });
                return;
            }

            // Extract metadata for fileupload table
            const firstRow = rawData.find(row => row.year_th && row.month_no);

            if (firstRow && req.file) {
                const yearTh = firstRow.year_th.toString().slice(-2); // Get last 2 digits
                const monthNo = firstRow.month_no.toString().padStart(2, '0');
                const fileLog = yearTh + monthNo;

                // Get username from request body
                const username = req.body.username || null;

                const fileMetadataSql = `
                    INSERT INTO fileupload (file_name, file_log, file_type, username, file_size, file_time)
                    VALUES (?, ?, ?, ?, ?, ?)
                `;

                const fileMetadata = [
                    req.file.originalname,
                    fileLog,
                    'oppp',
                    username,
                    req.file.size,
                    new Date()
                ];

                pool.query(fileMetadataSql, fileMetadata, (fileErr) => {
                    if (fileErr) {
                        console.error('File metadata insert error:', fileErr);
                    } else {
                        console.log(`File metadata logged: ${req.file!.originalname} (${fileLog}) by ${username || 'unknown'}`);
                    }
                });
            }

            const response: any = {
                success: true,
                message: `Successfully processed ${validRows.length} rows`,
                affectedRows: result.affectedRows
            };

            if (warnings.length > 0) {
                response.warnings = `${warnings.length} hospcode(s) not found in hospital table: ${warnings.slice(0, 5).join(', ')}${warnings.length > 5 ? '...' : ''}`;
            }

            res.json(response);
        });

    } catch (error) {
        console.error('OPPP upload handling error:', error);
        res.status(500).json({ error: 'Internal server error processing file' });
    }
});

// Unit Interface
interface Unit43Sent {
    hospcode: string;
    hospname: string;
    amp_code: string;
    amp_name: string;
    sentdata?: string;
}

// API endpoint for 43 files submission status (HDC)
app.get('/api/hdc/:district', (req: Request, res: Response) => {
    const district = req.params.district;
    const hostype = req.query.hostype as string | undefined;
    const year = req.query.year as string || '2568'; // Default to 2568

    // Fiscal Year Logic:
    // User selects Year X (e.g., 2569).
    // - Months 10, 11, 12 come from Previous Year (X - 1) -> 2568
    // - Months 01 - 09 come from Current Year (X) -> 2569

    const currentYearInt = parseInt(year);
    const prevYearInt = currentYearInt - 1;
    const prevYear = prevYearInt.toString();

    let sql = `
        SELECT 
            h.hospcode,
            h.hospname,
            h.hostype_new,
            MAX(CASE WHEN hdc.month_no = '10' THEN hdc.sentdata END) as month_10,
            MAX(CASE WHEN hdc.month_no = '11' THEN hdc.sentdata END) as month_11,
            MAX(CASE WHEN hdc.month_no = '12' THEN hdc.sentdata END) as month_12,
            MAX(CASE WHEN hdc.month_no = '01' THEN hdc.sentdata END) as month_13,
            MAX(CASE WHEN hdc.month_no = '02' THEN hdc.sentdata END) as month_14,
            MAX(CASE WHEN hdc.month_no = '03' THEN hdc.sentdata END) as month_15,
            MAX(CASE WHEN hdc.month_no = '04' THEN hdc.sentdata END) as month_16,
            MAX(CASE WHEN hdc.month_no = '05' THEN hdc.sentdata END) as month_17,
            MAX(CASE WHEN hdc.month_no = '06' THEN hdc.sentdata END) as month_18,
            MAX(CASE WHEN hdc.month_no = '07' THEN hdc.sentdata END) as month_19,
            MAX(CASE WHEN hdc.month_no = '08' THEN hdc.sentdata END) as month_20,
            MAX(CASE WHEN hdc.month_no = '09' THEN hdc.sentdata END) as month_21
        FROM hospital h
        LEFT JOIN hdc ON h.hospcode = hdc.hospcode AND (
            (hdc.year_th = ? AND hdc.month_no IN ('01', '02', '03', '04', '05', '06', '07', '08', '09'))
            OR
            (hdc.year_th = ? AND hdc.month_no IN ('10', '11', '12'))
        )
        LEFT JOIN hostype ht ON h.hostype_new = ht.hostype_new
        WHERE h.amp_code = ?
    `;

    const params: any[] = [year, prevYear, district];

    // Add hostype filter if provided
    if (hostype) {
        sql += ' AND ht.hostype_name = ?';
        params.push(hostype);
    }

    sql += ' GROUP BY h.hospcode, h.hospname, h.hostype_new ORDER BY h.hospcode ASC';

    console.log('--- Executing Fiscal Query ---');
    console.log('Params:', params);
    // console.log('SQL:', sql); // Uncomment if needed

    pool.query(sql, params, (err, results: any) => {
        if (err) {
            console.error('Error executing query:', err);
            res.status(500).json({ error: 'Database error' });
            return;
        }

        const units = results.map((row: any) => {
            const months = [
                row.month_10,  // ต.ค.
                row.month_11,  // พ.ย.
                row.month_12,  // ธ.ค.
                row.month_13,  // ม.ค.
                row.month_14,  // ก.พ.
                row.month_15,  // มี.ค.
                row.month_16,  // เม.ย.
                row.month_17,  // พ.ค.
                row.month_18,  // มิ.ย.
                row.month_19,  // ก.ค.
                row.month_20,  // ส.ค.
                row.month_21   // ก.ย.
            ];

            return {
                code: row.hospcode,
                name: row.hospname,
                hostype: row.hostype_new,
                months: months
            };
        });

        res.json(units);
    });
});

// API endpoint for OPPP monthly submission data
app.get('/api/oppp/:district', (req: Request, res: Response) => {
    const district = req.params.district;
    const hostype = req.query.hostype as string | undefined;
    const year = req.query.year as string || '2568'; // Default to 2568

    // Fiscal Year Logic:
    // User selects Year X (e.g., 2569).
    // - Months 10, 11, 12 come from Previous Year (X - 1) -> 2568
    // - Months 01 - 09 come from Current Year (X) -> 2569

    const currentYearInt = parseInt(year);
    const prevYearInt = currentYearInt - 1;
    const prevYear = prevYearInt.toString();

    let sql = `
        SELECT 
            h.hospcode,
            h.hospname,
            h.hostype_new,
            MAX(CASE WHEN oppp.month_no = '10' THEN oppp.sentdata END) as month_10,
            MAX(CASE WHEN oppp.month_no = '11' THEN oppp.sentdata END) as month_11,
            MAX(CASE WHEN oppp.month_no = '12' THEN oppp.sentdata END) as month_12,
            MAX(CASE WHEN oppp.month_no = '01' THEN oppp.sentdata END) as month_13,
            MAX(CASE WHEN oppp.month_no = '02' THEN oppp.sentdata END) as month_14,
            MAX(CASE WHEN oppp.month_no = '03' THEN oppp.sentdata END) as month_15,
            MAX(CASE WHEN oppp.month_no = '04' THEN oppp.sentdata END) as month_16,
            MAX(CASE WHEN oppp.month_no = '05' THEN oppp.sentdata END) as month_17,
            MAX(CASE WHEN oppp.month_no = '06' THEN oppp.sentdata END) as month_18,
            MAX(CASE WHEN oppp.month_no = '07' THEN oppp.sentdata END) as month_19,
            MAX(CASE WHEN oppp.month_no = '08' THEN oppp.sentdata END) as month_20,
            MAX(CASE WHEN oppp.month_no = '09' THEN oppp.sentdata END) as month_21
        FROM hospital h
        LEFT JOIN oppp ON h.hospcode = oppp.hospcode AND (
            (oppp.year_th = ? AND oppp.month_no IN ('01', '02', '03', '04', '05', '06', '07', '08', '09'))
            OR
            (oppp.year_th = ? AND oppp.month_no IN ('10', '11', '12'))
        )
        LEFT JOIN hostype ht ON h.hostype_new = ht.hostype_new
        WHERE h.amp_code = ?
    `;

    const params: any[] = [year, prevYear, district];

    // Add hostype filter if provided
    if (hostype) {
        sql += ' AND ht.hostype_name = ?';
        params.push(hostype);
    }

    sql += ' GROUP BY h.hospcode, h.hospname, h.hostype_new ORDER BY h.hospcode ASC';

    console.log('--- Executing OPPP Fiscal Query ---');
    console.log('Params:', params);
    // console.log('SQL:', sql); // Uncomment if needed

    pool.query(sql, params, (err, results: any) => {
        if (err) {
            console.error('Error executing query:', err);
            res.status(500).json({ error: 'Database error' });
            return;
        }

        const units = results.map((row: any) => {
            const months = [
                row.month_10,  // ต.ค.
                row.month_11,  // พ.ย.
                row.month_12,  // ธ.ค.
                row.month_13,  // ม.ค.
                row.month_14,  // ก.พ.
                row.month_15,  // มี.ค.
                row.month_16,  // เม.ย.
                row.month_17,  // พ.ค.
                row.month_18,  // มิ.ย.
                row.month_19,  // ก.ค.
                row.month_20,  // ส.ค.
                row.month_21   // ก.ย.
            ];

            return {
                code: row.hospcode,
                name: row.hospname,
                hostype: row.hostype_new,
                months: months
            };
        });

        res.json(units);
    });
});

// API endpoint to get list of hostype (affiliation types)
app.get('/api/hostypes', (req: Request, res: Response) => {
    const sql = `
        SELECT MIN(hostype_new) as code, hostype_name as name 
        FROM hostype 
        GROUP BY hostype_name 
        ORDER BY 
            CASE 
                WHEN hostype_name = 'สังกัดอื่น' THEN 2
                ELSE 1
            END,
            MIN(hostype_new) ASC
    `;

    pool.query(sql, (err, results: any) => {
        if (err) {
            console.error('Error executing query:', err);
            res.status(500).json({ error: 'Database error' });
            return;
        }

        const hostypes = results.map((row: any) => ({
            code: row.code,
            name: row.name
        }));

        res.json(hostypes);
    });
});


// API endpoint for district summary - shows total units for each district
app.get('/api/districts/summary', (req: Request, res: Response) => {
    const year = req.query.year as string || '2568';
    const month = req.query.month as string || '11'; // Default to November

    const sql = `
        SELECT 
            h.amp_code,
            a.amp_name,
            COUNT(DISTINCT h.hospcode) as total_units,
            SUM(CASE WHEN UPPER(hdc.sentdata) = 'Y' THEN 1 ELSE 0 END) as submitted,
            SUM(CASE WHEN UPPER(IFNULL(hdc.sentdata, 'N')) != 'Y' THEN 1 ELSE 0 END) as missing
        FROM hospital h
        LEFT JOIN ampur a ON h.amp_code = a.amp_code
        LEFT JOIN hdc ON h.hospcode = hdc.hospcode 
            AND hdc.year_th = ? 
            AND hdc.month_no = ?
        GROUP BY h.amp_code, a.amp_name
        ORDER BY h.amp_code ASC
    `;

    pool.query(sql, [year, month], (err, results: any) => {
        if (err) {
            console.error('Error executing query:', err);
            res.status(500).json({ error: 'Database error' });
            return;
        }

        const summary = results.map((row: any) => ({
            code: row.amp_code,
            name: row.amp_name,
            totalUnits: parseInt(row.total_units) || 0,
            submitted: parseInt(row.submitted) || 0,
            missing: parseInt(row.missing) || 0
        }));

        res.json(summary);
    });
});


// API endpoint for all missing units across the province (grouped by district)
app.get('/api/missing-units/all', (req: Request, res: Response) => {
    const year = req.query.year as string || '2568';
    const month = req.query.month as string || '11';

    const sql = `
        SELECT 
            h.amp_code,
            a.amp_name,
            h.hospcode,
            h.hospname
        FROM hospital h
        LEFT JOIN ampur a ON h.amp_code = a.amp_code
        LEFT JOIN hdc ON h.hospcode = hdc.hospcode 
            AND hdc.year_th = ? 
            AND hdc.month_no = ?
        WHERE UPPER(IFNULL(hdc.sentdata, 'N')) != 'Y'
        ORDER BY h.amp_code ASC, h.hospcode ASC
    `;

    pool.query(sql, [year, month], (err, results: any) => {
        if (err) {
            console.error('Error executing query:', err);
            res.status(500).json({ error: 'Database error' });
            return;
        }

        // Group by district
        const grouped: { [key: string]: any } = {};

        results.forEach((row: any) => {
            if (!grouped[row.amp_code]) {
                grouped[row.amp_code] = {
                    districtCode: row.amp_code,
                    districtName: row.amp_name,
                    units: []
                };
            }

            grouped[row.amp_code].units.push({
                code: row.hospcode,
                name: row.hospname
            });
        });

        // Convert to array
        const response = Object.values(grouped);
        res.json(response);
    });
});

// ==========================================
// OPPP Summary Endpoints
// ==========================================

// API endpoint for OPPP district summary
app.get('/api/oppp/districts/summary', (req: Request, res: Response) => {
    const year = req.query.year as string || '2568';
    const month = req.query.month as string || '11'; // Default to November

    const sql = `
        SELECT 
            h.amp_code,
            a.amp_name,
            COUNT(DISTINCT h.hospcode) as total_units,
            SUM(CASE WHEN UPPER(oppp.sentdata) = 'Y' THEN 1 ELSE 0 END) as submitted,
            SUM(CASE WHEN UPPER(IFNULL(oppp.sentdata, 'N')) != 'Y' THEN 1 ELSE 0 END) as missing
        FROM hospital h
        LEFT JOIN ampur a ON h.amp_code = a.amp_code
        LEFT JOIN oppp ON h.hospcode = oppp.hospcode 
            AND oppp.year_th = ? 
            AND oppp.month_no = ?
        GROUP BY h.amp_code, a.amp_name
        ORDER BY h.amp_code ASC
    `;

    pool.query(sql, [year, month], (err, results: any) => {
        if (err) {
            console.error('Error executing OPPP summary query:', err);
            res.status(500).json({ error: 'Database error' });
            return;
        }

        const summary = results.map((row: any) => ({
            code: row.amp_code,
            name: row.amp_name,
            totalUnits: parseInt(row.total_units) || 0,
            submitted: parseInt(row.submitted) || 0,
            missing: parseInt(row.missing) || 0
        }));

        res.json(summary);
    });
});

// ==========================================
// Upload History Endpoint
// ==========================================

app.get('/api/uploads/history', (req: Request, res: Response) => {
    const sql = `
        SELECT * FROM fileupload 
        ORDER BY file_time DESC 
        LIMIT 5
    `;

    pool.query(sql, (err, results: any) => {
        if (err) {
            console.error('Error fetching upload history:', err);
            res.status(500).json({ error: 'Database error' });
            return;
        }

        res.json(results);
    });
});


// API endpoint for all missing units across the province for OPPP (grouped by district)
app.get('/api/oppp/missing-units/all', (req: Request, res: Response) => {
    const year = req.query.year as string || '2568';
    const month = req.query.month as string || '11';

    const sql = `
        SELECT 
            h.amp_code,
            a.amp_name,
            h.hospcode,
            h.hospname
        FROM hospital h
        LEFT JOIN ampur a ON h.amp_code = a.amp_code
        LEFT JOIN oppp ON h.hospcode = oppp.hospcode 
            AND oppp.year_th = ? 
            AND oppp.month_no = ?
        WHERE UPPER(IFNULL(oppp.sentdata, 'N')) != 'Y'
        ORDER BY h.amp_code ASC, h.hospcode ASC
    `;

    pool.query(sql, [year, month], (err, results: any) => {
        if (err) {
            console.error('Error executing OPPP missing units query:', err);
            res.status(500).json({ error: 'Database error' });
            return;
        }

        // Group by district
        const grouped: { [key: string]: any } = {};

        results.forEach((row: any) => {
            if (!grouped[row.amp_code]) {
                grouped[row.amp_code] = {
                    districtCode: row.amp_code,
                    districtName: row.amp_name,
                    units: []
                };
            }

            grouped[row.amp_code].units.push({
                code: row.hospcode,
                name: row.hospname
            });
        });

        // Convert to array
        const response = Object.values(grouped);
        res.json(response);
    });
});


// API endpoint to get list of available years
app.get('/api/years', (req: Request, res: Response) => {
    const sql = 'SELECT DISTINCT year_th FROM hdc ORDER BY year_th DESC';

    pool.query(sql, (err, results: any) => {
        if (err) {
            console.error('Error executing query:', err);
            res.status(500).json({ error: 'Database error' });
            return;
        }

        const years = results.map((row: any) => row.year_th);
        res.json(years);
    });
});

// API endpoint to get list of available fiscal years for report
app.get('/api/years/report', (req: Request, res: Response) => {
    const sql = 'SELECT DISTINCT year_th FROM hdc ORDER BY year_th DESC';

    pool.query(sql, (err, results: any) => {
        if (err) {
            console.error('Error executing query:', err);
            res.status(500).json({ error: 'Database error' });
            return;
        }

        // Convert calendar years to fiscal years
        // Fiscal year X contains: Oct-Dec of year X-1 and Jan-Sep of year X
        const calendarYears = results.map((row: any) => parseInt(row.year_th));
        const fiscalYears = new Set<number>();

        calendarYears.forEach((year: number) => {
            // This year's Jan-Sep belongs to current fiscal year
            fiscalYears.add(year);
            // This year's Oct-Dec belongs to next fiscal year
            fiscalYears.add(year + 1);
        });

        const sortedFiscalYears = Array.from(fiscalYears).sort((a, b) => b - a);
        res.json(sortedFiscalYears.map(y => y.toString()));
    });
});

// API endpoint to get list of months with Thai names
app.get('/api/months', (req: Request, res: Response) => {
    console.log('API Request: /api/months');
    pool.query('SELECT month_no, month_name, month_th FROM month ORDER BY CAST(month_no AS UNSIGNED)', (err, results: any) => {
        if (err) {
            console.error('Error fetching months:', err);
            res.status(500).json({ error: 'Database error' });
            return;
        }

        const months = results.map((row: any) => ({
            value: row.month_no,
            name: row.month_name, // Use full month name for display
            shortName: row.month_th
        }));

        res.json(months);
    });
});

// API endpoint to get list of districts
app.get('/api/districts', (req: Request, res: Response) => {
    const sql = 'SELECT amp_code as code, amp_name as name FROM ampur ORDER BY amp_code ASC';

    pool.query(sql, (err, results: any) => {
        if (err) {
            console.error('Error executing query:', err);
            res.status(500).json({ error: 'Database error' });
            return;
        }

        const districts = results.map((row: any) => ({
            code: row.code,
            name: row.name
        }));

        res.json(districts);
    });
});

// API endpoint to get last update time for HDC/OPPP data from file uploads
app.get('/api/last-update', (req: Request, res: Response) => {
    const type = req.query.type as string || 'hdc';
    const sql = 'SELECT MAX(file_time) as last_update FROM fileupload WHERE file_type = ? AND file_time IS NOT NULL';

    pool.query(sql, [type], (err, results: any) => {
        if (err) {
            console.error('Error executing query:', err);
            res.status(500).json({ error: 'Database error' });
            return;
        }

        // Return null if no data
        const lastUpdate = results[0]?.last_update && results[0].last_update !== null
            ? results[0].last_update
            : null;

        console.log(`DEBUG /api/last-update type=${type} - Returning lastUpdate:`, lastUpdate);

        res.json({ lastUpdate });
    });
});
// Maintain old endpoint for backwards compatibility (optional, or just remove if we update all clients)
app.get('/api/hdc/last-update', (req: Request, res: Response) => {
    // Redirect logic internal or just duplicate for safety during transition
    const sql = 'SELECT MAX(file_time) as last_update FROM fileupload WHERE file_type = "hdc" AND file_time IS NOT NULL';
    pool.query(sql, (err, results: any) => {
        if (err) {
            console.error('Error executing query:', err);
            res.status(500).json({ error: 'Database error' });
            return;
        }
        const lastUpdate = results[0]?.last_update ? results[0].last_update : null;
        res.json({ lastUpdate });
    });
});

// Start the server
app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});
