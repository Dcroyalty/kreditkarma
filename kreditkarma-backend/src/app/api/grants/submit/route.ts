// src/app/api/grants/submit/route.ts
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { isValidClassicAddress } from "xrpl";
import { db } from "@/lib/db";
import { buildAccountSnapshot } from "@/lib/xrpl-client";
import { calculateLedgerScore } from "@/lib/ledger-score";
import { underwriteGrant } from "@/lib/ai-underwriting";
import { sendRlusdFromTreasury, sendXrpFromTreasury, getTreasuryBalance } from "@/lib/treasury";

// ─── Validation schema ───────────────────────────────────────────────────────

const grantSchema = z.object({
  walletAddress: z.string().refine(isValidClassicAddress, "Invalid XRPL address"),
  category: z.enum(["RENT", "UTILITIES", "GROCERIES", "MEDICAL", "TRANSPORTATION", "OTHER"]),
  amountRequested: z.number().positive().max(200),
  currency: z.enum(["RLUSD", "XRP"]).default("RLUSD"),
  description: z.string().min(20).max(1000),
  urgency: z.enum(["LOW", "MEDIUM", "HIGH", "EMERGENCY"]).default("MEDIUM"),
});

// ─── Rate limiting (simple in-memory, use Redis in prod) ─────────────────────

const recentSubmissions = new Map<string, number[]>();
function isRateLimited(address: string): boolean {
  const now = Date.now();
  const window = 24 * 60 * 60 * 1000; // 24 hours
  const submissions = (recentSubmissions.get(address) ?? []).filter(
    (t) => now - t < window
  );
  submissions.push(now);
  recentSubmissions.set(address, submissions);
  return submissions.length > 2; // max 2 submissions per 24h per wallet
}

// ─── POST /api/grants/submit ─────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  // Validate input
  const parse = grantSchema.safeParse(body);
  if (!parse.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parse.error.flatten() },
      { status: 400 }
    );
  }

  const input = parse.data;

  // Rate limit check
  if (isRateLimited(input.walletAddress)) {
    return NextResponse.json(
      { error: "Too many grant requests. Please wait 24 hours between submissions." },
      { status: 429 }
    );
  }

  // Check for existing pending grant
  const existingPending = await db.grantRequest.findFirst({
    where: {
      walletAddress: input.walletAddress,
      status: { in: ["PENDING", "REVIEWING", "APPROVED"] },
    },
  });

  if (existingPending) {
    return NextResponse.json(
      { error: "You already have an active grant request. Please wait for it to be resolved." },
      { status: 409 }
    );
  }

  // Check daily payout limit
  const today = new Date().toISOString().slice(0, 10);
  const dailyLimit = await db.dailyLimit.findUnique({ where: { date: today } });
  const dailyMax = Number(process.env.GRANT_DAILY_LIMIT_USD ?? 1000);

  if (dailyLimit && dailyLimit.totalPaid >= dailyMax) {
    return NextResponse.json(
      { error: "Daily grant limit reached. Please try again tomorrow." },
      { status: 503 }
    );
  }

  // ── Create grant record (PENDING) ─────────────────────────────────────────
  const grant = await db.grantRequest.create({
    data: {
      walletAddress: input.walletAddress,
      category: input.category,
      amountRequested: input.amountRequested,
      currency: input.currency,
      description: input.description,
      urgency: input.urgency,
      status: "REVIEWING",
    },
  });

  try {
    // ── Fetch XRPL data + score ────────────────────────────────────────────
    let snapshot, score;
    try {
      snapshot = await buildAccountSnapshot(input.walletAddress);
      score = calculateLedgerScore(snapshot);

      // Link score to grant
      const storedScore = await db.ledgerScore.upsert({
        where: { address: input.walletAddress },
        create: {
          address: input.walletAddress,
          score: score.total,
          tier: score.tier,
          breakdown: JSON.stringify(score.components),
          rawData: JSON.stringify(snapshot),
        },
        update: {
          score: score.total,
          tier: score.tier,
          breakdown: JSON.stringify(score.components),
          rawData: JSON.stringify(snapshot),
        },
      });

      await db.grantRequest.update({
        where: { id: grant.id },
        data: {
          ledgerScoreId: storedScore.id,
          scoreSnapshot: score.total,
        },
      });
    } catch (err) {
      console.warn("[Grants] Could not fetch XRPL data for underwriting:", err);
    }

    // ── AI Underwriting ───────────────────────────────────────────────────
    const underwritingResult = await underwriteGrant({
      walletAddress: input.walletAddress,
      category: input.category,
      amountRequested: input.amountRequested,
      currency: input.currency,
      description: input.description,
      urgency: input.urgency,
      ledgerScore: score,
      accountAgeYears: snapshot?.accountAge ? snapshot.accountAge / (365 * 24 * 3600) : undefined,
      balanceXRP: snapshot?.balanceXRP,
      txCount: snapshot?.txCount,
    });

    // ── Update grant with underwriting result ─────────────────────────────
    await db.grantRequest.update({
      where: { id: grant.id },
      data: {
        aiScore: underwritingResult.aiScore,
        aiReasoning: underwritingResult.reasoning,
        riskFlags: JSON.stringify(underwritingResult.riskFlags),
        approvedAmount: underwritingResult.approvedAmount,
        status: underwritingResult.decision === "APPROVED"
          ? "APPROVED"
          : underwritingResult.decision === "REJECTED"
          ? "REJECTED"
          : "REVIEWING", // MANUAL_REVIEW stays in queue
        reviewedBy: "AI",
        ...(underwritingResult.decision === "REJECTED"
          ? { rejectionReason: underwritingResult.reasoning }
          : {}),
      },
    });

    // ── Auto-payout if approved ───────────────────────────────────────────
    if (underwritingResult.decision === "APPROVED" && underwritingResult.approvedAmount > 0) {
      // Verify treasury has funds
      try {
        const treasuryBalance = await getTreasuryBalance();
        const hasFunds =
          input.currency === "RLUSD"
            ? treasuryBalance.rlusd >= underwritingResult.approvedAmount
            : treasuryBalance.xrp >= underwritingResult.approvedAmount + 2; // buffer for fees

        if (!hasFunds) {
          await db.grantRequest.update({
            where: { id: grant.id },
            data: { status: "REVIEWING", aiReasoning: "Approved but treasury funds low — queued for manual payout" },
          });

          return NextResponse.json({
            grantId: grant.id,
            status: "APPROVED_QUEUED",
            message: "Your grant was approved! Payout queued (treasury replenishment needed).",
            approvedAmount: underwritingResult.approvedAmount,
            aiScore: underwritingResult.aiScore,
            reasoning: underwritingResult.reasoning,
          });
        }

        // Send payment
        const memo = `KreditKarma Grant: ${input.category} — ${input.description.slice(0, 50)}`;
        let txResult;

        if (input.currency === "RLUSD") {
          txResult = await sendRlusdFromTreasury(
            input.walletAddress,
            underwritingResult.approvedAmount,
            memo
          );
        } else {
          txResult = await sendXrpFromTreasury(
            input.walletAddress,
            underwritingResult.approvedAmount,
            memo
          );
        }

        // Update grant as PAID
        await db.grantRequest.update({
          where: { id: grant.id },
          data: {
            status: "PAID",
            txHash: txResult.txHash,
            paidAt: new Date(),
            paidAmount: underwritingResult.approvedAmount,
          },
        });

        // Update daily limit
        await db.dailyLimit.upsert({
          where: { date: today },
          create: {
            date: today,
            totalPaid: underwritingResult.approvedAmount,
            grantCount: 1,
          },
          update: {
            totalPaid: { increment: underwritingResult.approvedAmount },
            grantCount: { increment: 1 },
          },
        });

        return NextResponse.json({
          grantId: grant.id,
          status: "PAID",
          message: `🎉 Approved! ${underwritingResult.approvedAmount} ${input.currency} sent to your wallet.`,
          approvedAmount: underwritingResult.approvedAmount,
          currency: input.currency,
          txHash: txResult.txHash,
          aiScore: underwritingResult.aiScore,
          reasoning: underwritingResult.reasoning,
          processingTimeMs: underwritingResult.processingTimeMs,
        });
      } catch (payoutErr: any) {
        console.error("[Grants] Payout failed:", payoutErr);
        await db.grantRequest.update({
          where: { id: grant.id },
          data: { status: "FAILED", aiReasoning: `Approved but payout failed: ${payoutErr.message}` },
        });

        return NextResponse.json(
          {
            grantId: grant.id,
            status: "PAYOUT_FAILED",
            message: "Grant approved but payout encountered an error. Our team will process manually.",
            aiScore: underwritingResult.aiScore,
          },
          { status: 500 }
        );
      }
    }

    // Not auto-approved
    return NextResponse.json({
      grantId: grant.id,
      status: underwritingResult.decision === "REJECTED" ? "REJECTED" : "UNDER_REVIEW",
      message:
        underwritingResult.decision === "REJECTED"
          ? `Application not approved: ${underwritingResult.reasoning}`
          : "Your application is under review. You'll be notified within 24 hours.",
      aiScore: underwritingResult.aiScore,
      reasoning: underwritingResult.reasoning,
      riskFlags: underwritingResult.riskFlags,
      processingTimeMs: underwritingResult.processingTimeMs,
    });
  } catch (err: any) {
    // Rollback status to PENDING on unexpected error
    await db.grantRequest.update({
      where: { id: grant.id },
      data: { status: "PENDING" },
    }).catch(() => {});

    console.error("[Grants] Unexpected error:", err);
    return NextResponse.json(
      { error: "Internal server error", grantId: grant.id },
      { status: 500 }
    );
  }
}
