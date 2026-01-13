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

async function checkSchema() {
    try {
        // Check users table schema
        console.log('--- Users Table Schema ---');
        const [usersSchema] = await pool.promise().query('DESCRIBE users');
        console.table(usersSchema);

        // Get all users
        console.log('\n--- Users Data ---');
        const [users] = await pool.promise().query('SELECT * FROM users');
        console.table(users);

        // Check fileupload recent records
        console.log('\n--- Recent Fileupload Records ---');
        const [uploads] = await pool.promise().query(
            'SELECT * FROM fileupload ORDER BY file_time DESC LIMIT 5'
        );
        console.table(uploads);

    } catch (err) {
        console.error('Error:', err);
    } finally {
        pool.end();
    }
}

checkSchema();
