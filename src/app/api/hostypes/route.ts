import { NextResponse } from 'next/server';
import { pool } from '@/lib/db';
import { RowDataPacket } from 'mysql2';

export async function GET() {
    const sql = `
        SELECT MIN(hostype_new) as code, hostype_name as name 
        FROM hostype 
        GROUP BY hostype_name 
        ORDER BY 
            CASE 
                WHEN hostype_name = 'สังกัดอื่น' THEN 2
                ELSE 1
            END,
            MIN(hostype_new) ASC
    `;

    try {
        const [rows] = await pool.query<RowDataPacket[]>(sql);
        const hostypes = rows.map((row: any) => ({
            code: row.code,
            name: row.name
        }));
        return NextResponse.json(hostypes);
    } catch (error) {
        console.error('Error executing query:', error);
        return NextResponse.json({ error: 'Database error' }, { status: 500 });
    }
}
