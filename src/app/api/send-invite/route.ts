import { NextResponse } from 'next/server';
import { getPostHogClient } from '@/lib/posthog-server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  let body: Record<string, string>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  try {
    const adminUrl = process.env.ADMIN_API_URL || 'https://admin.nearwork.co';
    const res = await fetch(`${adminUrl}/api/send-invite`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) console.error('[send-invite] Admin returned', res.status, data);
    if (res.ok) {
      const posthog = getPostHogClient();
      posthog.capture({
        distinctId: body.email || 'anonymous',
        event: 'invite_sent',
        properties: {
          org_id: body.orgId,
          org_name: body.orgName,
          invitee_role: body.role,
          source: 'api',
        },
      });
    }
    return NextResponse.json(data, { status: res.status });
  } catch (e) {
    console.error('[send-invite] proxy failed:', e);
    return NextResponse.json({ error: 'Failed to reach invite service' }, { status: 502 });
  }
}
