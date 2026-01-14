import { NextResponse } from 'next/server';
import { pool } from '@/lib/db';
import { RowDataPacket } from 'mysql2';

import { verifyToken } from '@/lib/jwt';

export async function GET(
    request: Request,
    { params }: { params: Promise<{ district: string }> }
) {
    // Authenticate (Guest or Admin)
    const authHeader = request.headers.get('Authorization');
    const token = authHeader?.split(' ')[1];
    const decoded = token ? verifyToken(token) : null;

    if (!decoded) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { district } = await params;
    const { searchParams } = new URL(request.url);
    const hostype = searchParams.get('hostype');
    const year = searchParams.get('year') || '2568';

    const currentYearInt = parseInt(year);
    const prevYearInt = currentYearInt - 1;
    const prevYear = prevYearInt.toString();

    let sql = `
        SELECT 
            h.hospcode,
            h.hospname,
            h.hostype_new,
            MAX(CASE WHEN hdc.month_no = '10' THEN hdc.sentdata END) as month_10,
            MAX(CASE WHEN hdc.month_no = '11' THEN hdc.sentdata END) as month_11,
            MAX(CASE WHEN hdc.month_no = '12' THEN hdc.sentdata END) as month_12,
            MAX(CASE WHEN hdc.month_no = '01' THEN hdc.sentdata END) as month_13,
            MAX(CASE WHEN hdc.month_no = '02' THEN hdc.sentdata END) as month_14,
            MAX(CASE WHEN hdc.month_no = '03' THEN hdc.sentdata END) as month_15,
            MAX(CASE WHEN hdc.month_no = '04' THEN hdc.sentdata END) as month_16,
            MAX(CASE WHEN hdc.month_no = '05' THEN hdc.sentdata END) as month_17,
            MAX(CASE WHEN hdc.month_no = '06' THEN hdc.sentdata END) as month_18,
            MAX(CASE WHEN hdc.month_no = '07' THEN hdc.sentdata END) as month_19,
            MAX(CASE WHEN hdc.month_no = '08' THEN hdc.sentdata END) as month_20,
            MAX(CASE WHEN hdc.month_no = '09' THEN hdc.sentdata END) as month_21
        FROM hospital h
        LEFT JOIN hdc ON h.hospcode = hdc.hospcode AND (
            (hdc.year_th = ? AND hdc.month_no IN ('01', '02', '03', '04', '05', '06', '07', '08', '09'))
            OR
            (hdc.year_th = ? AND hdc.month_no IN ('10', '11', '12'))
        )
        LEFT JOIN hostype ht ON h.hostype_new = ht.hostype_new
        WHERE h.amp_code = ?
    `;

    const sqlParams: any[] = [year, prevYear, district];

    if (hostype) {
        sql += ' AND ht.hostype_name = ?';
        sqlParams.push(hostype);
    }

    sql += ' GROUP BY h.hospcode, h.hospname, h.hostype_new ORDER BY h.hospcode ASC';

    try {
        const [rows] = await pool.query<RowDataPacket[]>(sql, sqlParams);

        const units = rows.map((row: any) => ({
            code: row.hospcode,
            name: row.hospname,
            hostype: row.hostype_new,
            months: [
                row.month_10, row.month_11, row.month_12,
                row.month_13, row.month_14, row.month_15,
                row.month_16, row.month_17, row.month_18,
                row.month_19, row.month_20, row.month_21
            ]
        }));

        return NextResponse.json(units);
    } catch (error) {
        console.error('Error executing query:', error);
        return NextResponse.json({ error: 'Database error' }, { status: 500 });
    }
}
