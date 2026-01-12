import mysql from 'mysql2/promise';
import bcrypt from 'bcryptjs';

// Database configuration
const dbConfig = {
    host: 'localhost',
    user: 'root', // Assuming default, should match server.ts
    password: '', // Assuming default
    database: '43files'
};

async function initUsers() {
    console.log('Initializing users table...');

    try {
        const connection = await mysql.createConnection(dbConfig);
        console.log('Connected to database.');

        // 1. Create Users Table
        const createTableQuery = `
            CREATE TABLE IF NOT EXISTS users (
                id INT AUTO_INCREMENT PRIMARY KEY,
                username VARCHAR(50) NOT NULL UNIQUE,
                password_hash VARCHAR(255) NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                last_login TIMESTAMP NULL
            )
        `;

        await connection.execute(createTableQuery);
        console.log('Users table checked/created.');

        // 2. Create Admin User
        const adminUsername = 'admin';
        const adminPassword = 'admin'; // Change this for production!

        // Check if admin exists
        const [rows]: any = await connection.execute('SELECT * FROM users WHERE username = ?', [adminUsername]);

        if (rows.length === 0) {
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash(adminPassword, salt);

            await connection.execute(
                'INSERT INTO users (username, password_hash) VALUES (?, ?)',
                [adminUsername, hashedPassword]
            );
            console.log(`Admin user created with default password: ${adminPassword}`);
        } else {
            console.log('Admin user already exists. Skipping creation.');
        }

        await connection.end();
        console.log('Database initialization complete.');

    } catch (error) {
        console.error('Error initializing database:', error);
    }
}

initUsers();
