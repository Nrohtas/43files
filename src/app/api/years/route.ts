import { NextResponse } from 'next/server';
import { pool } from '@/lib/db';

export async function GET() {
    try {
        // ดึงปีงบประมาณจากทั้ง HDC (b_year) และ OPPP (b_year) แล้วรวมกันโดยไม่ซ้ำ
        const [rows]: any = await pool.query(`
            SELECT DISTINCT b_year as year_value FROM hdc WHERE b_year IS NOT NULL
            UNION
            SELECT DISTINCT b_year as year_value FROM oppp WHERE b_year IS NOT NULL
            ORDER BY year_value DESC
        `);
        const years = rows.map((row: any) => String(row.year_value));
        return NextResponse.json(years);
    } catch (error) {
        console.error('Error fetching years:', error);
        return NextResponse.json({ error: 'Database error' }, { status: 500 });
    }
}
