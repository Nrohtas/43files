import { NextResponse } from 'next/server';
import { pool } from '@/lib/db';
import { getCurrentFiscalYear } from '@/utils/fiscalYear';

export async function GET() {
    try {
        // ดึงปีงบประมาณจากตาราง year และตาราง hdc, oppp โดยใช้ b_year (ยกเว้น 2568)
        const [rows]: any = await pool.query(`
            SELECT DISTINCT b_year as year_value FROM year WHERE b_year IS NOT NULL AND b_year != '2568'
            UNION
            SELECT DISTINCT b_year as year_value FROM hdc WHERE b_year IS NOT NULL AND b_year != '2568'
            UNION
            SELECT DISTINCT b_year as year_value FROM oppp WHERE b_year IS NOT NULL AND b_year != '2568'
            ORDER BY year_value DESC
        `);
        const yearsSet = new Set<string>(rows.map((row: any) => String(row.year_value)));
        
        // รับประกันว่ามีปีงบประมาณปัจจุบันเสมอ แม้ฐานข้อมูลยังไม่มีข้อมูล
        const currentFiscal = getCurrentFiscalYear();
        if (currentFiscal) {
            yearsSet.add(currentFiscal);
        }

        const years = Array.from(yearsSet).sort((a, b) => b.localeCompare(a));
        return NextResponse.json(years);
    } catch (error) {
        console.error('Error fetching report years:', error);
        return NextResponse.json({ error: 'Database error' }, { status: 500 });
    }
}
