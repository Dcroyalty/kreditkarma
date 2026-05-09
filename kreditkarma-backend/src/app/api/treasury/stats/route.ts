// src/app/api/treasury/stats/route.ts
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getTreasuryBalance } from "@/lib/treasury";

export const revalidate = 60; // cache for 60s (Next.js ISR)

export async function GET() {
  const [treasury, grants, donations] = await Promise.all([
    getTreasuryBalance().catch(() => ({ xrp: 0, rlusd: 0 })),
    db.grantRequest.aggregate({
      where: { status: "PAID" },
      _count: { id: true },
      _sum: { paidAmount: true },
    }),
    db.donation.aggregate({
      _sum: { amount: true },
      _count: { id: true },
    }),
  ]);

  return NextResponse.json({
    treasury,
    grantsIssued: grants._count.id,
    totalDistributed: grants._sum.paidAmount ?? 0,
    totalDonations: donations._sum.amount ?? 0,
    donorCount: donations._count.id,
  });
}
