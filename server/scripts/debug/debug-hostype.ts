import mysql from 'mysql2/promise';

async function investigateHostypeData() {
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

        // 1. Check what codes are returned for "Ministry of Public Health" by the current logic
        console.log('=== Hostype Codes from API Logic ===');
        const [hostypes] = await connection.query(`
            SELECT MIN(hostype_new) as code, hostype_name as name 
            FROM hostype 
            GROUP BY hostype_name 
            ORDER BY MIN(hostype_new) ASC
        `);
        console.table(hostypes);

        // 2. Check all codes for "Ministry of Public Health"
        console.log('\n=== All Codes for กระทรวงสาธารณสุข in hostype table ===');
        const [allHostypes] = await connection.query(`
            SELECT hostype_new, hostype_name 
            FROM hostype 
            WHERE hostype_name LIKE '%สาธารณสุข%'
        `);
        console.table(allHostypes);

        // 3. Check actual hostype_new values in hospital table for district 6501
        console.log('\n=== Actual hostype_new usage in hospital table (District 6501) ===');
        const [hospitalUsage] = await connection.query(`
            SELECT h.hostype_new, COUNT(*) as usage_count, ht.hostype_name
            FROM hospital h
            LEFT JOIN hostype ht ON h.hostype_new = ht.hostype_new
            WHERE h.amp_code = '6501'
            GROUP BY h.hostype_new, ht.hostype_name
        `);
        console.table(hospitalUsage);

        await connection.end();
        console.log('\n✓ Investigation completed');

    } catch (error) {
        console.error('✗ Error:', error);
        process.exit(1);
    }
}

investigateHostypeData();
