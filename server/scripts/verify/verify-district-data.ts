import mysql from 'mysql2/promise';

async function verifyDistrictData() {
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

        // 1. Check districts
        console.log('=== ตรวจสอบข้อมูลอำเภอ ===');
        const [districts] = await connection.query(`
            SELECT amp_code, amp_name 
            FROM ampur 
            ORDER BY amp_code ASC
        `);
        console.table(districts);

        // 2. Check hospitals by district with affiliation and address
        console.log('\n=== ตรวจสอบหน่วยบริการแยกตามอำเภอ พร้อมสังกัดและที่อยู่ ===');
        const [hospitalsByDistrict] = await connection.query(`
            SELECT 
                a.amp_code,
                a.amp_name,
                h.hospcode,
                h.hospname,
                h.hostype_new,
                ht.hostype_name,
                h.address
            FROM ampur a
            LEFT JOIN hospital h ON a.amp_code = h.amp_code
            LEFT JOIN hostype ht ON h.hostype_new = ht.hostype_new
            ORDER BY a.amp_code ASC, h.hospcode ASC
        `);

        // Group by district
        const districtMap = new Map();
        (hospitalsByDistrict as any[]).forEach(row => {
            const districtKey = `${row.amp_code} - ${row.amp_name}`;
            if (!districtMap.has(districtKey)) {
                districtMap.set(districtKey, []);
            }
            if (row.hospcode) {
                districtMap.get(districtKey).push({
                    รหัส: row.hospcode,
                    หน่วยบริการ: row.hospname,
                    สังกัด: row.hostype_name || `(ไม่มี - code: ${row.hostype_new})`,
                    ที่อยู่: row.address || '(ไม่มีข้อมูล)'
                });
            }
        });

        // Display data by district
        districtMap.forEach((hospitals, district) => {
            console.log(`\n=== ${district} ===`);
            console.log(`จำนวนหน่วยบริการ: ${hospitals.length}`);
            console.table(hospitals);
        });

        // 3. Summary statistics
        console.log('\n=== สรุปข้อมูล ===');
        const [summary] = await connection.query(`
            SELECT 
                a.amp_code,
                a.amp_name,
                COUNT(h.hospcode) as total_units,
                SUM(CASE WHEN h.hostype_new IS NULL THEN 1 ELSE 0 END) as missing_hostype,
                SUM(CASE WHEN h.address IS NULL OR h.address = '' THEN 1 ELSE 0 END) as missing_address,
                SUM(CASE WHEN ht.hostype_name IS NULL THEN 1 ELSE 0 END) as invalid_hostype
            FROM ampur a
            LEFT JOIN hospital h ON a.amp_code = h.amp_code
            LEFT JOIN hostype ht ON h.hostype_new = ht.hostype_new
            GROUP BY a.amp_code, a.amp_name
            ORDER BY a.amp_code ASC
        `);
        console.table(summary);

        // 4. Check for data quality issues
        console.log('\n=== ปัญหาที่พบ ===');
        const [issues] = await connection.query(`
            SELECT 
                h.hospcode,
                h.hospname,
                h.amp_code,
                CASE 
                    WHEN h.hostype_new IS NULL THEN 'ไม่มีสังกัด'
                    WHEN ht.hostype_name IS NULL THEN 'สังกัดไม่ถูกต้อง'
                    ELSE NULL 
                END as hostype_issue,
                CASE 
                    WHEN h.address IS NULL OR h.address = '' THEN 'ไม่มีที่อยู่'
                    ELSE NULL 
                END as address_issue
            FROM hospital h
            LEFT JOIN hostype ht ON h.hostype_new = ht.hostype_new
            WHERE h.hostype_new IS NULL 
               OR ht.hostype_name IS NULL 
               OR h.address IS NULL 
               OR h.address = ''
            ORDER BY h.amp_code ASC, h.hospcode ASC
        `);

        if ((issues as any[]).length > 0) {
            console.log(`พบปัญหา ${(issues as any[]).length} รายการ:`);
            console.table(issues);
        } else {
            console.log('✓ ไม่พบปัญหา');
        }

        await connection.end();
        console.log('\n✓ ตรวจสอบเสร็จสิ้น');

    } catch (error) {
        console.error('✗ Error:', error);
        process.exit(1);
    }
}

verifyDistrictData();
