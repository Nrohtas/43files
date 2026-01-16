import { NextResponse } from 'next/server';
import { pool } from '@/lib/db';
import { RowDataPacket } from 'mysql2';

import { verifyToken } from '@/lib/jwt';

export async function GET(request: Request) {
    const authHeader = request.headers.get('Authorization');
    const token = authHeader?.split(' ')[1];
    const decoded = token ? verifyToken(token) : null;

    if (!decoded) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const year = searchParams.get('year') || '2568';
    const month = searchParams.get('month') || '11';

    // Map month number to status column name (10=status10, 11=status11, ..., 1=status01, ...)
    const monthPadded = month.padStart(2, '0');
    const statusCol = `status${monthPadded}`;

    const sql = `
        SELECT 
            ho.amp_code,
            a.amp_name,
            COUNT(DISTINCT ho.hospcode) as total_units,
            SUM(CASE WHEN UPPER(IFNULL(h.${statusCol}, 'N')) = 'Y' THEN 1 ELSE 0 END) as submitted,
            SUM(CASE WHEN UPPER(IFNULL(h.${statusCol}, 'N')) != 'Y' THEN 1 ELSE 0 END) as missing
        FROM hospital ho
        LEFT JOIN ampur a ON ho.amp_code = a.amp_code
        LEFT JOIN hdc h ON ho.hospcode = h.hospcode 
            AND h.b_year = ?
        GROUP BY ho.amp_code, a.amp_name
        ORDER BY ho.amp_code ASC
    `;

    try {
        const [rows] = await pool.query<RowDataPacket[]>(sql, [year]);

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
