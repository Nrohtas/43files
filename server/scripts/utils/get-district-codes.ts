import mysql from 'mysql2/promise';

async function getDistrictCodes() {
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

        // Get all districts with their codes
        console.log('=== รายการอำเภอและรหัส ===');
        const [districts] = await connection.query(`
            SELECT amp_code, amp_name 
            FROM ampur 
            ORDER BY amp_code ASC
        `);

        console.log('\nHTML Dropdown Options to use:\n');
        (districts as any[]).forEach(d => {
            console.log(`<div class="district-option" data-district-code="${d.amp_code}" data-district-name="${d.amp_name}"
    style="padding: 12px 20px; cursor: pointer; transition: all 0.2s; border-bottom: 1px solid #F1F5F9;">
    อำเภอ${d.amp_name}</div>`);
        });

        await connection.end();

    } catch (error) {
        console.error('✗ Error:', error);
        process.exit(1);
    }
}

getDistrictCodes();
