import { NextResponse } from 'next/server';
import { signToken } from '@/lib/jwt';

export async function GET() {
    try {
        // Generate a guest token
        // We can add distinct properties if needed, e.g. ip address, user agent hash to prevent replay?
        // For now, simple guest token.
        const token = signToken({ role: 'guest', name: 'Guest User' });

        return NextResponse.json({ success: true, token });
    } catch (error) {
        return NextResponse.json({ error: 'Failed to generate token' }, { status: 500 });
    }
}
