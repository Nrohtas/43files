import express, { Request, Response } from 'express';
import mysql from 'mysql2';
import cors from 'cors';

const app = express();
const port = 3001; // Different port for testing

app.use(cors());
app.use(express.json());

// MySQL Connection
const pool = mysql.createPool({
    host: 'localhost',
    user: 'root',
    password: 'root',
    database: '43files',
    port: 3306,
    charset: 'utf8',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

// Test endpoint to show hdc table structure
app.get('/test/hdc-structure', (req: Request, res: Response) => {
    const sql = 'DESCRIBE hdc';

    pool.query(sql, (err, results: any) => {
        if (err) {
            console.error('Error:', err);
            res.status(500).json({ error: err.message });
            return;
        }
        res.json(results);
    });
});

// Test endpoint to show sample data
app.get('/test/hdc-sample', (req: Request, res: Response) => {
    const sql = 'SELECT * FROM hdc LIMIT 3';

    pool.query(sql, (err, results: any) => {
        if (err) {
            console.error('Error:', err);
            res.status(500).json({ error: err.message });
            return;
        }
        res.json(results);
    });
});

// Test endpoint to show month table structure
app.get('/test/month-structure', (req: Request, res: Response) => {
    const sql = 'DESCRIBE month';

    pool.query(sql, (err, results: any) => {
        if (err) {
            console.error('Error:', err);
            res.status(500).json({ error: err.message });
            return;
        }
        res.json(results);
    });
});

// Test endpoint to show month table data
app.get('/test/month-data', (req: Request, res: Response) => {
    const sql = 'SELECT * FROM month ORDER BY month_id';

    pool.query(sql, (err, results: any) => {
        if (err) {
            console.error('Error:', err);
            res.status(500).json({ error: err.message });
            return;
        }
        res.json(results);
    });
});

app.listen(port, () => {
    console.log(`Test server running at http://localhost:${port}`);
});
