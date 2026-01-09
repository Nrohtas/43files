import mysql from 'mysql2/promise';

async function verifyDistrictAndAffiliation() {
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

        const testDistrict = '6501'; // อำเภอเมืองพิษณุโลก

        // 1. Check all units in district 6501
        console.log(`=== All units in district ${testDistrict} ===`);
        const [allUnits] = await connection.query(`
            SELECT h.hospcode, h.hospname, h.amp_code, h.hostype_new, 
                   ht.hostype_name, a.amp_name
            FROM hospital h
            LEFT JOIN hostype ht ON h.hostype_new = ht.hostype_new
            LEFT JOIN ampur a ON h.amp_code = a.amp_code
            WHERE h.amp_code = ?
            ORDER BY h.hostype_new, h.hospcode
        `, [testDistrict]);

        console.table(allUnits);
        console.log(`Total units: ${(allUnits as any[]).length}\n`);

        // 2. Group by affiliation
        console.log('=== Units grouped by affiliation ===');
        const [grouped] = await connection.query(`
            SELECT ht.hostype_name, h.hostype_new, COUNT(*) as count
            FROM hospital h
            LEFT JOIN hostype ht ON h.hostype_new = ht.hostype_new
            WHERE h.amp_code = ?
            GROUP BY ht.hostype_name, h.hostype_new
            ORDER BY h.hostype_new
        `, [testDistrict]);
        console.table(grouped);

        // 3. Check if any units have wrong amp_code (should not happen)
        console.log('\n=== Checking for mismatched amp_codes ===');
        const [mismatched] = await connection.query(`
            SELECT h.hospcode, h.hospname, h.amp_code, a.amp_name as hospital_amp, 
                   '${testDistrict}' as expected_amp
            FROM hospital h
            LEFT JOIN ampur a ON h.amp_code = a.amp_code
            WHERE h.amp_code = ?
            HAVING h.amp_code != expected_amp
        `, [testDistrict]);

        if ((mismatched as any[]).length > 0) {
            console.log('❌ Found mismatched amp_codes:');
            console.table(mismatched);
        } else {
            console.log('✅ All units have correct amp_code');
        }

        // 4. Test filtering by specific affiliation
        const testAffiliation = 'กระทรวงสาธารณสุข';
        console.log(`\n=== Testing filter: ${testAffiliation} ===`);
        const [filtered] = await connection.query(`
            SELECT h.hospcode, h.hospname, h.hostype_new, ht.hostype_name
            FROM hospital h
            LEFT JOIN hostype ht ON h.hostype_new = ht.hostype_new
            WHERE h.amp_code = ? AND ht.hostype_name = ?
            ORDER BY h.hospcode
        `, [testDistrict, testAffiliation]);

        console.table(filtered);
        console.log(`Filtered count: ${(filtered as any[]).length}`);

        await connection.end();
        console.log('\n✓ Verification completed');

    } catch (error) {
        console.error('✗ Error:', error);
        process.exit(1);
    }
}

verifyDistrictAndAffiliation();
