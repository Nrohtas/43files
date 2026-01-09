import mysql from 'mysql2/promise';

async function examineHostypeTable() {
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

        // Check if hostype table exists
        console.log('=== Checking for hostype table ===');
        const [tables] = await connection.query("SHOW TABLES LIKE 'hostype'");

        if ((tables as any[]).length === 0) {
            console.log('✗ hostype table not found');

            // Show similar tables
            const [allTables] = await connection.query('SHOW TABLES');
            console.log('\nAll available tables:');
            console.table(allTables);
        } else {
            console.log('✓ hostype table exists\n');

            // Show structure
            console.log('=== Table structure ===');
            const [columns] = await connection.query('DESCRIBE hostype');
            console.table(columns);

            // Show sample data
            console.log('\n=== Sample data ===');
            const [data] = await connection.query('SELECT * FROM hostype LIMIT 5');
            console.table(data);

            // Count records
            const [count] = await connection.query('SELECT COUNT(*) as count FROM hostype');
            console.log(`\nTotal records: ${(count as any[])[0].count}`);
        }

        await connection.end();
        console.log('\n✓ Examination completed');

    } catch (error) {
        console.error('✗ Error:', error);
        process.exit(1);
    }
}

examineHostypeTable();
