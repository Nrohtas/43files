import { NextResponse } from 'next/server';
import { pool } from '@/lib/db';
import { RowDataPacket } from 'mysql2';

import { verifyToken } from '@/lib/jwt';
import { getCurrentFiscalYear } from '@/utils/fiscalYear';

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
    const year = searchParams.get('year') || getCurrentFiscalYear();

    const isAll = district.toLowerCase() === 'all';

    // Fetch result (service count) and status (Pass/Fail) for each month
    let sql = `
        SELECT 
            h.hospcode,
            h.hospname,
            h.hostype_new,
            h.amp_code,
            h.amp_name,
            hdc.target, hdc.result,
            hdc.result10, hdc.status10,
            hdc.result11, hdc.status11,
            hdc.result12, hdc.status12,
            hdc.result01, hdc.status01,
            hdc.result02, hdc.status02,
            hdc.result03, hdc.status03,
            hdc.result04, hdc.status04,
            hdc.result05, hdc.status05,
            hdc.result06, hdc.status06,
            hdc.result07, hdc.status07,
            hdc.result08, hdc.status08,
            hdc.result09, hdc.status09
        FROM hospital h
        LEFT JOIN hdc ON h.hospcode = hdc.hospcode AND hdc.b_year = ?
        LEFT JOIN hostype ht ON h.hostype_new = ht.hostype_new
    `;

    const sqlParams: any[] = [year];
    const conditions: string[] = [];

    if (!isAll) {
        conditions.push('h.amp_code = ?');
        sqlParams.push(district);
    }

    if (hostype) {
        conditions.push('ht.hostype_name = ?');
        sqlParams.push(hostype);
    }

    if (conditions.length > 0) {
        sql += ` WHERE ${conditions.join(' AND ')}`;
    }

    sql += ' ORDER BY h.amp_code ASC, h.hospcode ASC';

    try {
        const [rows] = await pool.query<RowDataPacket[]>(sql, sqlParams);

        const units = rows.map((row: any) => ({
            code: row.hospcode,
            name: row.hospname,
            hostype: row.hostype_new,
            amp_code: row.amp_code,
            amp_name: row.amp_name,
            target: row.target,
            result: row.result,
            months: [
                { total: row.result10, status: row.status10 },
                { total: row.result11, status: row.status11 },
                { total: row.result12, status: row.status12 },
                { total: row.result01, status: row.status01 },
                { total: row.result02, status: row.status02 },
                { total: row.result03, status: row.status03 },
                { total: row.result04, status: row.status04 },
                { total: row.result05, status: row.status05 },
                { total: row.result06, status: row.status06 },
                { total: row.result07, status: row.status07 },
                { total: row.result08, status: row.status08 },
                { total: row.result09, status: row.status09 }
            ]
        }));

        return NextResponse.json(units);
    } catch (error) {
        console.error('Error executing query:', error);
        return NextResponse.json({ error: 'Database error' }, { status: 500 });
    }
}
