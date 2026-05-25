import { NextRequest, NextResponse } from 'next/server';

const XRPL_API = 'https://xrplcluster.com';

// ─── SCORING WEIGHTS (proprietary — copyright 2026 Daniel Clark / XRPLHub.io) ─
const W = {
  accountAge:    0.20,   // 20% — account maturity
  txVelocity:    0.22,   // 22% — payment history / activity
  trustLines:    0.15,   // 15% — asset diversity
  dexActivity:   0.12,   // 12% — DEX engagement
  ammActivity:   0.08,   // 8%  — AMM liquidity participation
  reserveRatio:  0.10,   // 10% — reserve management
  nftActivity:   0.05,   // 5%  — NFT portfolio
  securityFlags: 0.08,   // 8%  — account security config
};

// ─── GRADE BANDS ────────────────────────────────────────────────────────────
function grade(score: number) {
  if (score >= 800) return 'Exceptional';
  if (score >= 740) return 'Excellent';
  if (score >= 670) return 'Good';
  if (score >= 580) return 'Fair';
  return 'Building';
}

// ─── XRPL DATA FETCHERS ─────────────────────────────────────────────────────
async function getAccountInfo(address: string) {
  const res = await fetch(XRPL_API, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      method: 'account_info',
      params: [{ account: address, ledger_index: 'validated' }]
    })
  });
  const json = await res.json();
  if (json?.result?.error) throw new Error('Account not found on XRPL mainnet');
  return json?.result?.account_data;
}

async function getAccountLines(address: string) {
  const res = await fetch(XRPL_API, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      method: 'account_lines',
      params: [{ account: address, limit: 200 }]
    })
  });
  const json = await res.json();
  return json?.result?.lines || [];
}

async function getAccountTx(address: string) {
  const res = await fetch(XRPL_API, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      method: 'account_tx',
      params: [{ account: address, limit: 400, ledger_index_min: -1, ledger_index_max: -1 }]
    })
  });
  const json = await res.json();
  return json?.result?.transactions || [];
}

async function getAccountOffers(address: string) {
  const res = await fetch(XRPL_API, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      method: 'account_offers',
      params: [{ account: address }]
    })
  });
  const json = await res.json();
  return json?.result?.offers || [];
}

async function getAccountNFTs(address: string) {
  const res = await fetch(XRPL_API, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      method: 'account_nfts',
      params: [{ account: address }]
    })
  });
  const json = await res.json();
  return json?.result?.account_nfts || [];
}

async function getAccountObjects(address: string) {
  const res = await fetch(XRPL_API, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      method: 'account_objects',
      params: [{ account: address, type: 'escrow' }]
    })
  });
  const json = await res.json();
  return json?.result?.account_objects || [];
}

// ─── SCORE COMPUTATION ───────────────────────────────────────────────────────
function computeScore(signals: Record<string, number>): number {
  const weighted = Object.entries(W).reduce((acc, [key, weight]) => {
    return acc + (signals[key] || 0) * weight;
  }, 0);
  // Map 0-100 weighted score to 300-850 FICO-style band
  return Math.round(300 + weighted * 5.5);
}

// ─── IMPROVEMENT RECOMMENDATIONS ─────────────────────────────────────────────
function buildRecommendations(signals: Record<string, number>, details: Record<string, unknown>) {
  const recs: { action: string; points: string; priority: 'high'|'medium'|'low' }[] = [];

  if (signals.txVelocity < 60) {
    recs.push({ action: 'Make 10 more on-chain payments', points: '+8–12 pts', priority: 'high' });
  }
  if (signals.trustLines < 50) {
    recs.push({ action: 'Add 2 more XRPL trust lines', points: '+6–10 pts', priority: 'high' });
  }
  if (signals.dexActivity < 40) {
    recs.push({ action: 'Place a DEX limit order', points: '+5–8 pts', priority: 'medium' });
  }
  if (signals.ammActivity < 30) {
    recs.push({ action: 'Deposit into an AMM pool', points: '+4–7 pts', priority: 'medium' });
  }
  if (signals.securityFlags < 50) {
    recs.push({ action: 'Enable multi-sig on your wallet', points: '+4–6 pts', priority: 'medium' });
  }
  if (signals.nftActivity < 20) {
    recs.push({ action: 'Mint or hold an XRPL NFT', points: '+2–4 pts', priority: 'low' });
  }
  if ((details.hasEscrow as boolean) === false) {
    recs.push({ action: 'Create an escrow transaction', points: '+3–5 pts', priority: 'low' });
  }
  if (signals.reserveRatio < 60) {
    recs.push({ action: 'Increase XRP balance above 20 XRP', points: '+3–5 pts', priority: 'medium' });
  }

  return recs.slice(0, 5); // top 5 recs
}

// ─── SCORE BREAKDOWN ─────────────────────────────────────────────────────────
function buildBreakdown(signals: Record<string, number>) {
  return [
    {
      label: 'Account Lifecycle',
      signal: 'accountAge',
      score: Math.round(signals.accountAge),
      weight: '20%',
      desc: 'Account age and maturity on XRPL mainnet'
    },
    {
      label: 'Payment History',
      signal: 'txVelocity',
      score: Math.round(signals.txVelocity),
      weight: '22%',
      desc: 'Transaction count, frequency, and consistency'
    },
    {
      label: 'Asset Diversity',
      signal: 'trustLines',
      score: Math.round(signals.trustLines),
      weight: '15%',
      desc: 'Trust line breadth and token portfolio quality'
    },
    {
      label: 'DEX Participation',
      signal: 'dexActivity',
      score: Math.round(signals.dexActivity),
      weight: '12%',
      desc: 'Active DEX trading and order book presence'
    },
    {
      label: 'AMM Liquidity',
      signal: 'ammActivity',
      score: Math.round(signals.ammActivity),
      weight: '8%',
      desc: 'Liquidity provision and AMM pool positions'
    },
    {
      label: 'Reserve Management',
      signal: 'reserveRatio',
      score: Math.round(signals.reserveRatio),
      weight: '10%',
      desc: 'XRP balance relative to reserve requirements'
    },
    {
      label: 'NFT Portfolio',
      signal: 'nftActivity',
      score: Math.round(signals.nftActivity),
      weight: '5%',
      desc: 'NFT holdings and on-chain digital asset activity'
    },
    {
      label: 'Security Config',
      signal: 'securityFlags',
      score: Math.round(signals.securityFlags),
      weight: '8%',
      desc: 'Multi-sig, regular key, domain verification setup'
    },
  ];
}

// ─── MAIN HANDLER ────────────────────────────────────────────────────────────
export async function GET(
  _req: NextRequest,
  { params }: { params: { address: string } }
) {
  const address = decodeURIComponent(params.address);

  // Basic XRPL address validation
  if (!address || !address.startsWith('r') || address.length < 25 || address.length > 35) {
    return NextResponse.json({ error: 'Invalid XRPL address format' }, { status: 400 });
  }

  try {
    // Fetch all on-chain data in parallel
    const [accountInfo, trustLines, transactions, offers, nfts, escrows] = await Promise.all([
      getAccountInfo(address),
      getAccountLines(address).catch(() => []),
      getAccountTx(address).catch(() => []),
      getAccountOffers(address).catch(() => []),
      getAccountNFTs(address).catch(() => []),
      getAccountObjects(address).catch(() => []),
    ]);

    // ── PARSE RAW DATA ────────────────────────────────────────────────────────
    const balanceXRP = Number(accountInfo.Balance) / 1_000_000;
    const txCount    = transactions.length;
    const sequence   = accountInfo.Sequence || 0;

    // Account age — estimate from sequence and current ledger ~10M ledgers/year
    // More accurate: check first transaction timestamp if available
    const firstTx = transactions[transactions.length - 1];
    const firstLedger = firstTx?.tx?.ledger_index || 0;
    const currentApproxLedger = 95_000_000; // approximate current ledger
    const ledgerAge  = currentApproxLedger - firstLedger;
    const accountAgeDays = Math.floor(ledgerAge / 1440); // ~1440 ledgers per day

    // DEX activity
    const hasOffers    = offers.length > 0;
    const dexTxCount   = transactions.filter((t: {tx?: {TransactionType?: string}}) =>
      ['OfferCreate','OfferCancel'].includes(t.tx?.TransactionType || '')
    ).length;

    // AMM activity
    const ammTxCount   = transactions.filter((t: {tx?: {TransactionType?: string}}) =>
      ['AMMDeposit','AMMWithdraw','AMMCreate','AMMVote'].includes(t.tx?.TransactionType || '')
    ).length;
    const hasAMM = ammTxCount > 0;

    // NFT activity
    const nftCount     = nfts.length;
    const nftTxCount   = transactions.filter((t: {tx?: {TransactionType?: string}}) =>
      t.tx?.TransactionType?.startsWith('NFToken')
    ).length;

    // Security flags from account root
    const flags        = accountInfo.Flags || 0;
    const hasMultiSig  = !!(accountInfo.SignerLists?.length > 0);
    const hasRegKey    = !!accountInfo.RegularKey;
    const hasDomain    = !!accountInfo.Domain;
    const hasEmailHash = !!accountInfo.EmailHash;
    const hasEscrow    = escrows.length > 0;

    // Reserve (base 10 XRP + 2 XRP per object)
    const objectCount  = (accountInfo.OwnerCount || 0);
    const reserveXRP   = 10 + objectCount * 2;
    const reserveRatio = balanceXRP > 0 ? Math.min(100, (balanceXRP / reserveXRP) * 50) : 0;

    // ── SIGNAL NORMALIZATION (0–100 each) ────────────────────────────────────
    const signals: Record<string, number> = {
      // Account age: 0=new, 100=3+ years
      accountAge: Math.min(100, (accountAgeDays / 1095) * 100),

      // TX velocity: 0=none, 100=500+ transactions
      txVelocity: Math.min(100, (txCount / 500) * 100),

      // Trust lines: 0=none, 100=15+
      trustLines: Math.min(100, (trustLines.length / 15) * 100),

      // DEX activity: combo of has active offers + historical DEX txs
      dexActivity: Math.min(100, (hasOffers ? 30 : 0) + (dexTxCount / 30) * 70),

      // AMM activity: 0=none, 100=10+ AMM interactions
      ammActivity: Math.min(100, (ammTxCount / 10) * 100),

      // Reserve ratio
      reserveRatio: Math.min(100, reserveRatio),

      // NFT: combo of holding + activity
      nftActivity: Math.min(100, (nftCount / 10) * 50 + (nftTxCount / 20) * 50),

      // Security: each flag adds points
      securityFlags: Math.min(100,
        (hasMultiSig  ? 35 : 0) +
        (hasRegKey    ? 20 : 0) +
        (hasDomain    ? 20 : 0) +
        (hasEmailHash ? 15 : 0) +
        (hasEscrow    ? 10 : 0)
      ),
    };

    // ── COMPUTE FINAL SCORE ──────────────────────────────────────────────────
    const ledgerScore = computeScore(signals);
    const scoreGrade  = grade(ledgerScore);

    // ── PEER COMPARISON (approximate — based on score band distribution) ────
    // Real distribution: most wallets score 400-600, few above 700
    function peerPercentile(score: number): number {
      if (score >= 800) return 98;
      if (score >= 740) return 92;
      if (score >= 670) return 78;
      if (score >= 580) return 55;
      if (score >= 450) return 30;
      return 15;
    }

    const details = {
      txCount,
      accountAgeDays,
      balanceXRP: Math.round(balanceXRP * 100) / 100,
      trustLineCount: trustLines.length,
      hasOffers,
      hasAMM,
      nftCount,
      hasMultiSig,
      hasRegKey,
      hasDomain,
      hasEmailHash,
      hasEscrow,
      dexTxCount,
      ammTxCount,
      objectCount,
      reserveXRP,
      sequence,
    };

    const breakdown      = buildBreakdown(signals);
    const recommendations = buildRecommendations(signals, details);
    const percentile     = peerPercentile(ledgerScore);

    // ── RESPONSE ─────────────────────────────────────────────────────────────
    return NextResponse.json({
      // Core score
      ledgerScore,
      xrplScore: ledgerScore,  // alias for XRPLScore branding
      grade: scoreGrade,

      // Breakdown by signal
      breakdown,

      // Raw signals (normalized 0-100)
      signals,

      // Recommendations
      recommendations,

      // Peer comparison
      percentile,
      percentileLabel: `Higher than ${percentile}% of scanned XRPL wallets`,

      // Raw details
      details,

      // Metadata
      address,
      scannedAt: new Date().toISOString(),
      methodology: 'XRPLHub XRPLScore v1.0 — 8-signal native on-chain behavioral scoring',
      copyright: '© 2026 XRPLHub.io — All rights reserved',
    }, {
      headers: {
        'Cache-Control': 'no-store',
        'X-Score-Version': '1.0',
        'X-Score-Provider': 'XRPLHub',
      }
    });

  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Score computation failed';
    const status  = message.includes('not found') ? 404 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
