
import express, { Request, Response } from 'express';
import mysql from 'mysql2';
import cors from 'cors';

// Create Express app
const app = express();
const port = process.env.PORT || 3000;

// Enable CORS
app.use(cors());
app.use(express.json());

// Database connection configuration
const dbConfig = {
    host: 'localhost',
    user: 'root',
    password: 'root', // Replace with your actual password
    database: '43files'
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
                    id: user.id,
                    username: user.username,
                    role: user.role
                }
            });
        } else {
            res.status(401).json({ error: 'Invalid credentials' });
        }
    });
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
            SUM(CASE WHEN hdc.sentdata = 'y' THEN 1 ELSE 0 END) as submitted,
            SUM(CASE WHEN IFNULL(hdc.sentdata, 'n') != 'y' THEN 1 ELSE 0 END) as missing
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
        WHERE IFNULL(hdc.sentdata, 'n') != 'y'
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
            SUM(CASE WHEN oppp.sentdata = 'y' THEN 1 ELSE 0 END) as submitted,
            SUM(CASE WHEN IFNULL(oppp.sentdata, 'n') != 'y' THEN 1 ELSE 0 END) as missing
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
        WHERE IFNULL(oppp.sentdata, 'n') != 'y'
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

// Start the server
app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});
