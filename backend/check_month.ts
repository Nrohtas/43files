
import mysql from 'mysql2/promise';

const pool = mysql.createPool({
    host: 'localhost',
    user: 'root',
    password: 'root',
    database: '43files',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

async function checkMonthTable() {
    try {
        console.log('Checking month table...');
        const [rows] = await pool.query('SELECT * FROM month LIMIT 1');
        console.log('Month table exists. Rows:', rows);
    } catch (error) {
        console.error('Error querying month table:', error);
    } finally {
        await pool.end();
    }
}

checkMonthTable();
