// src/app/api/donate/route.ts
// Records donor self-report after they tap "I Sent My Donation".
// The TreasuryStatsBar already counts real on-chain inbound payments, so this is
// supplemental — it lets us attach email/note to a donor record for follow-up.

import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function POST(req: NextRequest) {
  try {
    const b = await req.json().catch(() => ({}));
    const { amount, currency, email, wallet, txHash, note } = b || {};

    const row = await prisma.donation.create({
      data: {
        amount:   String(amount   || '0'),
        currency: String(currency || 'XRP'),
        email:    email  || null,
        wallet:   wallet || null,
        txHash:   txHash || null,
        note:     note   || null,
      },
    });
    return NextResponse.json({ ok: true, id: row.id });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'donate write failed';
    console.error('[donate]', msg);
    // Graceful — donation already happened on-chain, this is just a record-keeping helper
    return NextResponse.json({ ok: false, error: msg }, { status: 200 });
  }
}
