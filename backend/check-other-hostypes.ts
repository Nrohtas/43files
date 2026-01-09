import mysql from 'mysql2/promise';

async function checkAllHostypeCodes() {
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

        // Check all unique hostype_new values in hospital table
        console.log('=== All unique hostype_new codes in hospital table ===');
        const [allCodes] = await connection.query(`
            SELECT DISTINCT h.hostype_new, ht.hostype_name, COUNT(*) as count
            FROM hospital h
            LEFT JOIN hostype ht ON h.hostype_new = ht.hostype_new
            GROUP BY h.hostype_new, ht.hostype_name
            ORDER BY h.hostype_new ASC
        `);
        console.table(allCodes);

        // Check which codes are NOT in (5,7,8,11,18,21)
        console.log('\n=== Codes NOT in main categories (5,7,8,11,18,21) ===');
        const [otherCodes] = await connection.query(`
            SELECT h.hostype_new, ht.hostype_name, COUNT(*) as count
            FROM hospital h
            LEFT JOIN hostype ht ON h.hostype_new = ht.hostype_new
            WHERE h.hostype_new NOT IN ('5','7','8','11','18','21')
            GROUP BY h.hostype_new, ht.hostype_name
            ORDER BY COUNT(*) DESC
        `);
        console.table(otherCodes);

        const totalOther = (otherCodes as any[]).reduce((sum, row) => sum + parseInt(row.count), 0);
        console.log(`\nTotal units in "Other" category: ${totalOther}`);

        await connection.end();
        console.log('\n✓ Check completed');

    } catch (error) {
        console.error('✗ Error:', error);
        process.exit(1);
    }
}

checkAllHostypeCodes();
