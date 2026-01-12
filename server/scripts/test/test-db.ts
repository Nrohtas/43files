import mysql from 'mysql2/promise';

async function testDatabase() {
    try {
        const connection = await mysql.createConnection({
            host: 'localhost',
            user: 'root',
            password: 'root',
            database: '43files',
            port: 3306,
            charset: 'utf8'
        });

        console.log('✓ Successfully connected to database');

        // Check if ampur table exists
        const [tables] = await connection.query(
            "SHOW TABLES LIKE 'ampur'"
        );

        if ((tables as any[]).length === 0) {
            console.log('✗ Table "ampur" does not exist');

            // Show all available tables
            const [allTables] = await connection.query('SHOW TABLES');
            console.log('\nAvailable tables:');
            (allTables as any[]).forEach(table => {
                console.log('  -', Object.values(table)[0]);
            });
        } else {
            console.log('✓ Table "ampur" exists');

            // Check table structure
            const [columns] = await connection.query('DESCRIBE ampur');
            console.log('\nTable structure:');
            console.table(columns);

            // Check data count
            const [countResult] = await connection.query('SELECT COUNT(*) as count FROM ampur');
            const count = (countResult as any[])[0].count;
            console.log(`\n✓ Table has ${count} rows`);

            if (count > 0) {
                // Show sample data
                const [sampleData] = await connection.query('SELECT * FROM ampur LIMIT 5');
                console.log('\nSample data (first 5 rows):');
                console.table(sampleData);
            } else {
                console.log('⚠ Table is empty - no district data found!');
            }
        }

        await connection.end();
        console.log('\n✓ Test completed');

    } catch (error) {
        console.error('✗ Error:', error);
        process.exit(1);
    }
}

testDatabase();
