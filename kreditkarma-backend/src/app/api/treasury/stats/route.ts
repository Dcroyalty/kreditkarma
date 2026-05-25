import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const TREASURY = 'rs59g3amo5iT6T64Cg96XXMAWuw3WPQcLF';
const XRPL_API  = 'https://xrplcluster.com';

// ─── Cache so XRPL isn't hammered on every poll ──────────────────────────────
let cache: { data: StatsPayload; ts: number } | null = null;
const CACHE_TTL = 25_000; // 25s — slightly under the 30s frontend poll

interface StatsPayload {
  xrplScores:   number;
  grantsfunded: string;   // USD string e.g. "$1,240"
  treasuryXRP:  number;
  treasuryUSD:  string;
  txCount:      number;
  servicesCount: number;
  overhead:     string;
  donorCount:   number;
  grantCount:   number;
  updatedAt:    string;
}

async function fetchXRPLAccountInfo() {
  const res = await fetch(XRPL_API, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      method: 'account_info',
      params: [{ account: TREASURY, ledger_index: 'validated' }]
    }),
    next: { revalidate: 0 }
  });
  const json = await res.json();
  return json?.result?.account_data;
}

async function fetchXRPLTxCount() {
  const res = await fetch(XRPL_API, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      method: 'account_tx',
      params: [{ account: TREASURY, limit: 400, ledger_index_min: -1, ledger_index_max: -1 }]
    }),
    next: { revalidate: 0 }
  });
  const json = await res.json();
  return {
    txCount: json?.result?.transactions?.length || 0,
    // Count incoming payments as donations
    donorCount: (json?.result?.transactions || []).filter((t: {tx?: {TransactionType?: string; Destination?: string}}) =>
      t.tx?.TransactionType === 'Payment' && t.tx?.Destination === TREASURY
    ).length
  };
}

async function fetchXRPPrice(): Promise<number> {
  try {
    const res = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=ripple&vs_currencies=usd', {
      next: { revalidate: 60 }
    });
    const json = await res.json();
    return json?.ripple?.usd || 0.5;
  } catch {
    return 0.5;
  }
}

async function getDBStats() {
  try {
    const [scoreCount, grantCount] = await Promise.all([
      prisma.scoreCheck?.count().catch(() => 0) || 0,
      prisma.grantApplication?.count().catch(() => 0) || 0,
    ]);
    return { scoreCount, grantCount };
  } catch {
    return { scoreCount: 0, grantCount: 0 };
  }
}

export async function GET() {
  try {
    // Return cached data if fresh
    if (cache && Date.now() - cache.ts < CACHE_TTL) {
      return NextResponse.json(cache.data, {
        headers: { 'Cache-Control': 'no-store' }
      });
    }

    // Fetch all data in parallel
    const [accountInfo, txData, xrpPrice, dbStats] = await Promise.all([
      fetchXRPLAccountInfo().catch(() => null),
      fetchXRPLTxCount().catch(() => ({ txCount: 0, donorCount: 0 })),
      fetchXRPPrice(),
      getDBStats(),
    ]);

    // Treasury balance in XRP (drops / 1,000,000)
    const balanceXRP = accountInfo?.Balance
      ? Math.floor(Number(accountInfo.Balance) / 1_000_000)
      : 0;

    const balanceUSD = balanceXRP * xrpPrice;

    // Format USD display
    const fmtUSD = (n: number) =>
      n >= 1000
        ? `$${(n / 1000).toFixed(1)}K`
        : `$${Math.floor(n).toLocaleString()}`;

    const payload: StatsPayload = {
      xrplScores:    dbStats.scoreCount,
      grantsEnabled: true,
      grantsUSD:     fmtUSD(balanceUSD * 0.85), // 85% of treasury earmarked for grants
      treasuryXRP:   balanceXRP,
      treasuryUSD:   fmtUSD(balanceUSD),
      txCount:       txData.txCount,
      servicesCount: 35,
      overhead:      '0%',
      donorCount:    txData.donorCount,
      grantCount:    dbStats.grantCount,
      updatedAt:     new Date().toISOString(),
    } as unknown as StatsPayload;

    // Update cache
    cache = { data: payload, ts: Date.now() };

    return NextResponse.json(payload, {
      headers: { 'Cache-Control': 'no-store' }
    });

  } catch (err) {
    console.error('Stats error:', err);
    // Return safe fallback on error
    return NextResponse.json({
      xrplScores:   0,
      grantsUSD:    '$0',
      treasuryXRP:  0,
      treasuryUSD:  '$0',
      txCount:      0,
      servicesCount: 35,
      overhead:     '0%',
      donorCount:   0,
      grantCount:   0,
      updatedAt:    new Date().toISOString(),
    });
  }
}
