// src/app/api/grants/approve/route.ts
// Manual final approval (you). Locked behind ADMIN_SECRET.
// Matches LIVE Neon columns: txHash (NOT payoutTx), paidAt (NOT reviewedAt).

import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
// Accept either the server env secret OR the admin-panel password.
// The admin page authenticates the human with ADMIN_PWD client-side, then sends it here.
const ADMIN_SECRET = process.env.ADMIN_SECRET || '';
const ADMIN_PWD = 'xrplhub2026'; // must match ADMIN_PWD in the admin page

function isAuthed(secret: string, headerSecret: string): boolean {
  const provided = secret || headerSecret;
  if (!provided) return false;
  if (ADMIN_SECRET && provided === ADMIN_SECRET) return true;
  if (provided === ADMIN_PWD) return true;
  return false;
}

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const { id, action, txHash, approvedAmount, rejectionReason, secret } = body || {};

    const headerSecret = req.headers.get('x-admin-secret') || '';
    if (!isAuthed(String(secret || ''), headerSecret)) {
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
