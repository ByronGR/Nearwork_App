import { NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Same-origin proxy to the Admin API's /api/client-move (the writer). Admin
// verifies the caller owns the org + performs the sourcing stage move with the
// Admin SDK. Passing through the caller's token keeps that check honest; the
// browser never writes the pipeline doc. Mirrors the /api/notify proxy.
export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: 'Invalid JSON body' }, { status: 400 });
  }

  try {
    const adminUrl = process.env.ADMIN_API_URL || 'https://admin.nearwork.co';
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    const auth = req.headers.get('authorization');
    if (auth) headers['Authorization'] = auth;

    const res = await fetch(`${adminUrl}/api/client-move`, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) console.error('[client-move] Admin returned', res.status, data);
    return NextResponse.json(data, { status: res.status });
  } catch (e) {
    console.error('[client-move] proxy failed:', e);
    return NextResponse.json({ ok: false, error: 'Failed to reach the server' }, { status: 502 });
  }
}
