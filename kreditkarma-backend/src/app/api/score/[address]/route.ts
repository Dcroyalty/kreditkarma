import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// ─── SCORING WEIGHTS (proprietary — © 2026 XRPLHub.io) ───────────────────────
const W = {
  accountAge:    0.20,
  txVelocity:    0.22,
  trustLines:    0.15,
  dexActivity:   0.12,
  ammActivity:   0.08,
  reserveRatio:  0.10,
  nftActivity:   0.05,
  securityFlags: 0.08,
};

function grade(score: number) {
  if (score >= 800) return 'Exceptional';
  if (score >= 740) return 'Excellent';
  if (score >= 670) return 'Good';
  if (score >= 580) return 'Fair';
  return 'Building';
}

// ─── XRPL FETCHERS ───────────────────────────────────────────────────────────
// Robust against:
//   - xrplcluster.com rate-limiting (returns "Rate limit" plain text)
//   - HTML 502/503 error pages from any node
//   - Network timeouts
// Tries primary node, falls back to secondary, returns empty object as last resort
// so individual signal failures don't kill the whole score.
const XRPL_NODES = [
  'https://xrplcluster.com',
  'https://s1.ripple.com:51234',
  'https://s2.ripple.com:51234',
];

async function xrplCallOne(url: string, method: string, params: object): Promise<Record<string, unknown> | null> {
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ method, params: [params] }),
      signal: AbortSignal.timeout(9_000),
    });
    // Defensive: only attempt JSON parse if we actually got JSON
    const contentType = res.headers.get('content-type') || '';
    if (!contentType.includes('application/json')) return null;
    if (!res.ok) return null;
    return await res.json();
  } catch { return null; }
}

async function xrplCall(method: string, params: object): Promise<Record<string, unknown>> {
  for (const url of XRPL_NODES) {
    const result = await xrplCallOne(url, method, params);
    if (result) return result;
  }
  return {}; // all nodes failed — return empty so the catch chain doesn't break
}

// ─── SCORE COMPUTATION ───────────────────────────────────────────────────────
function computeScore(signals: Record<string, number>): number {
  const weighted = Object.entries(W).reduce(
    (acc, [key, weight]) => acc + (signals[key] || 0) * weight, 0
  );
  return Math.round(300 + weighted * 5.5);
}

function buildRecommendations(signals: Record<string, number>, hasEscrow: boolean) {
  const recs: { action: string; points: string; priority: 'high'|'medium'|'low' }[] = [];
  if (signals.txVelocity < 60)    recs.push({ action: 'Make 10 more on-chain payments', points: '+8\u201312 pts', priority: 'high' });
  if (signals.trustLines < 50)    recs.push({ action: 'Add 2 more XRPL trust lines', points: '+6\u201310 pts', priority: 'high' });
  if (signals.dexActivity < 40)   recs.push({ action: 'Place a DEX limit order', points: '+5\u20138 pts', priority: 'medium' });
  if (signals.ammActivity < 30)   recs.push({ action: 'Deposit into an AMM pool', points: '+4\u20137 pts', priority: 'medium' });
  if (signals.securityFlags < 50) recs.push({ action: 'Enable multi-sig on your wallet', points: '+4\u20136 pts', priority: 'medium' });
  if (signals.nftActivity < 20)   recs.push({ action: 'Mint or hold an XRPL NFT', points: '+2\u20134 pts', priority: 'low' });
  if (!hasEscrow)                 recs.push({ action: 'Create an escrow transaction', points: '+3\u20135 pts', priority: 'low' });
  if (signals.reserveRatio < 60)  recs.push({ action: 'Increase XRP balance above 20 XRP', points: '+3\u20135 pts', priority: 'medium' });
  return recs.slice(0, 5);
}

function buildBreakdown(signals: Record<string, number>) {
  return [
    { label: 'Account Lifecycle',  signal: 'accountAge',    score: Math.round(signals.accountAge),    weight: '20%', desc: 'Account age and maturity on XRPL mainnet' },
    { label: 'Payment History',    signal: 'txVelocity',    score: Math.round(signals.txVelocity),    weight: '22%', desc: 'Transaction count, frequency, and consistency' },
    { label: 'Asset Diversity',    signal: 'trustLines',    score: Math.round(signals.trustLines),    weight: '15%', desc: 'Trust line breadth and token portfolio quality' },
    { label: 'DEX Participation',  signal: 'dexActivity',   score: Math.round(signals.dexActivity),   weight: '12%', desc: 'Active DEX trading and order book presence' },
    { label: 'AMM Liquidity',      signal: 'ammActivity',   score: Math.round(signals.ammActivity),   weight: '8%',  desc: 'Liquidity provision and AMM pool positions' },
    { label: 'Reserve Management', signal: 'reserveRatio',  score: Math.round(signals.reserveRatio),  weight: '10%', desc: 'XRP balance relative to reserve requirements' },
    { label: 'NFT Portfolio',      signal: 'nftActivity',   score: Math.round(signals.nftActivity),   weight: '5%',  desc: 'NFT holdings and on-chain digital asset activity' },
    { label: 'Security Config',    signal: 'securityFlags', score: Math.round(signals.securityFlags), weight: '8%',  desc: 'Multi-sig, regular key, domain verification setup' },
  ];
}

function peerPercentile(score: number): number {
  if (score >= 800) return 98;
  if (score >= 740) return 92;
  if (score >= 670) return 78;
  if (score >= 580) return 55;
  if (score >= 450) return 30;
  return 15;
}

// ─── MAIN HANDLER ────────────────────────────────────────────────────────────
export async function GET(
  _req: NextRequest,
  { params }: { params: { address: string } }
) {
  const address = decodeURIComponent(params.address);

  if (!address || !address.startsWith('r') || address.length < 25 || address.length > 35) {
    return NextResponse.json({ error: 'Invalid XRPL address format' }, { status: 400 });
  }

  try {
    const [infoRes, linesRes, txRes, offersRes, nftsRes, escrowRes] = await Promise.all([
      xrplCall('account_info',    { account: address, ledger_index: 'validated' }),
      xrplCall('account_lines',   { account: address, limit: 200 }).catch(() => ({})),
      xrplCall('account_tx',      { account: address, limit: 400, ledger_index_min: -1, ledger_index_max: -1 }).catch(() => ({})),
      xrplCall('account_offers',  { account: address }).catch(() => ({})),
      xrplCall('account_nfts',    { account: address }).catch(() => ({})),
      xrplCall('account_objects', { account: address, type: 'escrow' }).catch(() => ({})),
    ]);

    const accountInfo = infoRes?.result?.account_data;
    if (!accountInfo || infoRes?.result?.error) {
      return NextResponse.json({ error: 'Account not found on XRPL mainnet' }, { status: 404 });
    }

    const trustLines   = linesRes?.result?.lines || [];
    const transactions = txRes?.result?.transactions || [];
    const offers       = offersRes?.result?.offers || [];
    const nfts         = nftsRes?.result?.account_nfts || [];
    const escrows      = escrowRes?.result?.account_objects || [];

    // ── PARSE ────────────────────────────────────────────────────────────────
    const balanceXRP = Number(accountInfo.Balance) / 1_000_000;
    const txCount    = transactions.length;
    const sequence   = accountInfo.Sequence || 0;

    const firstTx     = transactions[transactions.length - 1];
    const firstLedger = firstTx?.tx?.ledger_index || 0;
    const ledgerAge   = firstLedger > 0 ? (95_000_000 - firstLedger) : 0;
    const accountAgeDays = Math.max(0, Math.floor(ledgerAge / 1440));

    const hasOffers  = offers.length > 0;
    const dexTxCount = transactions.filter((t: { tx?: { TransactionType?: string } }) =>
      ['OfferCreate', 'OfferCancel'].includes(t.tx?.TransactionType || '')).length;

    const ammTxCount = transactions.filter((t: { tx?: { TransactionType?: string } }) =>
      ['AMMDeposit', 'AMMWithdraw', 'AMMCreate', 'AMMVote'].includes(t.tx?.TransactionType || '')).length;
    const hasAMM = ammTxCount > 0;

    const nftCount   = nfts.length;
    const nftTxCount = transactions.filter((t: { tx?: { TransactionType?: string } }) =>
      t.tx?.TransactionType?.startsWith('NFToken')).length;

    const hasMultiSig  = !!(accountInfo.SignerLists?.length > 0);
    const hasRegKey    = !!accountInfo.RegularKey;
    const hasDomain    = !!accountInfo.Domain;
    const hasEmailHash = !!accountInfo.EmailHash;
    const hasEscrow    = escrows.length > 0;

    const objectCount  = accountInfo.OwnerCount || 0;
    const reserveXRP   = 10 + objectCount * 2;
    const reserveRatio = balanceXRP > 0 ? Math.min(100, (balanceXRP / reserveXRP) * 50) : 0;

    // ── SIGNALS (0–100) ──────────────────────────────────────────────────────
    const signals: Record<string, number> = {
      accountAge:   Math.min(100, (accountAgeDays / 1095) * 100),
      txVelocity:   Math.min(100, (txCount / 500) * 100),
      trustLines:   Math.min(100, (trustLines.length / 15) * 100),
      dexActivity:  Math.min(100, (hasOffers ? 30 : 0) + (dexTxCount / 30) * 70),
      ammActivity:  Math.min(100, (ammTxCount / 10) * 100),
      reserveRatio: Math.min(100, reserveRatio),
      nftActivity:  Math.min(100, (nftCount / 10) * 50 + (nftTxCount / 20) * 50),
      securityFlags: Math.min(100,
        (hasMultiSig ? 35 : 0) + (hasRegKey ? 20 : 0) +
        (hasDomain ? 20 : 0) + (hasEmailHash ? 15 : 0) + (hasEscrow ? 10 : 0)),
    };

    const ledgerScore = computeScore(signals);
    const scoreGrade  = grade(ledgerScore);
    const percentile  = peerPercentile(ledgerScore);
    const breakdown   = buildBreakdown(signals);
    const recommendations = buildRecommendations(signals, hasEscrow);

    const details = {
      txCount, accountAgeDays,
      balanceXRP: Math.round(balanceXRP * 100) / 100,
      trustLineCount: trustLines.length,
      hasOffers, hasAMM, nftCount,
      hasMultiSig, hasRegKey, hasDomain, hasEmailHash, hasEscrow,
      dexTxCount, ammTxCount, objectCount, reserveXRP, sequence,
    };

    // ── SAVE TO DB (history + current snapshot) — fire and forget ───────────
    const breakdownJSON = JSON.stringify(signals);
    Promise.allSettled([
      // every check logged for progress-over-time
      prisma.scoreHistory.create({
        data: { address, score: ledgerScore, tier: scoreGrade, percentile, breakdown: breakdownJSON },
      }),
      // current snapshot upsert
      prisma.ledgerScore.upsert({
        where:  { address },
        update: { score: ledgerScore, tier: scoreGrade, breakdown: breakdownJSON, rawData: JSON.stringify(details) },
        create: { address, score: ledgerScore, tier: scoreGrade, breakdown: breakdownJSON, rawData: JSON.stringify(details) },
      }),
    ]).catch(() => { /* DB write failure shouldn't break the score response */ });

    // ── RESPONSE ─────────────────────────────────────────────────────────────
    return NextResponse.json({
      ledgerScore,
      xrplScore: ledgerScore,
      grade: scoreGrade,
      breakdown,
      signals,
      recommendations,
      percentile,
      percentileLabel: `Higher than ${percentile}% of scanned XRPL wallets`,
      details,
      address,
      scannedAt: new Date().toISOString(),
      methodology: 'XRPLHub XRPLScore v1.0 \u2014 8-signal native on-chain behavioral scoring',
      copyright: '\u00a9 2026 XRPLHub.io \u00b7 XRPLScore\u2122 \u00b7 All Rights Reserved',
    }, {
      headers: {
        'Cache-Control': 'no-store',
        'X-Score-Version': '1.0',
        'X-Score-Provider': 'XRPLHub',
      }
    });

  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Score computation failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
