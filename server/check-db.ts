
import mysql from 'mysql2';
import dotenv from 'dotenv';
dotenv.config();

const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || 'root',
    database: process.env.DB_NAME || '43files'
};

const pool = mysql.createPool(dbConfig);

pool.getConnection((err, connection) => {
    if (err) {
        console.error('CONNECTION_TEST_ERROR:', err.code, err.message);
        process.exit(1);
    } else {
        console.log('CONNECTION_TEST_SUCCESS');
        connection.query('SHOW TABLES', (err, results: any) => {
            if (err) {
                console.error('SHOW_TABLES_ERROR:', err);
            } else {
                console.log('TABLES:', results.map((r: any) => Object.values(r)[0]));
            }
            connection.release();
            process.exit(0);
        });
    }
});
