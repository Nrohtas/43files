import { NextRequest, NextResponse } from 'next/server';
import { pool } from '@/lib/db';

import { verifyToken } from '@/lib/jwt';

export async function GET(request: NextRequest) {
    const authHeader = request.headers.get('Authorization');
    const token = authHeader?.split(' ')[1];
    const decoded = token ? verifyToken(token) : null;

    if (!decoded) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const type = searchParams.get('type') || 'hdc';

    try {
        const [rows]: any = await pool.query(
            'SELECT MAX(file_time) as last_update FROM fileupload WHERE file_type = ? AND file_time IS NOT NULL',
            [type]
        );

        const lastUpdate = rows[0]?.last_update || null;
        return NextResponse.json({ lastUpdate });
    } catch (error) {
        console.error('Error fetching last update:', error);
        return NextResponse.json({ error: 'Database error' }, { status: 500 });
    }
}
