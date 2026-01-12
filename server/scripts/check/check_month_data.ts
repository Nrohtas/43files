import { createPool } from 'mysql2/promise';

const pool = createPool({
    host: 'localhost',
    user: 'root',
    password: 'root', // Assuming default or checking connection
    database: '43files',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

async function checkMonths() {
    try {
        const [rows] = await pool.query('SELECT * FROM month ORDER BY CAST(month_no AS UNSIGNED)');
        console.log('Month Data:', rows);
    } catch (error) {
        console.error('Error:', error);
    } finally {
        await pool.end();
    }
}

checkMonths();
