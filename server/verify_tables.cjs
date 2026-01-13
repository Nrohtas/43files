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

async function verifyTables() {
    try {
        console.log('=== Verifying Database Tables ===\n');

        // 1. Check oppp table exists
        console.log('--- Checking oppp Table ---');
        const [opppTables] = await pool.promise().query("SHOW TABLES LIKE 'oppp'");

        if (opppTables.length === 0) {
            console.log('⚠️  oppp table does NOT exist - creating it...');

            // Create oppp table with same structure as hdc
            await pool.promise().query(`
                CREATE TABLE oppp (
                    hospcode varchar(9) NOT NULL,
                    year_th varchar(4) NOT NULL,
                    month_no varchar(2) NOT NULL,
                    sentdata varchar(1) DEFAULT NULL,
                    service int(9) DEFAULT NULL,
                    d_update timestamp NULL DEFAULT NULL,
                    PRIMARY KEY (hospcode, year_th, month_no)
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
            `);
            console.log('✅ oppp table created successfully');
        } else {
            console.log('✅ oppp table exists');

            // Show structure
            const [columns] = await pool.promise().query('DESCRIBE oppp');
            console.log('Schema:', columns.map(c => `${c.Field} (${c.Type})`).join(', '));

            // Count records
            const [count] = await pool.promise().query('SELECT COUNT(*) as total FROM oppp');
            console.log('Record count:', count[0].total);
        }

        // 2. Verify fileupload table
        console.log('\n--- Checking fileupload Table ---');
        const [fileuploadTables] = await pool.promise().query("SHOW TABLES LIKE 'fileupload'");

        if (fileuploadTables.length > 0) {
            console.log('✅ fileupload table exists');

            const [columns] = await pool.promise().query('DESCRIBE fileupload');
            console.log('Schema:', columns.map(c => `${c.Field} (${c.Type})`).join(', '));

            const [count] = await pool.promise().query('SELECT COUNT(*) as total FROM fileupload');
            console.log('Record count:', count[0].total);

            if (count[0].total > 0) {
                console.log('\n--- Latest Upload Records ---');
                const [records] = await pool.promise().query('SELECT * FROM fileupload ORDER BY file_time DESC LIMIT 5');
                records.forEach(r => {
                    console.log(`- ${r.file_name} (${r.file_type}) - Log: ${r.file_log}, Size: ${r.file_size} bytes, Time: ${r.file_time}`);
                });
            }
        } else {
            console.log('❌ fileupload table does NOT exist');
        }

        console.log('\n✅ Database verification complete!');

    } catch (err) {
        console.error('❌ Error:', err);
    } finally {
        pool.end();
    }
}

verifyTables();
