import mysql from 'mysql2/promise';

async function checkDistrictMapping() {
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

        // Check district codes and names
        console.log('=== ตรวจสอบรหัสและชื่ออำเภอ ===');
        const [districts] = await connection.query(`
            SELECT amp_code, amp_name 
            FROM ampur 
            ORDER BY amp_code ASC
        `);
        console.table(districts);

        // Check hospitals in พรหมพิราม (code 6506)
        console.log('\n=== หน่วยบริการในอำเภอพรหมพิราม (6506) ===');
        const [phromPhiram] = await connection.query(`
            SELECT hospcode, hospname, amp_code
            FROM hospital 
            WHERE amp_code = '6506'
            ORDER BY hospcode ASC
        `);
        console.table(phromPhiram);

        // Check hospitals in นครไทย (code 6502)
        console.log('\n=== หน่วยบริการในอำเภอนครไทย (6502) ===');
        const [nakhonThai] = await connection.query(`
            SELECT hospcode, hospname, amp_code
            FROM hospital 
            WHERE amp_code = '6502'
            ORDER BY hospcode ASC
        `);
        console.table(nakhonThai);

        await connection.end();
        console.log('\n✓ ตรวจสอบเสร็จสิ้น');

    } catch (error) {
        console.error('✗ Error:', error);
        process.exit(1);
    }
}

checkDistrictMapping();
