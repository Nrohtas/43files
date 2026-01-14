import { NextResponse } from 'next/server';
import { pool } from '@/lib/db';
import { RowDataPacket } from 'mysql2';
import { signToken } from '@/lib/jwt';

export async function POST(request: Request) {
    try {
        const { username, password } = await request.json();

        if (!username || !password) {
            return NextResponse.json({ error: 'Username and password are required' }, { status: 400 });
        }

        const sql = 'SELECT * FROM users WHERE username = ? AND password = ?'; // In production, use hashed passwords!

        const [rows] = await pool.query<RowDataPacket[]>(sql, [username, password]);

        if (rows.length > 0) {
            const user = rows[0];
            const token = signToken({ username: user.username, role: user.level });

            return NextResponse.json({
                success: true,
                token,
                user: {
                    username: user.username,
                    role: user.level || 'user',
                    email: user.email,
                    fname: user.fname,
                    lname: user.lname
                }
            });
        } else {
            return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
        }
    } catch (error) {
        console.error('Login error:', error);
        return NextResponse.json({ error: 'Database error' }, { status: 500 });
    }
}
