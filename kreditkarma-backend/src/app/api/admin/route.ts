// src/app/api/admin/route.ts
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getTreasuryBalance } from "@/lib/treasury";
import { sendRlusdFromTreasury, sendXrpFromTreasury } from "@/lib/treasury";

function requireAdmin(req: NextRequest): boolean {
  const auth = req.headers.get("x-admin-secret");
  return auth === process.env.ADMIN_SECRET;
}

// GET /api/admin — dashboard stats
export async function GET(req: NextRequest) {
  if (!requireAdmin(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const [
    grants,
    recentGrants,
    donations,
    treasury,
    today,
  ] = await Promise.all([
    db.grantRequest.groupBy({
      by: ["status"],
      _count: { id: true },
      _sum: { paidAmount: true },
    }),
    db.grantRequest.findMany({
      take: 20,
      orderBy: { createdAt: "desc" },
      include: { ledgerScore: { select: { score: true, tier: true } } },
    }),
    db.donation.aggregate({
      _sum: { amount: true },
      _count: { id: true },
    }),
    getTreasuryBalance().catch(() => ({ xrp: 0, rlusd: 0 })),
    db.dailyLimit.findUnique({
      where: { date: new Date().toISOString().slice(0, 10) },
    }),
  ]);

  const grantStats = Object.fromEntries(
    grants.map((g) => [
      g.status,
      { count: g._count.id, totalPaid: g._sum.paidAmount ?? 0 },
    ])
  );

  return NextResponse.json({
    treasury,
    grantStats,
    recentGrants,
    donations: {
      total: donations._sum.amount ?? 0,
      count: donations._count.id,
    },
    todayStats: today ?? { totalPaid: 0, grantCount: 0 },
    dailyLimitMax: Number(process.env.GRANT_DAILY_LIMIT_USD ?? 1000),
  });
}

// POST /api/admin — manual actions
export async function POST(req: NextRequest) {
  if (!requireAdmin(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { action, grantId } = body;

  if (action === "approve_and_pay") {
    const grant = await db.grantRequest.findUnique({ where: { id: grantId } });
    if (!grant) return NextResponse.json({ error: "Grant not found" }, { status: 404 });
    if (grant.status === "PAID") return NextResponse.json({ error: "Already paid" }, { status: 400 });

    const amount = grant.approvedAmount ?? grant.amountRequested;

    try {
      const memo = `KreditKarma Admin Grant: ${grant.category}`;
      const txResult =
        grant.currency === "RLUSD"
          ? await sendRlusdFromTreasury(grant.walletAddress, amount, memo)
          : await sendXrpFromTreasury(grant.walletAddress, amount, memo);

      await db.grantRequest.update({
        where: { id: grantId },
        data: {
          status: "PAID",
          txHash: txResult.txHash,
          paidAt: new Date(),
          paidAmount: amount,
          reviewedBy: "ADMIN",
        },
      });

      await db.adminLog.create({
        data: {
          action: "MANUAL_PAY",
          actor: "ADMIN",
          target: grantId,
          details: JSON.stringify({ txHash: txResult.txHash, amount }),
        },
      });

      return NextResponse.json({ success: true, txHash: txResult.txHash });
    } catch (err: any) {
      return NextResponse.json({ error: err.message }, { status: 500 });
    }
  }

  if (action === "reject") {
    const { reason } = body;
    await db.grantRequest.update({
      where: { id: grantId },
      data: { status: "REJECTED", rejectionReason: reason ?? "Rejected by admin", reviewedBy: "ADMIN" },
    });

    await db.adminLog.create({
      data: { action: "REJECT", actor: "ADMIN", target: grantId, details: JSON.stringify({ reason }) },
    });

    return NextResponse.json({ success: true });
  }

  return NextResponse.json({ error: "Unknown action" }, { status: 400 });
}
