import { NextResponse } from 'next/server';
import { pool } from '@/lib/db';
import { RowDataPacket } from 'mysql2';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const year = searchParams.get('year') || '2568';
    const month = searchParams.get('month') || '11';

    const sql = `
        SELECT 
            h.amp_code,
            a.amp_name,
            COUNT(DISTINCT h.hospcode) as total_units,
            SUM(CASE WHEN UPPER(oppp.sentdata) = 'Y' THEN 1 ELSE 0 END) as submitted,
            SUM(CASE WHEN UPPER(IFNULL(oppp.sentdata, 'N')) != 'Y' THEN 1 ELSE 0 END) as missing
        FROM hospital h
        LEFT JOIN ampur a ON h.amp_code = a.amp_code
        LEFT JOIN oppp ON h.hospcode = oppp.hospcode 
            AND oppp.year_th = ? 
            AND oppp.month_no = ?
        GROUP BY h.amp_code, a.amp_name
        ORDER BY h.amp_code ASC
    `;

    try {
        const [rows] = await pool.query<RowDataPacket[]>(sql, [year, month]);

        const summary = rows.map((row: any) => ({
            code: row.amp_code,
            name: row.amp_name,
            totalUnits: parseInt(row.total_units) || 0,
            submitted: parseInt(row.submitted) || 0,
            missing: parseInt(row.missing) || 0
        }));

        return NextResponse.json(summary);
    } catch (error) {
        console.error('Error executing query:', error);
        return NextResponse.json({ error: 'Database error' }, { status: 500 });
    }
}
