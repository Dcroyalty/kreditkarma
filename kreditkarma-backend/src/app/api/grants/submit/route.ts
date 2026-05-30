import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// POST /api/grants/submit — persist a new grant application as PENDING
export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const { name, wallet, email, phone, category, need, amount } = body || {};

    if (!wallet || !need || !category) {
      return NextResponse.json({ error: 'wallet, category, and need are required' }, { status: 400 });
    }
    if (!String(wallet).startsWith('r') || String(wallet).length < 25) {
      return NextResponse.json({ error: 'invalid XRPL wallet' }, { status: 400 });
    }

    const amt = Math.max(0, Math.min(100, Number(amount) || 0));

    const grant = await prisma.grantRequest.create({
      data: {
        name: name || 'Anonymous',
        wallet: String(wallet),
        email: email || null,
        phone: phone || null,
        category: String(category),
        need: String(need),
        amount: amt,
        status: 'PENDING',
      },
    });

    return NextResponse.json({ ok: true, id: grant.id, status: grant.status });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'submit failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
