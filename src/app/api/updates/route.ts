import { NextResponse } from 'next/server';
import { pool } from '@/lib/db';
import { RowDataPacket, ResultSetHeader } from 'mysql2';

export async function GET() {
    try {
        const [rows] = await pool.query<RowDataPacket[]>('SELECT * FROM siteupdate ORDER BY update_created DESC');
        return NextResponse.json(rows);
    } catch (error) {
        console.error('Error fetching updates:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { update_date, update_description } = body;

        if (!update_date || !update_description) {
            return NextResponse.json({ error: 'Date and description are required' }, { status: 400 });
        }

        // Auto-generate version from date: YYYY-MM-DD -> VYYYYMMDD
        const update_version = 'V' + update_date.replace(/-/g, '');

        const [result] = await pool.query<ResultSetHeader>(
            'INSERT INTO siteupdate (update_date, update_description, update_version) VALUES (?, ?, ?)',
            [update_date, update_description, update_version]
        );

        return NextResponse.json({
            message: 'Update created successfully',
            id: result.insertId
        }, { status: 201 });
    } catch (error: any) {
        console.error('Error creating update:', error);
        return NextResponse.json({
            error: 'Internal Server Error',
            details: error?.message || 'Unknown error'
        }, { status: 500 });
    }
}

export async function DELETE(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');

        if (!id) {
            return NextResponse.json({ error: 'ID is required' }, { status: 400 });
        }

        await pool.query('DELETE FROM siteupdate WHERE update_id = ?', [id]);

        return NextResponse.json({ message: 'Update deleted successfully' });
    } catch (error) {
        console.error('Error deleting update:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
