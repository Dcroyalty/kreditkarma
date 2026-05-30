import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const ADMIN_SECRET = process.env.ADMIN_SECRET || '';

// POST /api/grants/approve — YOUR manual final approval step.
// Body: { id, action: 'APPROVE'|'REJECT'|'PAID', txHash?, secret }
// Funds are never moved automatically — this only records your decision.
// When you mark a grant PAID, you pass the XRPL txHash of the payout you signed in Xaman.
export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const { id, action, txHash, secret } = body || {};

    // Auth — require the admin secret (also accept it via x-admin-secret header)
    const headerSecret = req.headers.get('x-admin-secret') || '';
    if (!ADMIN_SECRET || (secret !== ADMIN_SECRET && headerSecret !== ADMIN_SECRET)) {
      return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
    }

    if (!id || !action) {
      return NextResponse.json({ error: 'id and action are required' }, { status: 400 });
    }

    const statusMap: Record<string, string> = {
      APPROVE: 'APPROVED',
      REJECT: 'REJECTED',
      PAID: 'PAID',
      FAIL: 'FAILED',
    };
    const newStatus = statusMap[String(action).toUpperCase()];
    if (!newStatus) {
      return NextResponse.json({ error: 'invalid action' }, { status: 400 });
    }

    const data: Record<string, unknown> = { status: newStatus, reviewedAt: new Date() };
    if (newStatus === 'PAID' && txHash) data.payoutTx = String(txHash);

    let grant;
    try {
      grant = await prisma.grantRequest.update({ where: { id: String(id) }, data });
    } catch {
      // Fallback if reviewedAt / payoutTx columns aren't in the schema yet:
      //   reviewedAt DateTime?
      //   payoutTx   String?
      grant = await prisma.grantRequest.update({ where: { id: String(id) }, data: { status: newStatus } });
    }

    return NextResponse.json({ ok: true, id: grant.id, status: grant.status });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'approve failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
