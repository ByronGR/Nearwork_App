import { NextResponse } from 'next/server';
import crypto from 'crypto';

export async function POST(req: Request) {
  const secret = process.env.INTERCOM_SECRET;
  if (!secret) {
    return NextResponse.json({ error: 'INTERCOM_SECRET not configured' }, { status: 500 });
  }

  const { userId, email } = await req.json().catch(() => ({} as Record<string, string>));
  if (!userId) {
    return NextResponse.json({ error: 'userId is required' }, { status: 400 });
  }

  const header = Buffer.from(JSON.stringify({ typ: 'JWT', alg: 'HS256' })).toString('base64url');
  const now = Math.floor(Date.now() / 1000);
  const payload = Buffer.from(JSON.stringify({
    user_id: userId,
    ...(email ? { email } : {}),
    iat: now,
    exp: now + 86400,
  })).toString('base64url');
  const signature = crypto
    .createHmac('sha256', secret)
    .update(`${header}.${payload}`)
    .digest('base64url');

  return NextResponse.json({ token: `${header}.${payload}.${signature}` });
}
