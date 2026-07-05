import { NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Proxy to the Admin API, which revokes a teammate's workspace access via the
// Admin SDK (clients can't edit org membership directly). Mirrors send-invite.
export async function POST(req: Request) {
  let body: Record<string, string>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  try {
    const adminUrl = process.env.ADMIN_API_URL || 'https://admin.nearwork.co';
    const res = await fetch(`${adminUrl}/api/remove-member`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) console.error('[remove-member] Admin returned', res.status, data);
    return NextResponse.json(data, { status: res.status });
  } catch (e) {
    console.error('[remove-member] proxy failed:', e);
    return NextResponse.json({ error: 'Failed to reach the member service' }, { status: 502 });
  }
}
