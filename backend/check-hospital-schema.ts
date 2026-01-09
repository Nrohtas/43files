import mysql from 'mysql2/promise';

async function checkHospitalSchema() {
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

        // Check hospital table structure
        console.log('=== Hospital table structure ===');
        const [columns] = await connection.query('DESCRIBE hospital');
        console.table(columns);

        // Check if hosptype_new field exists
        const hasHostypeNew = (columns as any[]).some(col => col.Field === 'hosptype_new');
        console.log(`\nhosptype_new field exists: ${hasHostypeNew}\n`);

        // Sample data with hostype info
        console.log('=== Sample hospital data (first 5) ===');
        const [data] = await connection.query(`
            SELECT hospcode, hospname, amp_code, hosptype_new 
            FROM hospital 
            WHERE amp_code = '6501'
            LIMIT 5
        `);
        console.table(data);

        // Count by hostype_new for district 6501
        console.log('\n=== Count by hostype_new for district 6501 ===');
        const [counts] = await connection.query(`
            SELECT hosptype_new, COUNT(*) as count 
            FROM hospital 
            WHERE amp_code = '6501'
            GROUP BY hosptype_new
        `);
        console.table(counts);

        await connection.end();
        console.log('\n✓ Check completed');

    } catch (error) {
        console.error('✗ Error:', error);
        process.exit(1);
    }
}

checkHospitalSchema();
