import { NextResponse } from 'next/server';
import { pool } from '@/lib/db';

export async function GET() {
    try {
        const [rows]: any = await pool.query('SELECT amp_code as code, amp_name as name FROM ampur ORDER BY amp_code ASC');
        const districts = rows.map((row: any) => ({
            code: row.code,
            name: row.name
        }));
        return NextResponse.json(districts);
    } catch (error) {
        console.error('Error fetching districts:', error);
        return NextResponse.json({ error: 'Database error' }, { status: 500 });
    }
}
