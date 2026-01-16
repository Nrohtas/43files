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
            ho.hospcode,
            ho.hospname
        FROM hospital ho
        LEFT JOIN ampur a ON ho.amp_code = a.amp_code
        LEFT JOIN hdc h ON ho.hospcode = h.hospcode 
            AND h.b_year = ?
        WHERE UPPER(IFNULL(h.${statusCol}, 'N')) != 'Y'
        ORDER BY ho.amp_code ASC, ho.hospcode ASC
    `;

    try {
        const [rows] = await pool.query<RowDataPacket[]>(sql, [year]);

        const grouped: { [key: string]: any } = {};

        rows.forEach((row: any) => {
            if (!grouped[row.amp_code]) {
                grouped[row.amp_code] = {
                    districtCode: row.amp_code,
                    districtName: row.amp_name,
                    units: []
                };
            }

            grouped[row.amp_code].units.push({
                code: row.hospcode,
                name: row.hospname
            });
        });

        const response = Object.values(grouped);
        return NextResponse.json(response);
    } catch (error) {
        console.error('Error executing query:', error);
        return NextResponse.json({ error: 'Database error' }, { status: 500 });
    }
}
