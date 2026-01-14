import { NextResponse } from 'next/server';
import { pool } from '@/lib/db';

export async function GET() {
    try {
        const [rows]: any = await pool.query("SELECT year_th FROM `year` WHERE year_th = '2569'");
        const years = rows.map((row: any) => String(row.year_th));
        return NextResponse.json(years);
    } catch (error) {
        console.error('Error fetching report years:', error);
        return NextResponse.json({ error: 'Database error' }, { status: 500 });
    }
}
