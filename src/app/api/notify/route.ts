import { NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Proxy to the Admin API, the ONE notification writer. Resolves who to notify
// and writes notification docs via the Admin SDK. Passes through the caller's
// Authorization header (Firebase ID token) and the JSON body. Mirrors
// remove-member's proxy conventions.
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

    const res = await fetch(`${adminUrl}/api/notify`, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) console.error('[notify] Admin returned', res.status, data);
    return NextResponse.json(data, { status: res.status });
  } catch (e) {
    console.error('[notify] proxy failed:', e);
    return NextResponse.json({ ok: false, error: 'Failed to reach the notification service' }, { status: 502 });
  }
}
