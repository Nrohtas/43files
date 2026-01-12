
import mysql from 'mysql2/promise';

const dbConfig = {
    host: 'localhost',
    user: 'root',
    password: 'root', // Assuming empty or default from previous context
    database: '43files'
};

async function checkData() {
    try {
        const connection = await mysql.createConnection(dbConfig);
        const [rows] = await connection.execute('SELECT * FROM chospital LIMIT 1');
        console.log('Sample Data:', rows);
        await connection.end();
    } catch (error) {
        console.error('Error:', error);
    }
}

checkData();
