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

async function testLastUpdate() {
    try {
        console.log('=== Testing HDC Last Update ===\n');

        // 1. Check fileupload table for HDC files
        console.log('--- HDC File Uploads ---');
        const [hdcFiles] = await pool.promise().query(
            'SELECT file_id, file_name, file_log, username, file_time FROM fileupload WHERE file_type = "hdc" ORDER BY file_time DESC LIMIT 5'
        );

        if (hdcFiles.length > 0) {
            console.table(hdcFiles);
        } else {
            console.log('❌ No HDC files found in fileupload table');
        }

        // 2. Get MAX file_time (same as API)
        console.log('\n--- Last Update Query (API Result) ---');
        const [result] = await pool.promise().query(
            'SELECT MAX(file_time) as last_update FROM fileupload WHERE file_type = "hdc" AND file_time IS NOT NULL'
        );

        console.log('Last Update:', result[0].last_update);

        if (result[0].last_update) {
            const date = new Date(result[0].last_update);
            console.log('Formatted (TH):', date.toLocaleString('th-TH', {
                timeZone: 'Asia/Bangkok',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            }));
        } else {
            console.log('⚠️  No HDC file uploads found');
        }

        console.log('\n✅ API is ready to return last update time from fileupload table');

    } catch (err) {
        console.error('❌ Error:', err);
    } finally {
        pool.end();
    }
}

testLastUpdate();
