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

    let sql = `
        SELECT 
            h.hospcode,
            h.hospname,
            h.hostype_new,
            oppp.pass10, oppp.reject10, oppp.result10, oppp.status10,
            oppp.pass11, oppp.reject11, oppp.result11, oppp.status11,
            oppp.pass12, oppp.reject12, oppp.result12, oppp.status12,
            oppp.pass01, oppp.reject01, oppp.result01, oppp.status01,
            oppp.pass02, oppp.reject02, oppp.result02, oppp.status02,
            oppp.pass03, oppp.reject03, oppp.result03, oppp.status03,
            oppp.pass04, oppp.reject04, oppp.result04, oppp.status04,
            oppp.pass05, oppp.reject05, oppp.result05, oppp.status05,
            oppp.pass06, oppp.reject06, oppp.result06, oppp.status06,
            oppp.pass07, oppp.reject07, oppp.result07, oppp.status07,
            oppp.pass08, oppp.reject08, oppp.result08, oppp.status08,
            oppp.pass09, oppp.reject09, oppp.result09, oppp.status09
        FROM hospital h
        LEFT JOIN oppp ON h.hospcode = oppp.hospcode AND oppp.b_year = ?
        LEFT JOIN hostype ht ON h.hostype_new = ht.hostype_new
        WHERE h.amp_code = ?
    `;

    const sqlParams: any[] = [year, district];

    if (hostype) {
        sql += ' AND ht.hostype_name = ?';
        sqlParams.push(hostype);
    }

    sql += ' ORDER BY h.hospcode ASC';

    try {
        const [rows] = await pool.query<RowDataPacket[]>(sql, sqlParams);

        const units = rows.map((row: any) => ({
            code: row.hospcode,
            name: row.hospname,
            hostype: row.hostype_new,
            months: [
                { pass: row.pass10, reject: row.reject10, total: row.result10, status: row.status10 },
                { pass: row.pass11, reject: row.reject11, total: row.result11, status: row.status11 },
                { pass: row.pass12, reject: row.reject12, total: row.result12, status: row.status12 },
                { pass: row.pass01, reject: row.reject01, total: row.result01, status: row.status01 },
                { pass: row.pass02, reject: row.reject02, total: row.result02, status: row.status02 },
                { pass: row.pass03, reject: row.reject03, total: row.result03, status: row.status03 },
                { pass: row.pass04, reject: row.reject04, total: row.result04, status: row.status04 },
                { pass: row.pass05, reject: row.reject05, total: row.result05, status: row.status05 },
                { pass: row.pass06, reject: row.reject06, total: row.result06, status: row.status06 },
                { pass: row.pass07, reject: row.reject07, total: row.result07, status: row.status07 },
                { pass: row.pass08, reject: row.reject08, total: row.result08, status: row.status08 },
                { pass: row.pass09, reject: row.reject09, total: row.result09, status: row.status09 }
            ]
        }));

        return NextResponse.json(units);
    } catch (error) {
        console.error('Error executing query:', error);
        return NextResponse.json({ error: 'Database error' }, { status: 500 });
    }
}
