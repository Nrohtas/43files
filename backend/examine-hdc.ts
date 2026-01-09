import mysql from 'mysql2/promise';

async function examineHdcTable() {
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

        // Check if hdc table exists
        console.log('=== Checking for hdc table ===');
        const [tables] = await connection.query("SHOW TABLES LIKE 'hdc%'");
        console.table(tables);

        if ((tables as any[]).length > 0) {
            const tableName = Object.values((tables as any[])[0])[0] as string;

            console.log(`\n=== Structure of ${tableName} ===`);
            const [columns] = await connection.query(`DESCRIBE \`${tableName}\``);
            console.table(columns);

            console.log(`\n=== Sample data from ${tableName} (first 3 rows) ===`);
            const [sampleData] = await connection.query(`SELECT * FROM \`${tableName}\` LIMIT 3`);
            console.table(sampleData);

            const [count] = await connection.query(`SELECT COUNT(*) as count FROM \`${tableName}\``);
            console.log(`\nTotal rows: ${(count as any[])[0].count}`);
        } else {
            console.log('✗ No hdc table found');
            console.log('\nSearching for tables with submission data...');
            const [allTables] = await connection.query('SHOW TABLES');
            console.table(allTables);
        }

        await connection.end();
        console.log('\n✓ Examination completed');

    } catch (error) {
        console.error('✗ Error:', error);
        process.exit(1);
    }
}

examineHdcTable();
