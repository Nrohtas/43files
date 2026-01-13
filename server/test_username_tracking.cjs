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

async function testFileUploadMetadata() {
    try {
        console.log('=== Testing File Upload Metadata ===\n');

        // 1. Verify fileupload table schema
        console.log('--- Fileupload Table Schema ---');
        const [columns] = await pool.promise().query('DESCRIBE fileupload');
        columns.forEach(c => {
            console.log(`  ${c.Field} (${c.Type}) - Null: ${c.Null}, Default: ${c.Default}`);
        });

        // 2. Check if username field exists
        const hasUsername = columns.some(c => c.Field === 'username');
        console.log(`\n✅ Username field exists: ${hasUsername}`);

        // 3. Show current records
        const [count] = await pool.promise().query('SELECT COUNT(*) as total FROM fileupload');
        console.log(`\nTotal fileupload records: ${count[0].total}`);

        if (count[0].total > 0) {
            console.log('\n--- Latest Upload Records ---');
            const [records] = await pool.promise().query(
                'SELECT file_id, file_name, file_type, file_log, username, file_size, file_time FROM fileupload ORDER BY file_time DESC LIMIT 5'
            );
            console.table(records);
        }

        console.log('\n✅ Ready to test file uploads with username tracking!');
        console.log('\nTo test:');
        console.log('1. Navigate to http://localhost:5173/admin/');
        console.log('2. Login with admin credentials');
        console.log('3. Upload HDC or OPPP file');
        console.log('4. Run this script again to see the username recorded');

    } catch (err) {
        console.error('❌ Error:', err);
    } finally {
        pool.end();
    }
}

testFileUploadMetadata();
