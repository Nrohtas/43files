import { NextResponse } from 'next/server';
import { pool } from '@/lib/db';

export async function GET() {
    try {
        const [rows] = await pool.query('SELECT * FROM fileupload ORDER BY file_time DESC LIMIT 5');
        return NextResponse.json(rows);
    } catch (error) {
        console.error('Error fetching upload history:', error);
        return NextResponse.json({ error: 'Database error' }, { status: 500 });
    }
}
