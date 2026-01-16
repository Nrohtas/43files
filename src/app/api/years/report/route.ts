import { NextResponse } from 'next/server';
import { pool } from '@/lib/db';

export async function GET() {
    try {
        // ดึงปีงบประมาณจากตาราง hdc โดยใช้ b_year
        const [rows]: any = await pool.query("SELECT DISTINCT b_year FROM hdc WHERE b_year IS NOT NULL ORDER BY b_year DESC");
        const years = rows.map((row: any) => String(row.b_year));
        return NextResponse.json(years);
    } catch (error) {
        console.error('Error fetching report years:', error);
        return NextResponse.json({ error: 'Database error' }, { status: 500 });
    }
}
