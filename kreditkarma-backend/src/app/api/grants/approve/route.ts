// src/app/api/grants/approve/route.ts
// Manual final approval (you). Locked behind ADMIN_SECRET.
// Matches LIVE Neon columns: txHash (NOT payoutTx), paidAt (NOT reviewedAt).

import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const ADMIN_SECRET = process.env.ADMIN_SECRET || '';

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const { id, action, txHash, approvedAmount, rejectionReason, secret } = body || {};

    const headerSecret = req.headers.get('x-admin-secret') || '';
    if (!ADMIN_SECRET || (secret !== ADMIN_SECRET && headerSecret !== ADMIN_SECRET)) {
      return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
    }
    if (!id || !action) {
      return NextResponse.json({ error: 'id and action are required' }, { status: 400 });
    }

    const statusMap: Record<string, string> = {
      APPROVE: 'APPROVED', REJECT: 'REJECTED', PAID: 'PAID', FAIL: 'FAILED',
    };
    const newStatus = statusMap[String(action).toUpperCase()];
    if (!newStatus) {
      return NextResponse.json({ error: 'invalid action' }, { status: 400 });
    }

    const data: Record<string, unknown> = { status: newStatus };
    if (newStatus === 'PAID' && txHash) {
      data.txHash  = String(txHash);
      data.paidAt  = new Date();
      if (approvedAmount !== undefined) data.paidAmount = Number(approvedAmount);
    }
    if (newStatus === 'APPROVED' && approvedAmount !== undefined) {
      data.approvedAmount = Number(approvedAmount);
    }
    if (newStatus === 'REJECTED' && rejectionReason) {
      data.rejectionReason = String(rejectionReason);
    }

    const grant = await prisma.grantRequest.update({ where: { id: String(id) }, data });
    return NextResponse.json({ ok: true, id: grant.id, status: grant.status });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'approve failed';
    console.error('[grants/approve]', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
