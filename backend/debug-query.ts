
import mysql from 'mysql2/promise';

const dbConfig = {
    host: 'localhost',
    user: 'root',
    password: 'root',
    database: '43files'
};

async function testQuery() {
    try {
        const connection = await mysql.createConnection(dbConfig);

        // Simulating the query from server.ts
        const sql = `
        SELECT 
            h.hospcode,
            h.hospname,
            h.hostype_new,
            MAX(CASE WHEN hdc.month_no = '10' THEN hdc.sentdata END) as month_10
        FROM hospital h
        LEFT JOIN hdc ON h.hospcode = hdc.hospcode 
        LEFT JOIN hostype ht ON h.hostype_new = ht.hostype_new
        WHERE h.amp_code = '01' 
        GROUP BY h.hospcode, h.hospname 
        ORDER BY h.hospcode ASC
        LIMIT 5;
        `;

        console.log("Executing SQL...");
        const [rows] = await connection.execute(sql);
        console.log("Success! Rows returned:", rows.length);
        console.log("Sample Row:", rows[0]);
        await connection.end();
    } catch (error) {
        console.error("SQL Error:", error);
    }
}

testQuery();
