import { NextRequest, NextResponse } from 'next/server';
import { pool } from '@/lib/db';

import { verifyToken } from '@/lib/jwt';

export async function GET(request: NextRequest) {
    const authHeader = request.headers.get('Authorization');
    const token = authHeader?.split(' ')[1];
    const decoded = token ? verifyToken(token) : null;

    if (!decoded) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const year = searchParams.get('year') || '2568';
    const month = searchParams.get('month') || '11';

    try {
        const sql = `
            SELECT 
                h.amp_code,
                a.amp_name,
                h.hospcode,
                h.hospname
            FROM hospital h
            LEFT JOIN ampur a ON h.amp_code = a.amp_code
            LEFT JOIN oppp ON h.hospcode = oppp.hospcode 
                AND oppp.year_th = ? 
                AND oppp.month_no = ?
            WHERE UPPER(IFNULL(oppp.sentdata, 'N')) != 'Y'
            ORDER BY h.amp_code ASC, h.hospcode ASC
        `;

        const [rows]: any = await pool.query(sql, [year, month]);

        // Group by district
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

        return NextResponse.json(Object.values(grouped));
    } catch (error) {
        console.error('Error fetching OPPP missing units:', error);
        return NextResponse.json({ error: 'Database error' }, { status: 500 });
    }
}
