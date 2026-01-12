
const mysql = require('mysql2');
require('dotenv').config({ path: 'e:/Dashboard/43files/server/.env' });

const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

async function debugDB() {
    try {
        console.log('Connecting to database...');

        // 1. Check Schema
        console.log('\n--- Table Schema (hdc) ---');
        const [columns] = await pool.promise().query('DESCRIBE hdc');
        console.log(columns.map(c => `${c.Field} (${c.Type}) Null:${c.Null} Default:${c.Default}`).join('\n'));

        // 2. Check Data
        console.log('\n--- Latest 5 Records (by d_update) ---');
        const [rows] = await pool.promise().query('SELECT hospcode, year_th, month_no, sentdata, d_update FROM hdc ORDER BY d_update DESC LIMIT 5');
        console.log(rows);

        // 3. Check NULL count
        console.log('\n--- Stats ---');
        const [stats] = await pool.promise().query('SELECT COUNT(*) as total, COUNT(d_update) as not_null_count FROM hdc');
        console.log(stats[0]);

        // 4. Test API Query
        console.log('\n--- API Query Test ---');
        const [apiRes] = await pool.promise().query('SELECT MAX(d_update) as last_update FROM hdc WHERE d_update IS NOT NULL');
        console.log('Raw Result:', apiRes);
        console.log('Value type:', typeof apiRes[0].last_update);
        console.log('Value constructor:', apiRes[0].last_update ? apiRes[0].last_update.constructor.name : 'N/A');

    } catch (err) {
        console.error('Error:', err);
    } finally {
        pool.end();
    }
}

debugDB();
