import mysql from 'mysql2/promise';

async function testConnection() {
    try {
        const connection = await mysql.createConnection({
            host: 'localhost',
            user: 'root',
            password: 'root',
            database: '43files',
            port: 3306
        });

        console.log('✓ Connected to MySQL successfully!');

        // Test query - check available tables
        const [tables] = await connection.query('SHOW TABLES');
        console.log('\n=== Available Tables ===');
        console.log(tables);

        // Test query - check district data
        const [districts] = await connection.query('SELECT amp_code, amp_name FROM ampur LIMIT 5');
        console.log('\n=== Sample Districts ===');
        console.log(districts);

        // Test query - check hospital data
        const [hospitals] = await connection.query('SELECT hospcode, hospname FROM hospital LIMIT 5');
        console.log('\n=== Sample Hospitals ===');
        console.log(hospitals);

        // Test query - check hdc data
        const [hdc] = await connection.query('SELECT * FROM hdc LIMIT 5');
        console.log('\n=== Sample HDC Data ===');
        console.log(hdc);

        // Test the summary query
        const [summary] = await connection.query(`
            SELECT 
                h.amp_code,
                a.amp_name,
                COUNT(DISTINCT h.hospcode) as total_units,
                SUM(CASE WHEN hdc.sentdata = 'y' THEN 1 ELSE 0 END) as submitted,
                SUM(CASE WHEN IFNULL(hdc.sentdata, 'n') != 'y' THEN 1 ELSE 0 END) as missing
            FROM hospital h
            LEFT JOIN ampur a ON h.amp_code = a.amp_code
            LEFT JOIN hdc ON h.hospcode = hdc.hospcode 
                AND hdc.year_th = '2568' 
                AND hdc.month_no = '11'
            GROUP BY h.amp_code, a.amp_name
            ORDER BY h.amp_code ASC
        `);
        console.log('\n=== District Summary (Year: 2568, Month: 11) ===');
        console.log(summary);

        await connection.end();
        console.log('\n✓ Connection closed successfully');
    } catch (error) {
        console.error('✗ Error:', error);
        process.exit(1);
    }
}

testConnection();
