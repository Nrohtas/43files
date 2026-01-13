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

async function checkAndAddUsernameField() {
    try {
        console.log('=== Checking fileupload Table ===\n');

        // 1. Get current schema
        const [columns] = await pool.promise().query('DESCRIBE fileupload');
        console.log('Current columns:');
        columns.forEach(c => {
            console.log(`  - ${c.Field} (${c.Type})`);
        });

        // 2. Check if username column exists
        const hasUsername = columns.some(c => c.Field === 'username');

        if (hasUsername) {
            console.log('\n✅ username column already exists');
        } else {
            console.log('\n❌ username column does NOT exist');
            console.log('Adding username column...');

            await pool.promise().query(
                'ALTER TABLE fileupload ADD COLUMN username VARCHAR(50) NULL AFTER file_type'
            );

            console.log('✅ username column added successfully');

            // Show updated schema
            const [newColumns] = await pool.promise().query('DESCRIBE fileupload');
            console.log('\nUpdated schema:');
            newColumns.forEach(c => {
                console.log(`  - ${c.Field} (${c.Type})`);
            });
        }

    } catch (err) {
        console.error('❌ Error:', err);
    } finally {
        pool.end();
    }
}

checkAndAddUsernameField();
