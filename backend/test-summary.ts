import mysql from 'mysql2/promise';

async function testSummaryQuery() {
    try {
        const connection = await mysql.createConnection({
            host: 'localhost',
            user: 'root',
            password: 'root',
            database: '43files',
            port: 3306,
            charset: 'utf8'
        });

        console.log('✓ Connected to database\n');

        // Check what data is in 43sent table
        console.log('=== Checking 43sent table ===');
        const [sampleSent] = await connection.query('SELECT * FROM 43sent LIMIT 3');
        console.table(sampleSent);

        // Check if there's a relationship between hospital and 43sent
        console.log('\n=== Checking hospital table structure ===');
        const [hospitalColumns] = await connection.query('DESCRIBE hospital');
        console.table(hospitalColumns);

        // Try to calculate submission stats for one district
        console.log('\n=== Testing submission calculation for district 6501 ===');

        const sql = `
            SELECT 
                h.amp_code,
                h.hospcode,
                h.hospname,
                CASE 
                    WHEN s.หน่วยบริการ IS NOT NULL THEN 1 
                    ELSE 0 
                END as has_submitted
            FROM hospital h
            LEFT JOIN 43sent s ON CONCAT(h.hospcode, ':', h.hospname) = s.หน่วยบริการ
            WHERE h.amp_code = '6501'
            LIMIT 5
        `;

        const [testResults] = await connection.query(sql);
        console.table(testResults);

        await connection.end();
        console.log('\n✓ Test completed');

    } catch (error) {
        console.error('✗ Error:', error);
        process.exit(1);
    }
}

testSummaryQuery();
