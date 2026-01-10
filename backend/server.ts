import express, { Request, Response } from 'express';
import mysql from 'mysql2';
import cors from 'cors';

const app = express();
const port = 3000;

app.use(cors());
app.use(express.json());

// Type Definitions
interface District {
    amp_code: string;
    amp_name: string;
}

interface Hospital {
    hospcode: string;
    hospname: string;
}

interface Unit43Sent {
    หน่วยบริการ: string;
    f6?: string;
    f7?: string;
    f8?: string;
    f9?: string;
    f10?: string;
    f11?: string;
    f12?: string;
    f13?: string;
    f14?: string;
    f15?: string;
    f16?: string;
}

// MySQL Connection
const pool = mysql.createPool({
    host: 'localhost',
    user: 'root',
    password: 'root',
    database: '43files',
    port: 3306,
    charset: 'utf8',
    waitForConnections: true,
    connectionLimit: 100,
    queueLimit: 0
});

// Test Connection
pool.getConnection((err, connection) => {
    if (err) {
        console.error('Error connecting to MySQL:', err);
        return;
    }
    console.log('Successfully connected to MySQL database: 43files');
    connection.release();
});

// API endpoint for 43sent table (original)
app.get('/api/units/:district', (req: Request, res: Response) => {
    const district = req.params.district;

    const sql = 'SELECT * FROM 43sent WHERE `หน่วยบริการ` IS NOT NULL';

    pool.query(sql, (err, results: any) => {
        if (err) {
            console.error('Error executing query:', err);
            res.status(500).json({ error: 'Database error' });
            return;
        }

        const units = results.map((row: Unit43Sent) => {
            let code = '';
            let name = row['หน่วยบริการ'];

            if (name && name.includes(':')) {
                const parts = name.split(':');
                code = parts[0];
                name = parts.slice(1).join(':');
            }

            const months = [
                parseInt(row['f6'] || '0') > 0,
                parseInt(row['f7'] || '0') > 0,
                parseInt(row['f8'] || '0') > 0,
                parseInt(row['f9'] || '0') > 0,
                parseInt(row['f10'] || '0') > 0,
                parseInt(row['f11'] || '0') > 0,
                parseInt(row['f12'] || '0') > 0,
                parseInt(row['f13'] || '0') > 0,
                parseInt(row['f14'] || '0') > 0,
                parseInt(row['f15'] || '0') > 0,
                parseInt(row['f16'] || '0') > 0,
                false // f17/Sep missing
            ];

            return {
                code: code,
                name: name,
                months: months
            };
        });

        res.json(units);
    });
});

// API endpoint to get list of districts from ampur table
app.get('/api/districts', (req: Request, res: Response) => {
    const sql = 'SELECT amp_code, amp_name FROM `ampur` ORDER BY amp_code ASC';

    pool.query(sql, (err, results: any) => {
        if (err) {
            console.error('Error executing query:', err);
            res.status(500).json({ error: 'Database error' });
            return;
        }

        const districts = results.map((row: District) => ({
            code: row.amp_code,
            name: row.amp_name
        }));

        res.json(districts);
    });
});

// API endpoint for HDC monthly submission data
// Now uses hdc table with year_th, month, and sentdata columns
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

    sql += ' GROUP BY h.hospcode, h.hospname ORDER BY h.hospcode ASC';

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
        const groupedByDistrict: { [key: string]: any } = {};

        results.forEach((row: any) => {
            const districtKey = row.amp_code;

            if (!groupedByDistrict[districtKey]) {
                groupedByDistrict[districtKey] = {
                    districtCode: row.amp_code,
                    districtName: row.amp_name,
                    units: []
                };
            }

            groupedByDistrict[districtKey].units.push({
                code: row.hospcode,
                name: row.hospname
            });
        });

        // Convert to array
        const response = Object.values(groupedByDistrict);

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
    pool.query(
        'SELECT month_no, month_name, month_th FROM `month` ORDER BY month_no',
        (error: any, rows: any) => {
            if (error) {
                console.error('Error fetching months:', error);
                return res.status(500).json({ error: 'Failed to fetch months' });
            }

            // console.log('Database rows sample:', rows[0]); 

            const months = rows.map((row: any) => ({
                value: row.month_no, // ใช้ month_no
                name: row.month_name,
                nameEng: '',
                abbr: row.month_th  // ใช้ month_th
            }));

            res.json(months);
        }
    );
});



app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});
