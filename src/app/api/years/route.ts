import { NextResponse } from 'next/server';
import { pool } from '@/lib/db';

export async function GET() {
    try {
        // ดึงปีงบประมาณจากตาราง year และจาก HDC (b_year), OPPP (b_year) รวมกันโดยไม่ซ้ำ (ยกเว้น 2568)
        const [rows]: any = await pool.query(`
            SELECT DISTINCT b_year as year_value FROM year WHERE b_year IS NOT NULL AND b_year != '2568'
            UNION
            SELECT DISTINCT b_year as year_value FROM hdc WHERE b_year IS NOT NULL AND b_year != '2568'
            UNION
            SELECT DISTINCT b_year as year_value FROM oppp WHERE b_year IS NOT NULL AND b_year != '2568'
            ORDER BY year_value DESC
        `);
        const years = rows.map((row: any) => String(row.year_value));
        return NextResponse.json(years);
    } catch (error) {
        console.error('Error fetching years:', error);
        return NextResponse.json({ error: 'Database error' }, { status: 500 });
    }
}
