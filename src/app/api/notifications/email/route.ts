import { NextResponse } from 'next/server';
import { sendSystemEmail } from '@/lib/email/systemEmail';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const result = await sendSystemEmail(body);
        return NextResponse.json(result);
    } catch (error: any) {
        return NextResponse.json(
            { error: error.message || 'Error sending email' },
            { status: 500 }
        );
    }
}

