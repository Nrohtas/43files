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

    // ใช้ b_year เป็นปีงบประมาณ และ status10-09 เป็นสถานะแต่ละเดือน
    let sql = `
        SELECT 
            ho.hospcode,
            ho.hospname,
            ho.hostype_new,
            hdc.b_year as fiscal_year,
            hdc.status10 as month_10,
            hdc.status11 as month_11,
            hdc.status12 as month_12,
            hdc.status01 as month_13,
            hdc.status02 as month_14,
            hdc.status03 as month_15,
            hdc.status04 as month_16,
            hdc.status05 as month_17,
            hdc.status06 as month_18,
            hdc.status07 as month_19,
            hdc.status08 as month_20,
            hdc.status09 as month_21
        FROM hospital ho
        LEFT JOIN hdc ON ho.hospcode = hdc.hospcode 
            AND hdc.b_year = ?
        LEFT JOIN hostype ht ON ho.hostype_new = ht.hostype_new
        WHERE ho.amp_code = ?
    `;

    const sqlParams: any[] = [year, district];

    if (hostype) {
        sql += ' AND ht.hostype_name = ?';
        sqlParams.push(hostype);
    }

    sql += ' ORDER BY ho.hospcode ASC';

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
