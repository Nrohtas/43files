import mysql from 'mysql2/promise';

async function checkTables() {
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

        // List all tables
        console.log('=== All tables in 43files database ===');
        const [tables] = await connection.query('SHOW TABLES');
        console.table(tables);

        // Check tables that might contain submission data
        const tableList = (tables as any[]).map(t => Object.values(t)[0]);

        for (const tableName of tableList) {
            if (tableName.includes('43') || tableName.includes('hdc')) {
                console.log(`\n=== Structure of ${tableName} ===`);
                const [columns] = await connection.query(`DESCRIBE \`${tableName}\``);
                console.table(columns);

                const [count] = await connection.query(`SELECT COUNT(*) as count FROM \`${tableName}\``);
                console.log(`Total rows: ${(count as any[])[0].count}\n`);
            }
        }

        await connection.end();
        console.log('✓ Test completed');

    } catch (error) {
        console.error('✗ Error:', error);
        process.exit(1);
    }
}

checkTables();
