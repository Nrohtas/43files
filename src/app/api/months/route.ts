import { NextResponse } from 'next/server';
import { pool } from '@/lib/db';

export async function GET() {
    try {
        const [rows]: any = await pool.query('SELECT month_no, month_name, month_th FROM month ORDER BY CAST(month_no AS UNSIGNED)');

        const months = rows.map((row: any) => ({
            value: row.month_no,
            name: row.month_name,
            shortName: row.month_th
        }));

        return NextResponse.json(months);
    } catch (error) {
        console.error('Error fetching months:', error);
        return NextResponse.json({ error: 'Database error' }, { status: 500 });
    }
}
