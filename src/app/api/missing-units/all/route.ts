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

    const sql = `
        SELECT 
            h.amp_code,
            a.amp_name,
            h.hospcode,
            h.hospname
        FROM hospital h
        LEFT JOIN ampur a ON h.amp_code = a.amp_code
        LEFT JOIN hdc ON h.hospcode = hdc.hospcode 
            AND hdc.year_th = ? 
            AND hdc.month_no = ?
        WHERE UPPER(IFNULL(hdc.sentdata, 'N')) != 'Y'
        ORDER BY h.amp_code ASC, h.hospcode ASC
    `;

    try {
        const [rows] = await pool.query<RowDataPacket[]>(sql, [year, month]);

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
