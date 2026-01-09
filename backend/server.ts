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
app.get('/api/hdc/:district', (req: Request, res: Response) => {
    const district = req.params.district;
    const hostype = req.query.hostype as string | undefined;

    let sql = `
        SELECT 
            h.hospcode,
            h.hospname,
            hdc.october,
            hdc.november,
            hdc.december,
            hdc.january,
            hdc.february,
            hdc.march,
            hdc.april,
            hdc.may,
            hdc.june,
            hdc.july,
            hdc.august,
            hdc.september
        FROM hospital h
        LEFT JOIN hdc ON h.hospcode = hdc.hospcode
        LEFT JOIN hostype ht ON h.hostype_new = ht.hostype_new
        WHERE h.amp_code = ?
    `;

    const params: any[] = [district];

    // Add hostype filter if provided (filter by NAME to handle multiple codes)
    if (hostype) {
        sql += ' AND ht.hostype_name = ?';
        params.push(hostype);
    }

    sql += ' ORDER BY h.hospcode ASC';

    pool.query(sql, params, (err, results: any) => {
        if (err) {
            console.error('Error executing query:', err);
            res.status(500).json({ error: 'Database error' });
            return;
        }

        const units = results.map((row: any) => {
            // Convert y/n to boolean, december is date type so handle differently
            const months = [
                row.october === 'y',       // ต.ค.
                row.november === 'y',      // พ.ย.
                row.december !== null,     // ธ.ค. (date type)
                row.january === 'y',       // ม.ค.
                row.february === 'y',      // ก.พ.
                row.march === 'y',         // มี.ค.
                row.april === 'y',         // เม.ย.
                row.may === 'y',           // พ.ค.
                row.june === 'y',          // มิ.ย.
                row.july === 'y',          // ก.ค.
                row.august === 'y',        // ส.ค.
                row.september === 'y'      // ก.ย.
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
    const sql = `
        SELECT 
            a.amp_code,
            a.amp_name,
            COUNT(h.hospcode) as total_units
        FROM ampur a
        LEFT JOIN hospital h ON a.amp_code = h.amp_code
        GROUP BY a.amp_code, a.amp_name
        ORDER BY a.amp_code ASC
    `;

    pool.query(sql, (err, results: any) => {
        if (err) {
            console.error('Error executing query:', err);
            res.status(500).json({ error: 'Database error' });
            return;
        }

        const summary = results.map((row: any) => ({
            code: row.amp_code,
            name: row.amp_name,
            totalUnits: row.total_units,
            submitted: 0,  // Will be calculated from actual data later
            missing: 0     // Will be calculated from actual data later
        }));

        res.json(summary);
    });
});

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});
