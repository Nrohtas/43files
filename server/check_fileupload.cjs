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

async function checkFileUploadTable() {
    try {
        console.log('Connecting to database...');

        // 1. Check if fileupload table exists
        console.log('\n--- Checking fileupload Table ---');
        const [tables] = await pool.promise().query("SHOW TABLES LIKE 'fileupload'");

        if (tables.length === 0) {
            console.log('❌ fileupload table does NOT exist');
        } else {
            console.log('✅ fileupload table exists');

            // 2. Get table schema
            console.log('\n--- Table Schema (fileupload) ---');
            const [columns] = await pool.promise().query('DESCRIBE fileupload');
            console.log(columns.map(c => `${c.Field} (${c.Type}) Null:${c.Null} Default:${c.Default}`).join('\n'));

            // 3. Count records
            const [count] = await pool.promise().query('SELECT COUNT(*) as total FROM fileupload');
            console.log('\n--- Record Count ---');
            console.log('Total records:', count[0].total);

            // 4. Show sample data
            if (count[0].total > 0) {
                console.log('\n--- Sample Records (Latest 5) ---');
                const [rows] = await pool.promise().query('SELECT * FROM fileupload ORDER BY file_time DESC LIMIT 5');
                console.log(rows);
            }
        }

    } catch (err) {
        console.error('Error:', err);
    } finally {
        pool.end();
    }
}

checkFileUploadTable();
