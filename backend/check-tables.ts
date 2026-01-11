
import mysql from 'mysql2';

const pool = mysql.createPool({
    host: 'localhost',
    user: 'root',
    password: 'root',
    database: '43files',
    port: 3306
});

pool.query('SHOW TABLES', (err, results) => {
    if (err) {
        console.error(err);
    } else {
        console.log(results);
    }
    pool.end();
});
