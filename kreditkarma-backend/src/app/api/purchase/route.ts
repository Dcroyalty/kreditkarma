// src/app/api/purchase/route.ts
// POST: record a verified purchase. GET: list purchases for ?email= or ?wallet=
// The /account dashboard reads from this.

import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function POST(req: NextRequest) {
  try {
    const b = await req.json().catch(() => ({}));
    const {
      productId, currency, amount, email, txHash, sender,
      serviceTxHash, status, verifiedAt, deliveredAt,
    } = b || {};

    if (!txHash && !serviceTxHash) {
      return NextResponse.json({ error: 'tx hash required' }, { status: 400 });
    }

    // If we already have a row keyed on the payment txHash, update it (this is the second
    // call from execute/verify upgrading the row to DELIVERED with the service tx).
    if (txHash) {
      const existing = await prisma.purchase.findFirst({ where: { txHash } }).catch(() => null);
      if (existing) {
        const updated = await prisma.purchase.update({
          where: { id: existing.id },
          data: {
            serviceTxHash: serviceTxHash || existing.serviceTxHash,
            status: status || existing.status,
            deliveredAt: deliveredAt ? new Date(deliveredAt) : existing.deliveredAt,
          },
        });
        return NextResponse.json({ ok: true, id: updated.id });
      }
    }

    const row = await prisma.purchase.create({
      data: {
        productId: String(productId || ''),
        currency:  String(currency  || 'XRP'),
        amount:    String(amount    || '0'),
        email:     email || null,
        wallet:    sender || null,
        txHash:    txHash || null,
        serviceTxHash: serviceTxHash || null,
        status:    status || 'VERIFIED',
        verifiedAt:  verifiedAt  ? new Date(verifiedAt)  : new Date(),
        deliveredAt: deliveredAt ? new Date(deliveredAt) : null,
      },
    });
    return NextResponse.json({ ok: true, id: row.id });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'purchase write failed';
    console.error('[purchase POST]', msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const email  = req.nextUrl.searchParams.get('email')  || '';
    const wallet = req.nextUrl.searchParams.get('wallet') || '';
    const where: Record<string, unknown> = {};
    if (email && wallet) Object.assign(where, { OR: [{ email }, { wallet }] });
    else if (email)  where.email  = email;
    else if (wallet) where.wallet = wallet;
    else return NextResponse.json([]);

    const rows = await prisma.purchase.findMany({
      where, orderBy: { verifiedAt: 'desc' }, take: 100,
    });
    return NextResponse.json(rows);
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'purchase read failed';
    console.error('[purchase GET]', msg);
    return NextResponse.json([], { status: 200 }); // graceful empty
  }
}
