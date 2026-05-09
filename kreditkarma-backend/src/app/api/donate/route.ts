// src/app/api/donate/route.ts
// Records a donation tx + returns treasury address for the frontend to initiate payment
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { isValidClassicAddress } from "xrpl";
import { db } from "@/lib/db";
import { getTreasuryConfig } from "@/lib/treasury";
import { getXrplClient } from "@/lib/xrpl-client";

const donateSchema = z.object({
  fromAddress: z.string().refine(isValidClassicAddress),
  txHash: z.string().min(60).max(70),
  amount: z.number().positive(),
  currency: z.enum(["XRP", "RLUSD"]),
  message: z.string().max(200).optional(),
});

// GET — returns treasury address so frontend knows where to send
export async function GET() {
  const { address } = getTreasuryConfig();
  return NextResponse.json({
    treasuryAddress: address,
    network: process.env.XRPL_NODE_URL?.includes("altnet") ? "testnet" : "mainnet",
  });
}

// POST — record a completed donation tx
export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parse = donateSchema.safeParse(body);
  if (!parse.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parse.error.flatten() },
      { status: 400 }
    );
  }

  const { fromAddress, txHash, amount, currency, message } = parse.data;

  // Verify tx on-chain
  try {
    const xrpl = await getXrplClient();
    const txResult = await xrpl.request({
      command: "tx",
      transaction: txHash,
    });

    const tx = (txResult.result as any);

    // Verify it's a payment to our treasury
    const { address: treasuryAddr } = getTreasuryConfig();
    if (tx.Destination !== treasuryAddr) {
      return NextResponse.json(
        { error: "Transaction destination does not match treasury address" },
        { status: 400 }
      );
    }

    if (tx.meta?.TransactionResult !== "tesSUCCESS") {
      return NextResponse.json({ error: "Transaction did not succeed on ledger" }, { status: 400 });
    }
  } catch (err: any) {
    if (err?.data?.error === "txnNotFound") {
      return NextResponse.json(
        { error: "Transaction not found on ledger — please wait for confirmation" },
        { status: 404 }
      );
    }
    console.error("[Donate] TX verification failed:", err);
    // Don't hard fail — record anyway for manual reconciliation
  }

  const donation = await db.donation.upsert({
    where: { txHash },
    create: { fromAddress, txHash, amount, currency, message },
    update: {},
  });

  return NextResponse.json({
    success: true,
    donationId: donation.id,
    message: "Thank you for your donation! 💙",
  });
}
