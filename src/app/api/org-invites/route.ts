import { NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const orgId = searchParams.get('orgId');
  if (!orgId) {
    return NextResponse.json({ error: 'orgId is required' }, { status: 400 });
  }

  try {
    const adminUrl = process.env.ADMIN_API_URL || 'https://admin.nearwork.co';
    const res = await fetch(`${adminUrl}/api/org-invites?orgId=${encodeURIComponent(orgId)}`);
    const data = await res.json().catch(() => ({}));
    return NextResponse.json(data, { status: res.status });
  } catch (e) {
    console.error('[org-invites] proxy failed:', e);
    return NextResponse.json({ error: 'Failed to fetch invites' }, { status: 502 });
  }
}
