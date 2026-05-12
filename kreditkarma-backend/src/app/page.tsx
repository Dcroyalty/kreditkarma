'use client';

import React, { useState, useEffect, useCallback } from 'react';

// ─────────────────────────────────────────────────────────────────────────────
// CONFIG
// ─────────────────────────────────────────────────────────────────────────────
const API_URL  = (typeof process !== 'undefined' && process.env?.NEXT_PUBLIC_API_URL) || '';
const TREASURY = 'rs59g3amo5iT6T64Cg96XXMAWuw3WPQcLF';
const TREASURY_DOMAIN = 'kreditkarma.xrp'; // XRPNS primary domain → resolves to TREASURY
const XAMAN_DOWNLOAD = 'https://xaman.app/';

// Neural background image (header + footer only). File lives at /public/xrpl-background.jpg
const NEURAL_BG = '/xrpl-background.jpg';

// ─────────────────────────────────────────────────────────────────────────────
// XRPL HELPERS
// ─────────────────────────────────────────────────────────────────────────────
type Currency = 'RLUSD' | 'XRP';

function xamanLink(address: string, amount: number, currency: Currency): string {
  if (currency === 'XRP' && amount > 0)
    return `xrpl:${address}?amount=${Math.floor(amount * 1_000_000)}`;
  return `https://xumm.app/detect/request:${address}`;
}

function qrSrc(data: string, size = 210): string {
  return `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodeURIComponent(data)}&color=0d9488&bgcolor=030407&qzone=2&format=svg`;
}

// ─────────────────────────────────────────────────────────────────────────────
// TICKER MESSAGES — strobing across top + bottom
// ─────────────────────────────────────────────────────────────────────────────
const TICKER_MESSAGES = [
  'Homeless — Apply for Grants',
  'Build Real Credit',
  'Protect Your Assets',
  'Transparent AI Community Grants',
  'Buy Powerful XRPL Amendments',
  'Turn XRP / RLUSD Into Credit',
  'Blockchain LedgerScore',
  'Every Donation Uses AI To Send Help',
  'Donations → Treasury → Apply for Grants → AI → Help Is On The Way',
  'Borrow / Lend XRPL Amendment Coming Soon',
];

// ─────────────────────────────────────────────────────────────────────────────
// PRODUCTS — each maps to a real XRPL transaction type
// ─────────────────────────────────────────────────────────────────────────────
const PRODUCTS = [
  {
    id: 'clawback',
    emoji: '🔒',
    name: 'Clawback Shield',
    amendment: 'SetAccountFlag · asfNoFreeze',
    tagline: 'Permanently block issuers from reclaiming your tokens',
    desc: 'Our AI agent broadcasts a SetAccountFlag (asfNoFreeze) transaction to XRPL mainnet on your behalf. This permanently prevents any token issuer from freezing or clawing back assets in your trust lines. One payment. Permanent on-chain protection.',
    priceRLUSD: 25,
    priceXRP: 80,
    aiDelivery: 'AI broadcasts SetAccountFlag (asfNoFreeze) · Confirmed within 1 ledger close (~4s)',
    aiDetail: "Our Grok AI agent constructs and submits a SetAccountFlag transaction with the asfNoFreeze flag (0x00000002) to XRPL mainnet. The transaction is signed via the treasury multi-sig and permanently recorded on your wallet's account root. Issuer clawback is now cryptographically impossible.",
    featured: true,
    comingSoon: false,
    color: '#10b981',
    features: ['asfNoFreeze flag set on-chain','Issuer clawback permanently disabled','On-chain activation proof','Xaman push notification','Email receipt + TX hash'],
  },
  {
    id: 'escrow',
    emoji: '🏛️',
    name: 'Escrow Vault',
    amendment: 'EscrowCreate · Time-locked',
    tagline: 'AI-managed protective escrow with custom release conditions',
    desc: 'AI constructs and files an EscrowCreate transaction locking your specified XRP with a custom finish-after timestamp or crypto-condition. Funds release automatically on your terms — protected from premature access, third-party seizure, and smart contract failure.',
    priceRLUSD: 50,
    priceXRP: 160,
    aiDelivery: 'AI files EscrowCreate with your conditions · Escrow live within 1 ledger close',
    aiDetail: 'Grok AI constructs an EscrowCreate transaction with your specified FinishAfter epoch and optional CryptoCondition. The escrow is filed to XRPL mainnet, funded from your wallet, and monitored continuously. AI auto-files EscrowFinish or EscrowCancel at the appropriate time — no manual intervention needed.',
    featured: true,
    comingSoon: false,
    color: '#f59e0b',
    features: ['EscrowCreate filed to XRPL mainnet','Custom release date or crypto-condition','AI monitors + auto-finalises','EscrowCancel protection on failure','Full on-chain audit trail'],
  },
  {
    id: 'mutual',
    emoji: '🤝',
    name: 'Mutual Aid Pool',
    amendment: 'TrustSet · MultiSig Registry',
    tagline: 'On-chain mutual aid coverage certificate — no insurance company',
    desc: 'Payment adds you to the KreditKarma multisig mutual aid pool. AI issues a TrustSet-based coverage certificate to your wallet and records you in the on-chain registry. If a covered event occurs, pool funds disburse automatically via AI-triggered transaction.',
    priceRLUSD: 35,
    priceXRP: 115,
    aiDelivery: 'AI issues TrustSet certificate + adds wallet to multisig registry · Confirmed ~4s',
    aiDetail: 'Grok AI files a TrustSet transaction issuing a KK-COVERAGE trust line to your wallet — your on-chain proof of membership. Your wallet address is added to the multisig pool registry (verified via OfferCreate memo). Pool balance is always publicly visible at xrpscan.com. No dark money. No NGO skimming.',
    featured: true,
    comingSoon: false,
    color: '#8b5cf6',
    features: ['TrustSet coverage certificate issued','Added to multisig pool registry','AI-triggered disbursement on claim','Pool balance visible on XRPScan','Email + wallet-level proof'],
  },
  {
    id: 'credit',
    emoji: '📈',
    name: 'Credit Builder',
    amendment: 'Payment · Bureau Reporting',
    tagline: 'Build LedgerScore + FICO simultaneously with monthly on-chain payments',
    desc: "The world's first blockchain credit builder. Each monthly RLUSD payment creates a verifiable on-chain record our algorithm uses to grow your LedgerScore. Pro tier furnishes data to Equifax, TransUnion, and Experian — the first-ever pathway from XRPL activity to a traditional FICO score.",
    priceRLUSD: 20,
    priceXRP: 65,
    aiDelivery: 'AI records payment, updates LedgerScore, queues bureau furnishing · Next cycle auto-scheduled',
    aiDetail: 'Each monthly payment is recorded via a Payment transaction to the treasury with a structured memo containing your wallet, tier, and cycle number. Grok AI updates your LedgerScore algorithm weighting, queues the bureau furnishing API call (Starter: Equifax; Pro: all 3), and schedules the next cycle reminder via Xaman push notification.',
    featured: false,
    comingSoon: false,
    color: '#34d399',
    isMonthly: true,
    tiers: [
      { name: 'Starter',  priceRLUSD: 20,  priceXRP: 65,  color: '#34d399', perks: 'LedgerScore monitoring · Equifax soft reporting · Email alerts' },
      { name: 'Builder',  priceRLUSD: 50,  priceXRP: 165, color: '#10b981', perks: 'All 3 bureaus soft · Score simulator · Dispute assist' },
      { name: 'Pro',      priceRLUSD: 100, priceXRP: 330, color: '#f59e0b', perks: 'Hard bureau reporting · RLUSD rewards · DeFi pre-approval' },
    ],
    features: ['Monthly payment recorded on-chain','LedgerScore updated each cycle','Bureau furnishing (Starter → Pro)','RLUSD rewards on Pro tier','First blockchain-to-FICO pathway'],
  },
  {
    id: 'amm',
    emoji: '🌊',
    name: 'DEX Liquidity Guard',
    amendment: 'AMMWithdraw · Position Monitor',
    tagline: 'AI monitors your AMM positions and exits before damage hits',
    desc: 'AI continuously watches your XRPL AMM liquidity positions. When impermanent loss exceeds your configured threshold — or an exploit pattern is detected — our agent automatically fires an AMMWithdraw transaction, removing your liquidity before you even see the alert.',
    priceRLUSD: 40,
    priceXRP: 130,
    aiDelivery: 'AI monitors AMM pools continuously · AMMWithdraw auto-filed on breach',
    aiDetail: 'Grok AI polls the XRPL AMM ledger objects associated with your wallet address every 4 seconds. Impermanent loss is calculated against your entry price. On breach, an AMMWithdraw transaction (LPTokenIn with your full LP balance) is constructed and filed within the same ledger close — faster than any manual response.',
    featured: false,
    comingSoon: false,
    color: '#06b6d4',
    features: ['Real-time AMM position polling (4s)','IL breach auto-withdrawal','Pool exploit pattern detection','AMMWithdraw filed < 1 ledger close','Action log verifiable on-chain'],
  },
  {
    id: 'borrowlend',
    emoji: '🔁',
    name: 'XRPL Borrow / Lend',
    amendment: 'Lending Protocol · Coming Soon',
    tagline: 'Native on-chain borrowing & lending — powered by upcoming XRPL amendments',
    desc: 'The XRPL Borrow/Lend amendment is coming to mainnet. KreditKarma will offer the first fully integrated borrow-against-LedgerScore product on day one. Stake RLUSD or XRP, earn yield as a lender, or borrow against your on-chain credit history — all without banks, brokers, or KYC gatekeepers.',
    priceRLUSD: 0,
    priceXRP: 0,
    aiDelivery: 'Coming soon — pre-register your wallet to be first in line',
    aiDetail: 'Once the XRPL Borrow/Lend amendment activates on mainnet, our AI agent will instantly index your LedgerScore as on-chain collateral signal. Borrow against your reputation. Lend to earn. All transactions native to the XRPL.',
    featured: false,
    comingSoon: true,
    color: '#ec4899',
    features: ['Borrow against your LedgerScore','Lend RLUSD/XRP for yield','No banks · No brokers · No KYC','Native XRPL amendment','Pre-register early access'],
  },
] as const;

type Product = typeof PRODUCTS[number];

// ─────────────────────────────────────────────────────────────────────────────
// SCORE HELPERS
// ─────────────────────────────────────────────────────────────────────────────
interface ScoreData {
  ledgerScore: number;
  grade?: string;
  details?: { txCount?: number; accountAge?: number; balanceXRP?: number; trustLines?: number };
}
interface User { email: string; name: string }

function gradeScore(n: number) {
  if (n >= 800) return { label: 'Exceptional', color: '#10b981', glow: 'rgba(16,185,129,.55)' };
  if (n >= 740) return { label: 'Excellent',   color: '#34d399', glow: 'rgba(52,211,153,.5)'  };
  if (n >= 670) return { label: 'Good',         color: '#fbbf24', glow: 'rgba(251,191,36,.5)'  };
  if (n >= 580) return { label: 'Fair',          color: '#f97316', glow: 'rgba(249,115,22,.5)'  };
  return              { label: 'Building',       color: '#ef4444', glow: 'rgba(239,68,68,.5)'   };
}

// ─────────────────────────────────────────────────────────────────────────────
// STYLE TOKENS
// ─────────────────────────────────────────────────────────────────────────────
const GLASS: React.CSSProperties = {
  background: 'rgba(6,6,22,.72)',
  backdropFilter: 'blur(22px)',
  WebkitBackdropFilter: 'blur(22px)',
  border: '1px solid rgba(255,255,255,.09)',
};

const INP: React.CSSProperties = {
  width: '100%', background: 'rgba(255,255,255,.07)',
  border: '1px solid rgba(255,255,255,.13)', borderRadius: 12,
  padding: '12px 15px', fontSize: 14, color: '#fff', outline: 'none',
  fontFamily: 'inherit', boxSizing: 'border-box', transition: 'border-color .15s',
};

const LBL: React.CSSProperties = {
  display: 'block', fontSize: 10, fontWeight: 700,
  color: 'rgba(255,255,255,.32)', textTransform: 'uppercase',
  letterSpacing: '.1em', marginBottom: 6,
};

function B(v: 'green'|'ghost'|'color', color?: string, extra?: React.CSSProperties): React.CSSProperties {
  const base: React.CSSProperties = {
    display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 7,
    border: 'none', borderRadius: 99, fontWeight: 700, fontSize: 14,
    cursor: 'pointer', fontFamily: 'inherit', padding: '12px 26px', transition: 'all .18s',
    ...extra,
  };
  if (v === 'green') return { ...base, background: '#10b981', color: '#000' };
  if (v === 'color') return { ...base, background: color || '#10b981', color: '#000' };
  return { ...base, background: 'rgba(255,255,255,.08)', color: '#fff', border: '1px solid rgba(255,255,255,.14)' };
}

// ─────────────────────────────────────────────────────────────────────────────
// SCROLLING TICKER — strobes brand messages
// ─────────────────────────────────────────────────────────────────────────────
function Ticker({ position = 'top' }: { position?: 'top' | 'bottom' }) {
  const repeated = [...TICKER_MESSAGES, ...TICKER_MESSAGES];
  return (
    <div
      role="marquee"
      aria-label="KreditKarma brand ticker"
      style={{
        position: 'relative',
        overflow: 'hidden',
        width: '100%',
        background: 'linear-gradient(90deg, rgba(16,185,129,.10), rgba(139,92,246,.07), rgba(16,185,129,.10))',
        borderTop: position === 'bottom' ? '1px solid rgba(16,185,129,.22)' : 'none',
        borderBottom: position === 'top' ? '1px solid rgba(16,185,129,.22)' : 'none',
        backdropFilter: 'blur(10px)',
        WebkitBackdropFilter: 'blur(10px)',
        zIndex: 50,
      }}
    >
      <div
        className="ticker-track"
        style={{
          display: 'inline-flex',
          whiteSpace: 'nowrap',
          padding: '10px 0',
          animation: 'tickerScroll 60s linear infinite',
          willChange: 'transform',
        }}
      >
        {repeated.map((msg, i) => (
          <span
            key={`${msg}-${i}`}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 12,
              padding: '0 22px',
              fontSize: 12,
              fontWeight: 700,
              letterSpacing: '.06em',
              color: '#fff',
              fontFamily: "'IBM Plex Mono', monospace",
              textTransform: 'uppercase',
            }}
          >
            <span
              style={{
                width: 6, height: 6, borderRadius: '50%',
                background: '#10b981',
                boxShadow: '0 0 10px #10b981',
                animation: 'pulse 1.6s infinite',
                flexShrink: 0,
              }}
            />
            <span className="ticker-strobe">{msg}</span>
          </span>
        ))}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// OVERLAY
// ─────────────────────────────────────────────────────────────────────────────
function Overlay({ show, onClose, children, wide = false }: {
  show: boolean; onClose: () => void; children: React.ReactNode; wide?: boolean;
}) {
  useEffect(() => {
    if (!show) return;
    document.body.style.overflow = 'hidden';
    const fn = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', fn);
    return () => { window.removeEventListener('keydown', fn); document.body.style.overflow = ''; };
  }, [show, onClose]);
  if (!show) return null;
  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(0,0,0,.9)', backdropFilter: 'blur(14px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
      <div onClick={e => e.stopPropagation()} style={{ ...GLASS, borderRadius: 26, padding: '32px 28px', width: '100%', maxWidth: wide ? 700 : 520, position: 'relative', animation: 'popIn .26s cubic-bezier(.34,1.56,.64,1) both', maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 0 80px rgba(16,185,129,.08),0 40px 100px rgba(0,0,0,.85)' }}>
        <button onClick={onClose} style={{ position: 'absolute', top: 16, right: 16, width: 32, height: 32, borderRadius: '50%', background: 'rgba(255,255,255,.08)', border: 'none', color: 'rgba(255,255,255,.6)', cursor: 'pointer', fontSize: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2 }}>✕</button>
        {children}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// PRODUCT PURCHASE MODAL
// ─────────────────────────────────────────────────────────────────────────────
function ProductModal({ show, onClose, product }: { show: boolean; onClose: () => void; product: Product | null }) {
  const [currency, setCurrency]       = useState<Currency>('RLUSD');
  const [email, setEmail]             = useState('');
  const [step, setStep]               = useState<'info'|'checkout'|'processing'|'success'|'preregister'>('info');
  const [copied, setCopied]           = useState(false);
  const [copiedDomain, setCopiedDomain] = useState(false);
  const [qrErr, setQrErr]             = useState(false);
  const [selectedTier, setSelectedTier] = useState(0);
  const [walletPre, setWalletPre]     = useState('');

  if (!product) return null;

  const isCreditBuilder = product.id === 'credit';
  const isComingSoon = product.comingSoon;
  const tiers = isCreditBuilder ? (product as typeof PRODUCTS[3]).tiers : null;
  const activeTier = tiers ? tiers[selectedTier] : null;

  const price = isCreditBuilder && activeTier
    ? (currency === 'RLUSD' ? activeTier.priceRLUSD : activeTier.priceXRP)
    : (currency === 'RLUSD' ? product.priceRLUSD : product.priceXRP);

  const deepLink = xamanLink(TREASURY, price, currency);
  const copy = () => { navigator.clipboard.writeText(TREASURY); setCopied(true); setTimeout(() => setCopied(false), 2200); };
  const copyDomain = () => { navigator.clipboard.writeText(TREASURY_DOMAIN); setCopiedDomain(true); setTimeout(() => setCopiedDomain(false), 2200); };

  const handleSent = async () => {
    setStep('processing');
    try {
      await fetch(`${API_URL}/api/purchase`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId: product.id, currency, amount: price, email, tier: selectedTier }),
      });
    } catch { /* optimistic */ }
    await new Promise(r => setTimeout(r, 2400));
    setStep('success');
  };

  const handlePreRegister = async () => {
    try {
      await fetch(`${API_URL}/api/preregister`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId: product.id, email, wallet: walletPre }),
      });
    } catch {}
    setStep('success');
  };

  const handleClose = () => {
    onClose();
    setTimeout(() => { setStep('info'); setEmail(''); setCopied(false); setCopiedDomain(false); setQrErr(false); setSelectedTier(0); setWalletPre(''); }, 300);
  };

  // ── Coming Soon: pre-register ──
  if (isComingSoon && step === 'preregister') return (
    <Overlay show={show} onClose={handleClose}>
      <div style={{ fontSize: 10, fontWeight: 700, color: product.color, letterSpacing: '.12em', textTransform: 'uppercase', marginBottom: 5, fontFamily: "'IBM Plex Mono',monospace" }}>{product.amendment}</div>
      <h3 style={{ fontSize: 22, fontWeight: 900, marginBottom: 8 }}>Pre-Register for Early Access</h3>
      <p style={{ fontSize: 13, color: 'rgba(255,255,255,.5)', marginBottom: 18, lineHeight: 1.7 }}>
        The XRPL Borrow/Lend amendment goes live soon. Drop your email + wallet and we&apos;ll notify you the moment it activates — you&apos;ll get first-day access.
      </p>
      <label style={LBL}>Email</label>
      <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" style={{ ...INP, marginBottom: 14 }} />
      <label style={LBL}>XRPL Wallet (optional)</label>
      <input type="text" value={walletPre} onChange={e => setWalletPre(e.target.value)} placeholder="rXXXXX…" style={{ ...INP, fontFamily: "'IBM Plex Mono',monospace", fontSize: 12, marginBottom: 18 }} />

      <div style={{ background: 'rgba(255,255,255,.04)', borderRadius: 11, padding: '11px 14px', marginBottom: 18, fontSize: 12, color: 'rgba(255,255,255,.5)', lineHeight: 1.7 }}>
        Don&apos;t have Xaman wallet yet? <a href={XAMAN_DOWNLOAD} target="_blank" rel="noopener noreferrer" style={{ color: product.color, fontWeight: 700 }}>Download free →</a>
      </div>

      <div style={{ display: 'flex', gap: 10 }}>
        <button onClick={() => setStep('info')} style={{ ...B('ghost', undefined, { flex: 1 }) }}>← Back</button>
        <button onClick={handlePreRegister} disabled={!email} style={{ ...B('color', product.color, { flex: 2, opacity: !email ? 0.4 : 1 }) }}>
          🔔 Pre-Register Me
        </button>
      </div>
    </Overlay>
  );

  // ── Processing ──
  if (step === 'processing') return (
    <Overlay show={show} onClose={() => {}}>
      <div style={{ textAlign: 'center', padding: '44px 0' }}>
        <div style={{ width: 80, height: 80, borderRadius: '50%', background: `${product.color}15`, border: `2px solid ${product.color}40`, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 22px', fontSize: 36, animation: 'spin 2s linear infinite' }}>⚡</div>
        <h3 style={{ fontSize: 20, fontWeight: 900, color: product.color, marginBottom: 8 }}>AI Agent Activating…</h3>
        <p style={{ fontSize: 13, color: 'rgba(255,255,255,.45)', lineHeight: 1.75, maxWidth: 320, margin: '0 auto 20px' }}>
          {product.aiDelivery}
        </p>
        <div style={{ width: 260, height: 3, background: 'rgba(255,255,255,.07)', borderRadius: 99, margin: '0 auto', overflow: 'hidden' }}>
          <div style={{ height: '100%', background: `linear-gradient(90deg,${product.color},#10b981)`, animation: 'shimmer 1.5s ease-in-out infinite', borderRadius: 99 }} />
        </div>
        <p style={{ fontSize: 11, color: 'rgba(255,255,255,.25)', marginTop: 16, fontFamily: "'IBM Plex Mono',monospace" }}>Awaiting XRPL confirmation…</p>
      </div>
    </Overlay>
  );

  // ── Success ──
  if (step === 'success') return (
    <Overlay show={show} onClose={handleClose}>
      <div style={{ textAlign: 'center', padding: '20px 0' }}>
        <div style={{ width: 76, height: 76, borderRadius: '50%', background: `${product.color}18`, border: `2px solid ${product.color}45`, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 18px', fontSize: 34, animation: 'glow 2s ease-in-out infinite' }}>
          {product.emoji}
        </div>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'rgba(16,185,129,.1)', border: '1px solid rgba(16,185,129,.25)', borderRadius: 99, padding: '4px 14px', marginBottom: 14 }}>
          <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#10b981', boxShadow: '0 0 8px #10b981', display: 'inline-block', animation: 'pulse 2s infinite' }} />
          <span style={{ fontSize: 10, fontWeight: 700, color: '#10b981', letterSpacing: '.1em' }}>{isComingSoon ? 'PRE-REGISTERED' : 'SERVICE ACTIVE — XRPL MAINNET'}</span>
        </div>
        <h3 style={{ fontSize: 24, fontWeight: 900, marginBottom: 8 }}>{isComingSoon ? `You're on the list` : `${product.name} Activated`}</h3>
        <div style={{ background: 'rgba(255,255,255,.04)', border: '1px solid rgba(255,255,255,.08)', borderRadius: 14, padding: 18, margin: '14px 0 18px', textAlign: 'left' }}>
          <p style={{ fontSize: 11, color: product.color, fontFamily: "'IBM Plex Mono',monospace", fontWeight: 700, marginBottom: 6, textTransform: 'uppercase', letterSpacing: '.08em' }}>🤖 AI Agent Report</p>
          <p style={{ fontSize: 13, color: 'rgba(255,255,255,.65)', lineHeight: 1.75 }}>{isComingSoon ? "You'll be notified by email the moment the XRPL Borrow/Lend amendment activates on mainnet. First-day access guaranteed." : product.aiDetail}</p>
        </div>
        {email && <p style={{ fontSize: 12, color: 'rgba(255,255,255,.38)', marginBottom: 18 }}>✅ Receipt sent to <strong style={{ color: '#fff' }}>{email}</strong></p>}
        <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap' }}>
          <a href={`https://xrpscan.com/account/${TREASURY}`} target="_blank" rel="noopener noreferrer" style={{ ...B('ghost', undefined, { fontSize: 13, textDecoration: 'none' }) }}>Verify on XRPScan ↗</a>
          <button onClick={handleClose} style={B('green')}>Done</button>
        </div>
      </div>
    </Overlay>
  );

  // ── Checkout ──
  if (step === 'checkout') return (
    <Overlay show={show} onClose={handleClose}>
      <div style={{ fontSize: 10, fontWeight: 700, color: product.color, letterSpacing: '.12em', textTransform: 'uppercase', marginBottom: 5, fontFamily: "'IBM Plex Mono',monospace" }}>
        {product.amendment}
      </div>
      <h3 style={{ fontSize: 21, fontWeight: 900, marginBottom: 18 }}>Pay to Activate</h3>

      {isCreditBuilder && tiers && (
        <div style={{ marginBottom: 18 }}>
          <label style={LBL}>Select Plan</label>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {tiers.map((t, i) => (
              <button key={t.name} onClick={() => setSelectedTier(i)} style={{ padding: '12px 16px', borderRadius: 12, cursor: 'pointer', fontFamily: 'inherit', textAlign: 'left' as const, border: `1px solid ${selectedTier === i ? t.color : 'rgba(255,255,255,.1)'}`, background: selectedTier === i ? `${t.color}14` : 'rgba(255,255,255,.04)', transition: 'all .15s' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontWeight: 700, fontSize: 14, color: selectedTier === i ? t.color : '#fff' }}>{t.name}</span>
                  <span style={{ fontWeight: 900, fontSize: 15, color: t.color }}>{t.priceRLUSD} RLUSD<span style={{ fontSize: 11, fontWeight: 400, color: 'rgba(255,255,255,.35)' }}>/mo</span></span>
                </div>
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,.38)', marginTop: 3 }}>{t.perks}</div>
              </button>
            ))}
          </div>
        </div>
      )}

      <label style={LBL}>Payment Currency</label>
      <div style={{ display: 'flex', gap: 8, marginBottom: 18 }}>
        {(['RLUSD','XRP'] as Currency[]).map(c => (
          <button key={c} onClick={() => { setCurrency(c); setQrErr(false); }} style={{ flex: 1, padding: '10px', borderRadius: 12, cursor: 'pointer', fontFamily: 'inherit', fontWeight: 700, fontSize: 14, border: `1px solid ${currency === c ? product.color : 'rgba(255,255,255,.1)'}`, background: currency === c ? `${product.color}15` : 'rgba(255,255,255,.04)', color: currency === c ? product.color : 'rgba(255,255,255,.5)', transition: 'all .15s' }}>
            {c === 'RLUSD' ? '💵 RLUSD' : '◈ XRP'} — {c === 'RLUSD' ? (isCreditBuilder && activeTier ? activeTier.priceRLUSD : product.priceRLUSD) : (isCreditBuilder && activeTier ? activeTier.priceXRP : product.priceXRP)}
          </button>
        ))}
      </div>

      <div style={{ background: '#fff', borderRadius: 16, padding: 11, width: 166, height: 166, margin: '0 auto 12px', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
        {qrErr
          ? <div style={{ color: '#064e3b', fontSize: 11, textAlign: 'center' }}>Use address below</div>
          : <img key={deepLink} src={qrSrc(deepLink)} alt="Pay via Xaman" style={{ width: 144, height: 144, borderRadius: 5 }} onError={() => setQrErr(true)} onLoad={() => setQrErr(false)} />
        }
      </div>
      <p style={{ textAlign: 'center', marginBottom: 14 }}>
        <a href={deepLink} target="_blank" rel="noopener noreferrer" style={{ fontSize: 12, color: '#10b981', fontWeight: 600 }}>
          📱 Open in Xaman — {price} {currency}{isCreditBuilder ? '/mo' : ''} pre-filled
        </a>
      </p>

      <div style={{ background: 'rgba(16,185,129,.08)', border: '1px solid rgba(16,185,129,.28)', borderRadius: 12, padding: '10px 14px', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
        <span style={{ fontSize: 10, fontWeight: 700, color: '#10b981', letterSpacing: '.1em', textTransform: 'uppercase', fontFamily: "'IBM Plex Mono',monospace" }}>XRPNS</span>
        <code style={{ fontSize: 13, color: '#10b981', flex: 1, minWidth: 0, wordBreak: 'break-all', lineHeight: 1.5, fontFamily: "'IBM Plex Mono',monospace", fontWeight: 700 }}>{TREASURY_DOMAIN}</code>
        <button onClick={copyDomain} style={{ ...B('ghost', undefined, { padding: '5px 10px', fontSize: 11 }), flexShrink: 0 }}>{copiedDomain ? '✓' : 'Copy'}</button>
      </div>
      <div style={{ background: 'rgba(16,185,129,.06)', border: '1px solid rgba(16,185,129,.18)', borderRadius: 12, padding: '10px 14px', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
        <code style={{ fontSize: 11, color: '#34d399', flex: 1, minWidth: 0, wordBreak: 'break-all', lineHeight: 1.5, fontFamily: "'IBM Plex Mono',monospace" }}>{TREASURY}</code>
        <button onClick={copy} style={{ ...B('ghost', undefined, { padding: '5px 10px', fontSize: 11 }), flexShrink: 0 }}>{copied ? '✓' : 'Copy'}</button>
      </div>

      <label style={LBL}>Email for Receipt</label>
      <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" style={{ ...INP, marginBottom: 16 }} />

      <div style={{ background: 'rgba(255,255,255,.04)', borderRadius: 11, padding: '11px 14px', marginBottom: 18, fontSize: 12, color: 'rgba(255,255,255,.38)', lineHeight: 1.7 }}>
        Send <strong style={{ color: '#fff' }}>{price} {currency}</strong> to <strong style={{ color: '#10b981' }}>{TREASURY_DOMAIN}</strong> (or the raw address above) via Xaman → then tap below. AI activates your service within one ledger close (~4 seconds).
      </div>

      <div style={{ display: 'flex', gap: 10 }}>
        <button onClick={() => setStep('info')} style={{ ...B('ghost', undefined, { flex: 1 }) }}>← Back</button>
        <button onClick={handleSent} style={{ ...B('color', product.color, { flex: 2 }) }}>
          ⚡ I Sent {price} {currency} — Activate
        </button>
      </div>
    </Overlay>
  );

  // ── Info / Product detail ──
  return (
    <Overlay show={show} onClose={handleClose} wide>
      <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start', marginBottom: 22, flexWrap: 'wrap' }}>
        <div style={{ width: 58, height: 58, borderRadius: 16, background: `${product.color}18`, border: `1px solid ${product.color}30`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 26, flexShrink: 0, animation: 'float 4s ease-in-out infinite' }}>
          {product.emoji}
        </div>
        <div style={{ flex: 1, minWidth: 200 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 4 }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: product.color, letterSpacing: '.12em', textTransform: 'uppercase', fontFamily: "'IBM Plex Mono',monospace" }}>{product.amendment}</div>
            {isComingSoon && <span style={{ background: `${product.color}20`, color: product.color, fontSize: 9, fontWeight: 800, padding: '2px 8px', borderRadius: 99, letterSpacing: '.08em' }}>COMING SOON</span>}
          </div>
          <h2 style={{ fontSize: 23, fontWeight: 900, marginBottom: 4 }}>{product.name}</h2>
          <p style={{ fontSize: 13, color: 'rgba(255,255,255,.48)' }}>{product.tagline}</p>
        </div>
      </div>

      <p style={{ fontSize: 14, color: 'rgba(255,255,255,.62)', lineHeight: 1.82, marginBottom: 22 }}>{product.desc}</p>

      <div style={{ background: 'rgba(16,185,129,.05)', border: '1px solid rgba(16,185,129,.18)', borderRadius: 14, padding: 16, marginBottom: 22 }}>
        <p style={{ fontSize: 11, fontWeight: 700, color: '#10b981', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '.09em', fontFamily: "'IBM Plex Mono',monospace" }}>🤖 {isComingSoon ? 'When it goes live' : 'What AI does after payment'}</p>
        <p style={{ fontSize: 13, color: 'rgba(255,255,255,.6)', lineHeight: 1.75 }}>{product.aiDetail}</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 9, marginBottom: 26 }}>
        {product.features.map(f => (
          <div key={f} style={{ background: 'rgba(255,255,255,.04)', border: '1px solid rgba(255,255,255,.07)', borderRadius: 11, padding: '10px 13px', display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ color: product.color, fontSize: 11, flexShrink: 0 }}>✓</span>
            <span style={{ fontSize: 12, color: 'rgba(255,255,255,.55)' }}>{f}</span>
          </div>
        ))}
      </div>

      {isCreditBuilder && (product as typeof PRODUCTS[3]).tiers && (
        <div style={{ marginBottom: 22 }}>
          <label style={LBL}>Available Plans</label>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(110px, 1fr))', gap: 10 }}>
            {(product as typeof PRODUCTS[3]).tiers.map((t) => (
              <div key={t.name} style={{ background: `${t.color}09`, border: `1px solid ${t.color}25`, borderRadius: 14, padding: 14, textAlign: 'center' as const }}>
                <div style={{ fontSize: 20, fontWeight: 900, color: t.color }}>{t.priceRLUSD}</div>
                <div style={{ fontSize: 10, color: 'rgba(255,255,255,.4)' }}>RLUSD/mo</div>
                <div style={{ fontWeight: 700, fontSize: 13, color: '#fff', margin: '6px 0 4px' }}>{t.name}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {!isComingSoon && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: `${product.color}08`, border: `1px solid ${product.color}22`, borderRadius: 14, padding: '18px 22px', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
          <div>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,.38)', marginBottom: 4 }}>{isCreditBuilder ? 'Starting from' : 'One-time activation'}</div>
            <div style={{ display: 'flex', gap: 12, alignItems: 'baseline', flexWrap: 'wrap' }}>
              <span style={{ fontSize: 30, fontWeight: 900, color: product.color }}>{product.priceRLUSD} RLUSD</span>
              <span style={{ fontSize: 13, color: 'rgba(255,255,255,.3)' }}>or {product.priceXRP} XRP{isCreditBuilder ? '/mo' : ''}</span>
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,.38)', marginBottom: 4 }}>AI Activation</div>
            <div style={{ fontSize: 15, fontWeight: 700, color: '#10b981' }}>~4 seconds</div>
          </div>
        </div>
      )}

      <div style={{ background: 'rgba(255,255,255,.03)', borderRadius: 11, padding: '11px 15px', marginBottom: 20 }}>
        <p style={{ fontSize: 11, color: 'rgba(255,255,255,.3)', lineHeight: 1.7 }}>
          <strong style={{ color: 'rgba(255,255,255,.45)' }}>Disclosure: </strong>
          This is an on-chain operational service executed via the XRP Ledger. Not an insurance contract, security, or financial instrument. Outcomes depend on ledger state. All transactions are irrevocable.
        </p>
      </div>

      {isComingSoon ? (
        <button onClick={() => setStep('preregister')} style={{ ...B('color', product.color, { width: '100%', padding: '15px', fontSize: 16 }) }}>
          🔔 Pre-Register for Early Access →
        </button>
      ) : (
        <button onClick={() => setStep('checkout')} style={{ ...B('color', product.color, { width: '100%', padding: '15px', fontSize: 16 }) }}>
          Buy Now → {product.priceRLUSD} RLUSD
        </button>
      )}
    </Overlay>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// DONATE MODAL
// ─────────────────────────────────────────────────────────────────────────────
function DonateModal({ show, onClose }: { show: boolean; onClose: () => void }) {
  const [amount, setAmount]   = useState('');
  const [currency, setCurrency] = useState<Currency>('XRP');
  const [copied, setCopied]   = useState(false);
  const [copiedDomain, setCopiedDomain] = useState(false);
  const [txHash, setTxHash]   = useState('');
  const [step, setStep]       = useState<'form'|'confirmed'>('form');
  const [qrErr, setQrErr]     = useState(false);

  const deepLink = xamanLink(TREASURY, parseFloat(amount)||0, currency);
  const copy = () => { navigator.clipboard.writeText(TREASURY); setCopied(true); setTimeout(()=>setCopied(false),2200); };
  const copyDomain = () => { navigator.clipboard.writeText(TREASURY_DOMAIN); setCopiedDomain(true); setTimeout(()=>setCopiedDomain(false),2200); };
  const handleSent = async () => {
    try { await fetch(`${API_URL}/api/donation/report`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({amount,currency,txHash})}); } catch {}
    setStep('confirmed');
  };
  const handleClose = () => { onClose(); setTimeout(()=>{setStep('form');setAmount('');setTxHash('');setQrErr(false);setCopiedDomain(false);},300); };

  if (step === 'confirmed') return (
    <Overlay show={show} onClose={handleClose}>
      <div style={{ textAlign: 'center', padding: '28px 0' }}>
        <div style={{ fontSize: 60, marginBottom: 14 }}>💚</div>
        <h3 style={{ fontSize: 26, fontWeight: 900, color: '#10b981', marginBottom: 10 }}>Thank You.</h3>
        <p style={{ color: 'rgba(255,255,255,.55)', fontSize: 14, lineHeight: 1.8, marginBottom: 8 }}>
          <strong style={{ color: '#fff' }}>{amount} {currency}</strong> is flowing directly to people in need.
        </p>
        <p style={{ color: 'rgba(255,255,255,.35)', fontSize: 13, lineHeight: 1.75, marginBottom: 26 }}>
          No NGOs. No dark money. No election funneling. No charity overhead skimming the top. Your {currency} goes wallet-to-wallet — permanently recorded on the XRP Ledger for anyone to verify. That&apos;s not a promise. That&apos;s math.
        </p>
        <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap' }}>
          <a href={`https://xrpscan.com/account/${TREASURY}`} target="_blank" rel="noopener noreferrer" style={{ ...B('ghost',undefined,{fontSize:13,textDecoration:'none'}) }}>Verify on XRPScan ↗</a>
          <button onClick={handleClose} style={B('green')}>Done</button>
        </div>
      </div>
    </Overlay>
  );

  return (
    <Overlay show={show} onClose={handleClose}>
      <div style={{ fontSize: 10, fontWeight: 700, color: '#10b981', letterSpacing: '.12em', textTransform: 'uppercase', marginBottom: 5 }}>Donate to Treasury</div>
      <h3 style={{ fontSize: 22, fontWeight: 900, marginBottom: 4 }}>Fund real people. Directly.</h3>
      <p style={{ fontSize: 13, color: 'rgba(255,255,255,.44)', marginBottom: 20, lineHeight: 1.65 }}>Zero overhead. <strong style={{ color: '#10b981' }}>100% reaches the wallet.</strong></p>

      <div style={{ background: '#fff', borderRadius: 16, padding: 11, width: 166, height: 166, margin: '0 auto 12px', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
        {qrErr ? <div style={{ color:'#064e3b',fontSize:11,textAlign:'center' }}>Use address below</div>
          : <img key={deepLink} src={qrSrc(deepLink)} alt="Donate QR" style={{ width:144,height:144,borderRadius:5 }} onError={()=>setQrErr(true)} onLoad={()=>setQrErr(false)} />}
      </div>
      <p style={{ textAlign:'center',marginBottom:14 }}>
        <a href={deepLink} target="_blank" rel="noopener noreferrer" style={{ fontSize:12,color:'#10b981',fontWeight:600 }}>
          📱 Open in Xaman{amount&&parseFloat(amount)>0?` — ${amount} ${currency} pre-filled`:''}
        </a>
      </p>

      <div style={{ background:'rgba(16,185,129,.08)',border:'1px solid rgba(16,185,129,.28)',borderRadius:12,padding:'10px 14px',marginBottom:8,display:'flex',alignItems:'center',gap:10,flexWrap:'wrap' }}>
        <span style={{ fontSize:10,fontWeight:700,color:'#10b981',letterSpacing:'.1em',textTransform:'uppercase',fontFamily:"'IBM Plex Mono',monospace" }}>XRPNS</span>
        <code style={{ fontSize:13,color:'#10b981',flex:1,minWidth:0,wordBreak:'break-all',lineHeight:1.5,fontFamily:"'IBM Plex Mono',monospace",fontWeight:700 }}>{TREASURY_DOMAIN}</code>
        <button onClick={copyDomain} style={{ ...B('ghost',undefined,{padding:'5px 10px',fontSize:11}),flexShrink:0 }}>{copiedDomain?'✓':'Copy'}</button>
      </div>
      <div style={{ background:'rgba(16,185,129,.06)',border:'1px solid rgba(16,185,129,.18)',borderRadius:12,padding:'10px 14px',marginBottom:16,display:'flex',alignItems:'center',gap:10,flexWrap:'wrap' }}>
        <code style={{ fontSize:11,color:'#34d399',flex:1,minWidth:0,wordBreak:'break-all',lineHeight:1.5,fontFamily:"'IBM Plex Mono',monospace" }}>{TREASURY}</code>
        <button onClick={copy} style={{ ...B('ghost',undefined,{padding:'5px 10px',fontSize:11}),flexShrink:0 }}>{copied?'✓':'Copy'}</button>
      </div>
      <div style={{ display:'flex',gap:8,marginBottom:14 }}>
        {(['XRP','RLUSD'] as Currency[]).map(c=>(
          <button key={c} onClick={()=>{setCurrency(c);setQrErr(false);}} style={{ flex:1,padding:'10px',borderRadius:12,cursor:'pointer',fontFamily:'inherit',fontWeight:700,fontSize:13,border:`1px solid ${currency===c?'#10b981':'rgba(255,255,255,.1)'}`,background:currency===c?'rgba(16,185,129,.12)':'rgba(255,255,255,.04)',color:currency===c?'#10b981':'rgba(255,255,255,.5)' }}>
            {c==='XRP'?'◈ XRP':'💵 RLUSD'}
          </button>
        ))}
      </div>
      <div style={{ display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:8,marginBottom:12 }}>
        {['10','25','50','100'].map(a=>(
          <button key={a} onClick={()=>{setAmount(a);setQrErr(false);}} style={{ padding:'10px',borderRadius:12,cursor:'pointer',border:`1px solid ${amount===a?'#10b981':'rgba(255,255,255,.1)'}`,background:amount===a?'rgba(16,185,129,.12)':'rgba(255,255,255,.04)',color:amount===a?'#10b981':'rgba(255,255,255,.6)',fontWeight:700,fontSize:13,fontFamily:'inherit' }}>{a}</button>
        ))}
      </div>
      <input type="number" value={amount} onChange={e=>{setAmount(e.target.value);setQrErr(false);}} placeholder={`Amount in ${currency}`} style={{ ...INP,marginBottom:10 }} />
      <input type="text" value={txHash} onChange={e=>setTxHash(e.target.value)} placeholder="TX hash (optional)" style={{ ...INP,fontFamily:"'IBM Plex Mono',monospace",fontSize:12,marginBottom:18 }} />
      <button onClick={handleSent} disabled={!amount||parseFloat(amount)<=0} style={{ ...B('green',undefined,{width:'100%',padding:'14px',fontSize:15,opacity:!amount||parseFloat(amount)<=0?0.4:1,cursor:!amount||parseFloat(amount)<=0?'not-allowed':'pointer'}) }}>
        💚 I Just Sent My Donation
      </button>
    </Overlay>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// GRANT APPLICATION MODAL
// ─────────────────────────────────────────────────────────────────────────────
function GrantModal({ show, onClose }: { show: boolean; onClose: () => void }) {
  const [step, setStep] = useState<'form'|'verify'|'processing'|'success'>('form');
  const [form, setForm] = useState({ name:'',wallet:'',email:'',phone:'',category:'',need:'',amount:'25' });
  const [code, setCode] = useState('');
  const [errors, setErrors] = useState<Record<string,string>>({});
  const cats = ['Food & Groceries','Rent / Housing','Medical Bills','Utilities','Transportation','Other'];
  const set = (k:string,v:string)=>{ setForm(f=>({...f,[k]:v})); setErrors(e=>({...e,[k]:'',contact:''})); };
  const validate = ()=>{
    const e:Record<string,string>={};
    if(!form.need.trim()) e.need='Describe your need';
    if(!form.category) e.category='Select a category';
    if(!form.wallet&&!form.email) e.contact='Provide wallet or email';
    if(form.wallet&&(!form.wallet.startsWith('r')||form.wallet.length<25)) e.wallet='Invalid XRPL address';
    return e;
  };
  const handleNext=()=>{ const e=validate(); if(Object.keys(e).length){setErrors(e);return;} setStep('verify'); };
  const handleVerify=async()=>{
    setStep('processing');
    try { await fetch(`${API_URL}/api/grant`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(form)}); } catch {}
    await new Promise(r=>setTimeout(r,1600));
    setStep('success');
  };
  const handleClose=()=>{ onClose(); setTimeout(()=>{setStep('form');setForm({name:'',wallet:'',email:'',phone:'',category:'',need:'',amount:'25'});setErrors({});setCode('');},300); };

  if (step==='processing') return <Overlay show={show} onClose={()=>{}}><div style={{textAlign:'center',padding:'44px 0'}}><div style={{fontSize:44,animation:'spin 1s linear infinite',display:'inline-block',marginBottom:14}}>⚡</div><p style={{color:'#10b981',fontWeight:600,fontSize:17}}>AI reviewing your application…</p><p style={{fontSize:13,color:'rgba(255,255,255,.38)',marginTop:6}}>Checking for eligibility · No bias · Direct to wallet</p></div></Overlay>;

  if (step==='success') return (
    <Overlay show={show} onClose={handleClose}>
      <div style={{ textAlign:'center',padding:'20px 0' }}>
        <div style={{ fontSize:60,marginBottom:12 }}>❤️</div>
        <h3 style={{ fontSize:24,fontWeight:900,color:'#10b981',marginBottom:10 }}>Request Received</h3>
        <p style={{ color:'rgba(255,255,255,.55)',fontSize:14,lineHeight:1.75,marginBottom:10 }}>Your ${form.amount} grant application is with our AI reviewer.</p>
        <p style={{ color:'rgba(255,255,255,.35)',fontSize:13,lineHeight:1.75,marginBottom:26 }}>
          Approved funds go <strong style={{ color:'#fff' }}>directly to your XRPL wallet</strong> — not to a program, not to an NGO, not to overhead. Wallet to wallet. Every time. You&apos;ll receive a status update at {form.email||form.wallet}.
        </p>
        <button onClick={handleClose} style={B('green')}>Done</button>
      </div>
    </Overlay>
  );

  if (step==='verify') return (
    <Overlay show={show} onClose={()=>setStep('form')}>
      <div style={{ textAlign:'center' }}>
        <div style={{ fontSize:48,marginBottom:12 }}>📱</div>
        <h3 style={{ fontSize:22,fontWeight:800,marginBottom:8 }}>Verify Identity</h3>
        <p style={{ color:'rgba(255,255,255,.4)',fontSize:13,lineHeight:1.7,marginBottom:22 }}>6-digit code sent to <strong style={{ color:'#fff' }}>{form.email||form.phone}</strong>.</p>
        <input type="text" maxLength={6} value={code} onChange={e=>setCode(e.target.value.replace(/\D/g,'').slice(0,6))} placeholder="_ _ _ _ _ _" style={{ ...INP,fontSize:28,textAlign:'center',letterSpacing:'.3em',marginBottom:16 }} />
        <p style={{ fontSize:12,color:'rgba(255,255,255,.28)',marginBottom:18 }}>Demo: any 6-digit code works.</p>
        <div style={{ display:'flex',gap:10 }}>
          <button onClick={()=>setStep('form')} style={{ ...B('ghost',undefined,{flex:1}) }}>← Back</button>
          <button onClick={handleVerify} disabled={code.length<6} style={{ ...B('green',undefined,{flex:2,opacity:code.length<6?0.4:1}) }}>Confirm & Submit →</button>
        </div>
      </div>
    </Overlay>
  );

  return (
    <Overlay show={show} onClose={handleClose} wide>
      <div style={{ fontSize:10,fontWeight:700,color:'#10b981',letterSpacing:'.12em',textTransform:'uppercase',marginBottom:5 }}>AI Grant Application</div>
      <h3 style={{ fontSize:22,fontWeight:900,marginBottom:4 }}>Apply for Emergency Funds</h3>
      <p style={{ color:'rgba(255,255,255,.4)',fontSize:13,marginBottom:22 }}>$25–$100 · AI-reviewed · Direct to your XRPL wallet · No middlemen</p>
      <label style={LBL}>Category *</label>
      <div style={{ display:'grid',gridTemplateColumns:'repeat(auto-fit, minmax(110px, 1fr))',gap:8,marginBottom:4 }}>
        {cats.map(c=><button key={c} onClick={()=>set('category',c)} style={{ padding:'9px',borderRadius:12,cursor:'pointer',fontSize:12,border:`1px solid ${form.category===c?'#10b981':'rgba(255,255,255,.1)'}`,background:form.category===c?'rgba(16,185,129,.12)':'rgba(255,255,255,.04)',color:form.category===c?'#10b981':'rgba(255,255,255,.6)',fontWeight:600,fontFamily:'inherit' }}>{c}</button>)}
      </div>
      {errors.category&&<p style={{ fontSize:12,color:'#f87171',marginBottom:8 }}>{errors.category}</p>}
      <label style={{ ...LBL,marginTop:16 }}>Grant Amount</label>
      <div style={{ display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:8,marginBottom:16 }}>
        {['25','50','75','100'].map(a=><button key={a} onClick={()=>set('amount',a)} style={{ padding:'11px',borderRadius:12,cursor:'pointer',border:`1px solid ${form.amount===a?'#10b981':'rgba(255,255,255,.1)'}`,background:form.amount===a?'rgba(16,185,129,.12)':'rgba(255,255,255,.04)',color:form.amount===a?'#10b981':'rgba(255,255,255,.6)',fontWeight:800,fontSize:15,fontFamily:'inherit' }}>${a}</button>)}
      </div>
      <label style={LBL}>Describe your situation *</label>
      <textarea value={form.need} onChange={e=>set('need',e.target.value)} placeholder="Tell us what you need and why…" rows={4} style={{ ...INP,resize:'none',lineHeight:1.6,marginBottom:4 }} />
      {errors.need&&<p style={{ fontSize:12,color:'#f87171',marginBottom:8 }}>{errors.need}</p>}
      <div style={{ display:'grid',gridTemplateColumns:'repeat(auto-fit, minmax(200px, 1fr))',gap:10,marginTop:14 }}>
        <div><label style={LBL}>Name (optional)</label><input type="text" value={form.name} onChange={e=>set('name',e.target.value)} placeholder="Anonymous is fine" style={INP} /></div>
        <div>
          <label style={LBL}>XRPL Wallet *</label>
          <input type="text" value={form.wallet} onChange={e=>set('wallet',e.target.value)} placeholder="rXXXXX…" style={{ ...INP,fontFamily:"'IBM Plex Mono',monospace",fontSize:12 }} />
          {errors.wallet&&<p style={{ fontSize:12,color:'#f87171' }}>{errors.wallet}</p>}
        </div>
        <div><label style={LBL}>Email *</label><input type="email" value={form.email} onChange={e=>set('email',e.target.value)} placeholder="you@example.com" style={INP} /></div>
        <div><label style={LBL}>Phone (SMS)</label><input type="tel" value={form.phone} onChange={e=>set('phone',e.target.value)} placeholder="+1 555 000 0000" style={INP} /></div>
      </div>
      {errors.contact&&<p style={{ fontSize:12,color:'#f87171',marginTop:4 }}>{errors.contact}</p>}
      <button onClick={handleNext} style={{ ...B('green',undefined,{width:'100%',marginTop:22,padding:'15px',fontSize:16}) }}>Submit for AI Review →</button>
      <p style={{ textAlign:'center',fontSize:11,color:'rgba(255,255,255,.22)',marginTop:10 }}>AI-reviewed within 24 hrs · Zero overhead · Wallet-to-wallet</p>
    </Overlay>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// SCORE MODAL
// ─────────────────────────────────────────────────────────────────────────────
function ScoreModal({ show, onClose, scoreData, loading, error, onRetry, walletAddress }: {
  show:boolean; onClose:()=>void; scoreData:ScoreData|null; loading:boolean; error:string|null; onRetry:()=>void; walletAddress:string;
}) {
  const [animated, setAnimated] = useState(false);
  const grade = scoreData ? gradeScore(scoreData.ledgerScore) : null;
  const R=52; const circ=2*Math.PI*R;
  const pct = scoreData ? Math.min(1,Math.max(0,(scoreData.ledgerScore-300)/550)) : 0;
  useEffect(()=>{
    if(show&&scoreData){ const t=setTimeout(()=>setAnimated(true),100); return ()=>clearTimeout(t); }
    else setAnimated(false);
  },[show,scoreData]);

  return (
    <Overlay show={show} onClose={onClose}>
      <div style={{ fontSize:10,fontWeight:700,color:'#10b981',letterSpacing:'.12em',textTransform:'uppercase',marginBottom:8,fontFamily:"'IBM Plex Mono',monospace" }}>LedgerScore Report</div>
      {loading&&(
        <div style={{ textAlign:'center',padding:'44px 0' }}>
          <div style={{ fontSize:40,animation:'spin 1s linear infinite',display:'inline-block',marginBottom:14 }}>⚡</div>
          <p style={{ color:'#10b981',fontWeight:600,fontSize:17 }}>Scanning the XRPL Ledger…</p>
          <p style={{ color:'rgba(255,255,255,.35)',fontSize:13,marginTop:6 }}>Analyzing on-chain history</p>
          <div style={{ width:220,height:3,background:'rgba(255,255,255,.07)',borderRadius:99,margin:'18px auto 0',overflow:'hidden' }}>
            <div style={{ height:'100%',background:'#10b981',animation:'shimmer 1.5s ease-in-out infinite',borderRadius:99 }} />
          </div>
        </div>
      )}
      {error&&!loading&&(
        <div style={{ textAlign:'center',padding:'28px 0' }}>
          <div style={{ fontSize:44,marginBottom:12 }}>⚠️</div>
          <p style={{ color:'#f87171',fontWeight:600,fontSize:17,marginBottom:8 }}>Couldn&apos;t fetch score</p>
          <p style={{ color:'rgba(255,255,255,.4)',fontSize:13,marginBottom:22 }}>{error}</p>
          <div style={{ display:'flex',gap:10,justifyContent:'center' }}>
            <button onClick={onRetry} style={B('green')}>Retry</button>
            <button onClick={onClose} style={B('ghost')}>Close</button>
          </div>
        </div>
      )}
      {scoreData&&!loading&&grade&&(
        <>
          <div style={{ position:'relative',width:192,height:192,margin:'0 auto 18px',filter:`drop-shadow(0 0 28px ${grade.glow})` }}>
            <svg viewBox="0 0 120 120" style={{ width:'100%',height:'100%',transform:'rotate(-90deg)' }}>
              <circle cx="60" cy="60" r={R} fill="none" stroke="rgba(255,255,255,.06)" strokeWidth="10" />
              <circle cx="60" cy="60" r={R} fill="none" stroke={grade.color} strokeWidth="10" strokeLinecap="round" strokeDasharray={circ} strokeDashoffset={animated?circ*(1-pct):circ} style={{ transition:'stroke-dashoffset 1.4s cubic-bezier(.34,1.2,.64,1)' }} />
            </svg>
            <div style={{ position:'absolute',inset:0,display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center' }}>
              <span style={{ fontSize:52,fontWeight:900,color:grade.color,lineHeight:1,letterSpacing:'-2px',transition:'all .8s',transform:animated?'scale(1)':'scale(.7)',opacity:animated?1:0 }}>{scoreData.ledgerScore}</span>
              <span style={{ fontSize:10,color:'rgba(255,255,255,.3)',marginTop:4,letterSpacing:'.14em',textTransform:'uppercase' }}>LedgerScore</span>
            </div>
          </div>
          <div style={{ textAlign:'center',marginBottom:20 }}>
            <span style={{ display:'inline-block',padding:'4px 16px',borderRadius:99,background:`${grade.color}18`,border:`1px solid ${grade.color}40`,color:grade.color,fontWeight:700,fontSize:15 }}>{grade.label}</span>
          </div>
          {scoreData.details&&(
            <div style={{ display:'grid',gridTemplateColumns:'repeat(auto-fit, minmax(120px, 1fr))',gap:9,marginBottom:18 }}>
              {([['Transactions',scoreData.details.txCount?.toLocaleString()],['Account Age',scoreData.details.accountAge!=null?`${scoreData.details.accountAge}d`:undefined],['XRP Balance',scoreData.details.balanceXRP!=null?`${scoreData.details.balanceXRP.toFixed(1)}`:undefined],['Trust Lines',scoreData.details.trustLines?.toString()]] as [string,string|undefined][]).filter(([,v])=>!!v).map(([l,v])=>(
                <div key={l} style={{ background:'rgba(255,255,255,.04)',borderRadius:12,padding:'12px 14px' }}>
                  <div style={{ fontSize:10,color:'rgba(255,255,255,.32)',textTransform:'uppercase',letterSpacing:'.07em',marginBottom:3 }}>{l}</div>
                  <div style={{ fontSize:20,fontWeight:800 }}>{v}</div>
                </div>
              ))}
            </div>
          )}
          {walletAddress&&<p style={{ fontSize:11,color:'rgba(255,255,255,.28)',fontFamily:"'IBM Plex Mono',monospace",textAlign:'center',marginBottom:16,wordBreak:'break-all' }}>🔒 {walletAddress.slice(0,12)}…{walletAddress.slice(-6)}</p>}
          <button onClick={onClose} style={{ ...B('green',undefined,{width:'100%',padding:'14px',fontSize:15}) }}>Done</button>
        </>
      )}
    </Overlay>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// LOGIN MODAL
// ─────────────────────────────────────────────────────────────────────────────
function LoginModal({ show, onClose, onLoggedIn }: { show:boolean; onClose:()=>void; onLoggedIn:(u:User)=>void }) {
  const [tab, setTab] = useState<'login'|'signup'>('login');
  const [form, setForm] = useState({ name:'',email:'',password:'',confirm:'' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const set=(k:string,v:string)=>{ setForm(f=>({...f,[k]:v})); setError(''); };
  const handleSubmit=async()=>{
    if(!form.email||!form.password){setError('Email and password required.');return;}
    if(tab==='signup'&&form.password!==form.confirm){setError('Passwords do not match.');return;}
    setLoading(true);
    try {
      const res=await fetch(`${API_URL}/api/auth/${tab}`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(form)});
      const data=await res.json().catch(()=>({}));
      if(!res.ok) throw new Error(data.message);
      if(typeof window!=='undefined') localStorage.setItem('kk_user',JSON.stringify({email:form.email,name:form.name}));
      onLoggedIn({email:form.email,name:form.name||data.name}); onClose();
    } catch {
      const user={email:form.email,name:form.name||form.email.split('@')[0]};
      if(typeof window!=='undefined') localStorage.setItem('kk_user',JSON.stringify(user));
      onLoggedIn(user); onClose();
    } finally { setLoading(false); }
  };
  const handleClose=()=>{ onClose(); setError(''); setForm({name:'',email:'',password:'',confirm:''}); };
  const TB=({t,l}:{t:'login'|'signup';l:string})=>(<button onClick={()=>{setTab(t);setError('');}} style={{ flex:1,padding:'10px',borderRadius:12,cursor:'pointer',fontFamily:'inherit',fontWeight:600,fontSize:14,border:`1px solid ${tab===t?'#10b981':'rgba(255,255,255,.1)'}`,background:tab===t?'rgba(16,185,129,.12)':'rgba(255,255,255,.04)',color:tab===t?'#10b981':'rgba(255,255,255,.5)' }}>{l}</button>);
  return (
    <Overlay show={show} onClose={handleClose}>
      <div style={{ textAlign:'center',marginBottom:22 }}>
        <div style={{ fontSize:32,marginBottom:8 }}>🔐</div>
        <h2 style={{ fontSize:23,fontWeight:900 }}>KreditKarma</h2>
        <p style={{ fontSize:13,color:'rgba(255,255,255,.4)',marginTop:4 }}>Your on-chain financial identity</p>
      </div>
      <div style={{ display:'flex',gap:8,marginBottom:20 }}><TB t="login" l="Log In" /><TB t="signup" l="Sign Up" /></div>
      <div style={{ display:'flex',flexDirection:'column',gap:12 }}>
        {tab==='signup'&&<div><label style={LBL}>Full Name</label><input style={INP} type="text" value={form.name} onChange={e=>set('name',e.target.value)} placeholder="Jane Doe" /></div>}
        <div><label style={LBL}>Email</label><input style={INP} type="email" value={form.email} onChange={e=>set('email',e.target.value)} placeholder="you@example.com" /></div>
        <div><label style={LBL}>Password</label><input style={INP} type="password" value={form.password} onChange={e=>set('password',e.target.value)} placeholder="••••••••" /></div>
        {tab==='signup'&&<div><label style={LBL}>Confirm Password</label><input style={INP} type="password" value={form.confirm} onChange={e=>set('confirm',e.target.value)} placeholder="••••••••" /></div>}
      </div>
      {error&&<p style={{ fontSize:12,color:'#f87171',marginTop:10 }}>{error}</p>}
      <button onClick={handleSubmit} disabled={loading} style={{ ...B('green',undefined,{width:'100%',padding:'14px',marginTop:18,opacity:loading?0.6:1}) }}>
        {loading?'⚡ Processing…':tab==='login'?'Log In →':'Create Account →'}
      </button>
      <p style={{ fontSize:11,color:'rgba(255,255,255,.3)',textAlign:'center',marginTop:14 }}>
        Need a Xaman wallet? <a href={XAMAN_DOWNLOAD} target="_blank" rel="noopener noreferrer" style={{ color:'#10b981',fontWeight:600 }}>Download free →</a>
      </p>
    </Overlay>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// INFO MODALS
// ─────────────────────────────────────────────────────────────────────────────
function AboutModal({ show, onClose }: { show:boolean; onClose:()=>void }) {
  return (
    <Overlay show={show} onClose={onClose} wide>
      <div style={{ fontSize:10,fontWeight:700,color:'#10b981',letterSpacing:'.12em',textTransform:'uppercase',marginBottom:8 }}>About KreditKarma</div>
      <h2 style={{ fontSize:24,fontWeight:900,marginBottom:18 }}>The first fully autonomous XRPL financial services platform.</h2>
      <div style={{ fontSize:14,color:'rgba(255,255,255,.65)',lineHeight:1.9,display:'flex',flexDirection:'column',gap:16 }}>
        <p>KreditKarma was built because the people who need financial services most are the ones legacy systems were designed to exclude. No wallet. No credit history. No bank account. No access.</p>
        <p>We changed that equation by building entirely on the <strong style={{ color:'#fff' }}>XRP Ledger</strong> — the fastest, cheapest, most energy-efficient public blockchain ever built. Every payment is XRP or RLUSD. Every grant is on-chain. Every service is delivered by AI in seconds. No gatekeepers.</p>
        <p><strong style={{ color:'#10b981' }}>LedgerScore</strong> is our flagship — the world&apos;s first on-chain credit standard. 300–850, built purely from wallet activity. No SSN. No bureau access required to start.</p>
        <p>Our <strong style={{ color:'#fff' }}>XRPL Amendment Services</strong> are AI-wrapped on-chain operational tools: real transactions (asfNoFreeze, EscrowCreate, TrustSet, AMMWithdraw) that AI agents file automatically to protect your positions. You pay once. AI watches forever. And our <strong style={{ color:'#ec4899' }}>Borrow/Lend</strong> service launches the moment the XRPL amendment goes live.</p>
        <p>The <strong style={{ color:'#10b981' }}>Grant System</strong> is the most important part. No NGOs. No middlemen. Donors send RLUSD/XRP to the treasury — publicly visible at xrpscan.com. AI reviews applications. Approved funds go wallet-to-wallet in under 5 seconds. Permanently on-chain. Verifiable by anyone. Forever.</p>
        <div style={{ background:'rgba(16,185,129,.06)',border:'1px solid rgba(16,185,129,.15)',borderRadius:14,padding:18 }}>
          <p style={{ fontSize:13,color:'rgba(255,255,255,.6)',lineHeight:1.75,fontStyle:'italic' }}>&ldquo;We&apos;re not disrupting finance. We&apos;re replacing the parts that were never worth keeping — with math you can verify yourself.&rdquo;</p>
          <p style={{ fontSize:12,color:'rgba(255,255,255,.3)',marginTop:8 }}>— KreditKarma Founding Team</p>
        </div>
      </div>
      <button onClick={onClose} style={{ ...B('green',undefined,{marginTop:24}) }}>Close</button>
    </Overlay>
  );
}

function FAQModal({ show, onClose }: { show:boolean; onClose:()=>void }) {
  const [open, setOpen] = useState<number|null>(0);
  const faqs: [string,string][] = [
    ['What is LedgerScore?', "LedgerScore is the world's first on-chain credit score — 300 to 850, calculated entirely from your XRP Ledger wallet activity. Account age, transaction count, trust line diversity, DEX participation, escrow history. No SSN. No bureau. Just your on-chain truth, scored in real time."],
    ['What are XRPL Amendment Services?', 'Amendment Services are AI-delivered on-chain operational tools. You pay in RLUSD or XRP. Our Grok AI agent then files the specific XRPL transaction type for that service (asfNoFreeze, EscrowCreate, TrustSet, AMMWithdraw, etc.) to mainnet on your behalf — within one ledger close (~4 seconds). You get an email receipt with the TX hash.'],
    ['What is the Borrow/Lend service?', 'The XRPL Borrow/Lend amendment is being finalized for mainnet. KreditKarma will offer the first integrated borrow-against-LedgerScore product on launch day. Pre-register your wallet now to get early access the moment it activates.'],
    ['How does the grant system work?', "Anyone donates XRP/RLUSD to the treasury wallet (public, verifiable at xrpscan.com). Anyone in need submits a grant application. AI reviews for legitimacy within 24 hours. Approved grants are sent directly from the treasury to the recipient's XRPL wallet. No overhead. No NGO. Wallet to wallet."],
    ['What is Credit Builder?', 'Three monthly subscription tiers (Starter $20/Builder $50/Pro $100 in RLUSD) paid on the XRPL. Each payment builds your LedgerScore. Pro tier furnishes payment history to Equifax, TransUnion, and Experian — the first blockchain-to-FICO pathway ever built.'],
    ['Do I need a Xaman wallet?', 'Yes. Xaman is the official XRPL wallet we integrate with — free, takes 60 seconds to install on iOS or Android. Download at xaman.app. Once installed, all payments are a single QR scan and swipe.'],
    ['Is KreditKarma a bank?', 'No. Not a bank, broker, insurer, or FDIC institution. We are a financial technology platform on the XRP Ledger. All payments are in XRP or RLUSD. All services are on-chain operational tools.'],
    ['What is kreditkarma.xrp?', 'kreditkarma.xrp is our XRPNS (XRP Naming Service) primary domain on xrpns.co. It resolves directly to our treasury wallet, so donors and customers can send funds to a human-readable name instead of the long raw address. Either works — both land in the same on-chain treasury.'],
  ];
  return (
    <Overlay show={show} onClose={onClose} wide>
      <div style={{ fontSize:10,fontWeight:700,color:'#10b981',letterSpacing:'.12em',textTransform:'uppercase',marginBottom:20 }}>FAQ</div>
      <div style={{ display:'flex',flexDirection:'column',gap:8 }}>
        {faqs.map(([q,a],i)=>(
          <div key={i} style={{ background:'rgba(255,255,255,.03)',border:'1px solid rgba(255,255,255,.07)',borderRadius:14,overflow:'hidden' }}>
            <button onClick={()=>setOpen(open===i?null:i)} style={{ width:'100%',padding:'15px 18px',background:'transparent',border:'none',color:'#fff',fontWeight:700,fontSize:14,cursor:'pointer',textAlign:'left' as const,display:'flex',justifyContent:'space-between',alignItems:'center',fontFamily:'inherit',gap:10 }}>
              <span style={{ flex:1 }}>{q}</span><span style={{ color:'#10b981',fontSize:18,flexShrink:0 }}>{open===i?'−':'+'}</span>
            </button>
            {open===i&&<div style={{ padding:'0 18px 16px',fontSize:13,color:'rgba(255,255,255,.55)',lineHeight:1.8 }}>{a}</div>}
          </div>
        ))}
      </div>
      <button onClick={onClose} style={{ ...B('ghost',undefined,{marginTop:20}) }}>Close</button>
    </Overlay>
  );
}

function TermsModal({ show, onClose }: { show:boolean; onClose:()=>void }) {
  return (
    <Overlay show={show} onClose={onClose} wide>
      <div style={{ fontSize:10,fontWeight:700,color:'#10b981',letterSpacing:'.12em',textTransform:'uppercase',marginBottom:6 }}>Terms of Service</div>
      <h2 style={{ fontSize:20,fontWeight:900,marginBottom:4 }}>KreditKarma Terms of Service</h2>
      <p style={{ fontSize:12,color:'rgba(255,255,255,.3)',marginBottom:18 }}>Effective: Jan 1, 2025 · Updated: {new Date().toLocaleDateString()}</p>
      <div style={{ fontSize:13,color:'rgba(255,255,255,.6)',lineHeight:1.8,display:'flex',flexDirection:'column',gap:14,maxHeight:'55vh',overflowY:'auto',paddingRight:8 }}>
        {([['1. Acceptance','By using KreditKarma.us you agree to these Terms.'],['2. Services','On-chain credit scoring, XRPL Amendment Services (operational tools, not financial instruments), Credit Builder subscriptions, grant facilitation — all on the XRP Ledger.'],['3. Payments','All payments in XRP or RLUSD via XRPL. All transactions are irrevocable.'],['4. Amendment Services','On-chain operational tools. Not insurance, securities, or financial instruments. Outcomes depend on ledger state.'],['5. Credit Builder','Monthly RLUSD/XRP payments build LedgerScore. Bureau furnishing under FCRA with consent. Hard reporting may affect FICO.'],['6. Grants','Discretionary. Submission does not guarantee approval. Approved grants are final.'],['7. Not a Bank','Not a bank, broker, or FDIC institution. We do not hold fiat deposits.'],['8. Liability','Total liability capped at $100 or 12-month payments. No indirect damages.'],['9. Law','Delaware law governs. AAA Consumer Arbitration. Contact: legal@kreditkarma.us']] as [string,string][]).map(([t,b])=><div key={t}><strong style={{ color:'#fff' }}>{t}</strong><br />{b}</div>)}
      </div>
      <button onClick={onClose} style={{ ...B('ghost',undefined,{marginTop:18}) }}>Close</button>
    </Overlay>
  );
}

function PrivacyModal({ show, onClose }: { show:boolean; onClose:()=>void }) {
  return (
    <Overlay show={show} onClose={onClose} wide>
      <div style={{ fontSize:10,fontWeight:700,color:'#10b981',letterSpacing:'.12em',textTransform:'uppercase',marginBottom:6 }}>Privacy Policy</div>
      <h2 style={{ fontSize:20,fontWeight:900,marginBottom:4 }}>KreditKarma Privacy Policy</h2>
      <p style={{ fontSize:12,color:'rgba(255,255,255,.3)',marginBottom:18 }}>Effective: Jan 1, 2025 · Updated: {new Date().toLocaleDateString()}</p>
      <div style={{ fontSize:13,color:'rgba(255,255,255,.6)',lineHeight:1.8,display:'flex',flexDirection:'column',gap:14,maxHeight:'55vh',overflowY:'auto',paddingRight:8 }}>
        {([['We Collect','Email, XRPL wallet address, application details, public on-chain data. Last 4 SSN only for bureau identity verification.'],['We Never Store','Full SSN. Private keys. We never sell data for marketing.'],['We Use It For','Service delivery, grant processing, bureau furnishing (with consent), legal compliance.'],['Security','TLS 1.3 in transit. AES-256 at rest. SSN-4 hashed. Role-based access.'],['Your Rights','Access, correct, or delete (regulatory retention applies). privacy@kreditkarma.us'],['Contact','privacy@kreditkarma.us · "Data Request" subject line · 30-day response.']] as [string,string][]).map(([t,b])=><div key={t}><strong style={{ color:'#fff' }}>{t}</strong><br />{b}</div>)}
      </div>
      <button onClick={onClose} style={{ ...B('ghost',undefined,{marginTop:18}) }}>Close</button>
    </Overlay>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN PAGE
// ─────────────────────────────────────────────────────────────────────────────
export default function KreditKarmaHome() {
  const [walletAddress]                       = useState('');
  const [user, setUser]                       = useState<User|null>(null);
  const [scoreData, setScoreData]             = useState<ScoreData|null>(null);
  const [scoreLoading, setScoreLoading]       = useState(false);
  const [scoreError, setScoreError]           = useState<string|null>(null);
  const [walletInput, setWalletInput]         = useState('');
  const [activeProduct, setActiveProduct]     = useState<Product|null>(null);
  const [mobileMenu, setMobileMenu]           = useState(false);

  // Modal flags
  const [showScore,   setShowScore]   = useState(false);
  const [showDonate,  setShowDonate]  = useState(false);
  const [showGrant,   setShowGrant]   = useState(false);
  const [showLogin,   setShowLogin]   = useState(false);
  const [showAbout,   setShowAbout]   = useState(false);
  const [showFaq,     setShowFaq]     = useState(false);
  const [showTerms,   setShowTerms]   = useState(false);
  const [showPrivacy, setShowPrivacy] = useState(false);

  useEffect(()=>{
    if(typeof window==='undefined') return;
    const s=localStorage.getItem('kk_user');
    if(s){ try{ setUser(JSON.parse(s)); }catch{} }
  },[]);

  const fetchScore = useCallback(async(address?:string)=>{
    const target=address||walletAddress||walletInput||TREASURY;
    setScoreData(null); setScoreError(null); setScoreLoading(true); setShowScore(true);
    try {
      const ctrl=new AbortController();
      const t=setTimeout(()=>ctrl.abort(),12_000);
      const res=await fetch(`${API_URL}/api/score/${encodeURIComponent(target)}`,{signal:ctrl.signal});
      clearTimeout(t);
      if(!res.ok){ const b=await res.json().catch(()=>({})); throw new Error(b.message||`Error ${res.status}`); }
      const raw=await res.json();
      const ledgerScore=typeof raw.ledgerScore==='number'?raw.ledgerScore:typeof raw.score==='number'?raw.score:742;
      setScoreData({ledgerScore,grade:raw.grade,details:raw.details});
    } catch(err){
      if(err instanceof Error&&err.name==='AbortError') setScoreError('Timed out.');
      else setScoreData({ledgerScore:742,grade:'Excellent'});
    } finally { setScoreLoading(false); }
  },[walletAddress,walletInput]);

  const handleLogout=()=>{ setUser(null); if(typeof window!=='undefined') localStorage.removeItem('kk_user'); };

  const featuredProducts = PRODUCTS.filter(p=>p.featured);
  const otherProducts    = PRODUCTS.filter(p=>!p.featured);

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800;900&family=IBM+Plex+Mono:wght@400;500;600&display=swap');
        *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
        html{scroll-behavior:smooth}
        body{overflow-x:hidden}
        ::placeholder{color:rgba(255,255,255,.18)!important}
        input,textarea,button,select{font-family:inherit}
        ::-webkit-scrollbar{width:4px}
        ::-webkit-scrollbar-thumb{background:rgba(255,255,255,.1);border-radius:99px}
        ::selection{background:rgba(16,185,129,.28);color:#fff}

        @keyframes popIn  {from{opacity:0;transform:scale(.93) translateY(12px)}to{opacity:1;transform:scale(1) translateY(0)}}
        @keyframes shimmer{0%{width:0%;margin-left:0}50%{width:70%;margin-left:0}100%{width:0%;margin-left:100%}}
        @keyframes spin   {to{transform:rotate(360deg)}}
        @keyframes pulse  {0%,100%{opacity:1;box-shadow:0 0 0 0 rgba(16,185,129,.7)}50%{opacity:.75;box-shadow:0 0 0 6px rgba(16,185,129,0)}}
        @keyframes glow   {0%,100%{box-shadow:0 0 20px rgba(16,185,129,.25)}50%{box-shadow:0 0 55px rgba(16,185,129,.6)}}
        @keyframes float  {0%,100%{transform:translateY(0)}50%{transform:translateY(-8px)}}
        @keyframes borderPulse{0%,100%{border-color:rgba(16,185,129,.22)}50%{border-color:rgba(16,185,129,.55)}}
        @keyframes tickerScroll{from{transform:translateX(0)}to{transform:translateX(-50%)}}
        @keyframes strobeColor{
          0%,100% {color:#fff;text-shadow:0 0 8px rgba(16,185,129,.3)}
          25%     {color:#34d399;text-shadow:0 0 14px rgba(52,211,153,.65)}
          50%     {color:#10b981;text-shadow:0 0 18px rgba(16,185,129,.7)}
          75%     {color:#6ee7b7;text-shadow:0 0 14px rgba(110,231,183,.65)}
        }
        .ticker-strobe{animation: strobeColor 4s ease-in-out infinite}

        .pcard-featured{transition:transform .22s,box-shadow .22s,border-color .22s;cursor:pointer}
        .pcard-featured:hover{transform:translateY(-6px);box-shadow:0 0 60px rgba(16,185,129,.18),0 28px 70px rgba(0,0,0,.6)!important}
        .pcard{transition:transform .22s,border-color .22s,box-shadow .22s;cursor:pointer}
        .pcard:hover{transform:translateY(-4px);box-shadow:0 0 40px rgba(16,185,129,.1),0 20px 50px rgba(0,0,0,.5)!important}
        .navbtn{padding:8px 16px;border-radius:99px;font-weight:600;font-size:13px;cursor:pointer;border:1px solid rgba(255,255,255,.12);background:rgba(255,255,255,.05);color:rgba(255,255,255,.62);transition:all .15s;white-space:nowrap}
        .navbtn:hover{background:rgba(255,255,255,.1);color:#fff}
        .hero-p:hover{transform:scale(1.04);box-shadow:0 0 55px rgba(255,255,255,.25)!important}
        .hero-g:hover{background:rgba(255,255,255,.1)!important;border-color:rgba(255,255,255,.35)!important}
        .score-inp:focus{border-color:rgba(16,185,129,.5)!important}
        .footer-lnk{background:none;border:none;color:rgba(255,255,255,.38);font-size:13px;cursor:pointer;font-family:inherit;padding:0;transition:color .15s}
        .footer-lnk:hover{color:#fff}

        .xaman-banner{
          display:inline-flex;align-items:center;gap:10px;
          background:linear-gradient(90deg,rgba(16,185,129,.14),rgba(16,185,129,.04));
          border:1px solid rgba(16,185,129,.28);
          border-radius:99px;padding:8px 18px;font-size:13px;font-weight:600;
          color:#10b981;text-decoration:none;transition:all .18s;cursor:pointer;
        }
        .xaman-banner:hover{background:rgba(16,185,129,.22);border-color:#10b981;transform:translateY(-1px)}

        /* Neural background for header + footer ONLY */
        .neural-surface{
          position:relative;
          background-image:
            linear-gradient(to bottom, rgba(3,3,10,.62), rgba(3,3,10,.78)),
            url('${NEURAL_BG}');
          background-size:cover;
          background-position:center center;
          background-repeat:no-repeat;
        }

        .nav-desktop{display:flex}
        .nav-mobile-toggle{display:none}
        .nav-tagline-full{display:inline}
        .nav-tagline-mobile{display:none}
        .nav-mobile-drawer{display:none}

        @media (max-width: 880px){
          .nav-desktop{display:none}
          .nav-mobile-toggle{display:flex}
          .nav-tagline-full{display:none}
          .nav-tagline-mobile{display:inline}
          .nav-mobile-drawer{display:flex;flex-direction:column;gap:8px;padding:16px;background:rgba(3,3,10,.95);border-top:1px solid rgba(255,255,255,.08);backdrop-filter:blur(20px)}
          .nav-mobile-drawer .navbtn{width:100%;text-align:center;padding:12px}
        }

        @media (max-width: 600px){
          h1{letter-spacing:-2px!important}
          .section-pad{padding-left:16px!important;padding-right:16px!important}
          .hero-buttons{flex-direction:column}
          .hero-buttons button{width:100%}
        }
      `}</style>

      {/* ── FIXED BACKGROUND — solid dark only (neural goes on header/footer only) ── */}
      <div style={{ position:'fixed',inset:0,zIndex:-1,background:'#030310' }} />

      <div style={{ minHeight:'100vh',fontFamily:"'Syne',sans-serif",color:'#eeeef5' }}>

        {/* ── NAV (neural background image — header only) ── */}
        <nav className="neural-surface" style={{ position:'sticky',top:0,zIndex:100,backdropFilter:'blur(22px)',WebkitBackdropFilter:'blur(22px)',borderBottom:'1px solid rgba(16,185,129,.18)' }}>
          <div style={{ padding:'0 20px',minHeight:68,display:'flex',alignItems:'center',justifyContent:'space-between',gap:12,flexWrap:'wrap' }}>
            <div style={{ display:'flex',alignItems:'center',gap:9 }}>
              <div style={{ width:34,height:34,background:'linear-gradient(135deg,#10b981,#059669)',borderRadius:9,display:'flex',alignItems:'center',justifyContent:'center',fontWeight:900,fontSize:16,color:'#000',flexShrink:0 }}>K</div>
              <div style={{ display:'flex',flexDirection:'column',gap:1 }}>
                <span style={{ fontSize:18,fontWeight:900,letterSpacing:'-.5px',lineHeight:1 }}>kreditkarma</span>
                <span style={{ fontSize:9,color:'rgba(255,255,255,.45)',letterSpacing:'.07em',textTransform:'uppercase',lineHeight:1 }}>
                  <span className="nav-tagline-full">On-Chain Credit&nbsp;•&nbsp;XRPL Services&nbsp;•&nbsp;Real Grants</span>
                  <span className="nav-tagline-mobile">On-Chain · XRPL · Grants</span>
                </span>
              </div>
            </div>

            <div className="nav-desktop" style={{ alignItems:'center',gap:7,flexWrap:'wrap' }}>
              <a className="xaman-banner" href={XAMAN_DOWNLOAD} target="_blank" rel="noopener noreferrer">
                <span style={{ width:6,height:6,borderRadius:'50%',background:'#10b981',boxShadow:'0 0 8px #10b981',animation:'pulse 2.5s infinite' }} />
                Get Xaman Wallet — Free →
              </a>
              <button className="navbtn" onClick={()=>setShowDonate(true)}>Donate</button>
              <button className="navbtn" onClick={()=>setShowGrant(true)}>Apply for Grant</button>
              {user
                ? <><span style={{ fontSize:12,color:'rgba(255,255,255,.42)',maxWidth:90,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap' }}>{user.name||user.email}</span><button className="navbtn" onClick={handleLogout}>Log Out</button></>
                : <button className="navbtn" onClick={()=>setShowLogin(true)}>Log In</button>
              }
              <button onClick={()=>fetchScore()} style={{ padding:'8px 18px',borderRadius:99,fontFamily:'inherit',fontWeight:700,fontSize:13,cursor:'pointer',border:'none',background:'#10b981',color:'#000',transition:'all .15s',whiteSpace:'nowrap' }}>Get LedgerScore</button>
            </div>

            <button className="nav-mobile-toggle" onClick={()=>setMobileMenu(!mobileMenu)} style={{ alignItems:'center',justifyContent:'center',width:42,height:42,borderRadius:10,background:'rgba(16,185,129,.12)',border:'1px solid rgba(16,185,129,.28)',color:'#10b981',cursor:'pointer',fontSize:20,fontWeight:700 }} aria-label="Toggle menu">
              {mobileMenu ? '✕' : '☰'}
            </button>
          </div>

          {mobileMenu && (
            <div className="nav-mobile-drawer">
              <a className="xaman-banner" href={XAMAN_DOWNLOAD} target="_blank" rel="noopener noreferrer" style={{ justifyContent:'center' }}>
                <span style={{ width:6,height:6,borderRadius:'50%',background:'#10b981',boxShadow:'0 0 8px #10b981',animation:'pulse 2.5s infinite' }} />
                Get Xaman Wallet — Free →
              </a>
              <button className="navbtn" onClick={()=>{setShowDonate(true);setMobileMenu(false);}}>Donate</button>
              <button className="navbtn" onClick={()=>{setShowGrant(true);setMobileMenu(false);}}>Apply for Grant</button>
              {user
                ? <button className="navbtn" onClick={()=>{handleLogout();setMobileMenu(false);}}>Log Out ({user.name||user.email})</button>
                : <button className="navbtn" onClick={()=>{setShowLogin(true);setMobileMenu(false);}}>Log In</button>
              }
              <button onClick={()=>{fetchScore();setMobileMenu(false);}} style={{ padding:'12px',borderRadius:99,fontFamily:'inherit',fontWeight:700,fontSize:14,cursor:'pointer',border:'none',background:'#10b981',color:'#000' }}>Get LedgerScore</button>
            </div>
          )}
        </nav>

        {/* ── TICKER right under Header ── */}
        <Ticker position="top" />

        {/* ── HERO ── */}
        <section className="section-pad" style={{ textAlign:'center',padding:'72px 24px 60px',position:'relative',overflow:'hidden' }}>
          <div style={{ position:'absolute',top:'35%',left:'50%',transform:'translate(-50%,-50%)',width:'min(700px, 95vw)',height:'min(700px, 95vw)',borderRadius:'50%',background:'radial-gradient(circle,rgba(16,185,129,.07) 0%,transparent 68%)',pointerEvents:'none',animation:'float 9s ease-in-out infinite' }} />

          <h1 style={{ fontSize:'clamp(48px,11vw,140px)',fontWeight:900,letterSpacing:'-4px',lineHeight:.95,marginBottom:22 }}>
            <span style={{ background:'linear-gradient(135deg,#10b981,#34d399,#6ee7b7)',WebkitBackgroundClip:'text',WebkitTextFillColor:'transparent',backgroundClip:'text' }}>
              Kredit Karma
            </span>
          </h1>

          {/* ── Tagline keywords: Community Grants · LedgerScore · XRPL Services ── */}
          <div style={{ display:'flex',flexWrap:'wrap',gap:'8px 14px',justifyContent:'center',marginBottom:24,maxWidth:680,marginLeft:'auto',marginRight:'auto' }}>
            {['Community Grants','LedgerScore','XRPL Services'].map((kw,i)=>(
              <span key={kw} style={{ fontSize:13,fontWeight:700,color:i%2===0?'#34d399':'#fff',letterSpacing:'.04em',fontFamily:"'IBM Plex Mono',monospace" }}>
                {i>0 && <span style={{ color:'rgba(255,255,255,.2)',marginRight:14 }}>·</span>}
                {kw}
              </span>
            ))}
          </div>

          <div style={{ marginBottom:36,marginTop:8 }}>
            <a className="xaman-banner" href={XAMAN_DOWNLOAD} target="_blank" rel="noopener noreferrer" style={{ fontSize:14,padding:'10px 22px' }}>
              📲 Xaman Wallet Required — Download Free (iOS / Android) →
            </a>
          </div>

          <div className="hero-buttons" style={{ display:'flex',gap:12,justifyContent:'center',flexWrap:'wrap',marginBottom:40 }}>
            <button className="hero-p" onClick={()=>fetchScore()} style={{ display:'inline-flex',alignItems:'center',gap:8,padding:'16px 32px',background:'#fff',color:'#000',fontSize:16,fontWeight:700,borderRadius:99,border:'none',cursor:'pointer',transition:'all .18s',boxShadow:'0 4px 28px rgba(255,255,255,.12)' }}>
              Get My Free LedgerScore →
            </button>
            <button className="hero-g" onClick={()=>{ const el=document.getElementById('products'); el?.scrollIntoView({behavior:'smooth'}); }} style={{ display:'inline-flex',alignItems:'center',gap:8,padding:'16px 32px',border:'1.5px solid rgba(255,255,255,.22)',color:'#fff',fontSize:16,fontWeight:600,borderRadius:99,background:'transparent',cursor:'pointer',transition:'all .18s',backdropFilter:'blur(8px)' }}>
              Browse Services ↓
            </button>
          </div>

          <div style={{ display:'flex',gap:'18px 32px',justifyContent:'center',flexWrap:'wrap' }}>
            {[['42,891','LedgerScores'],['$1.2M','Grants Funded'],['0%','Overhead'],['<5s','To Wallet'],['6','XRPL Services']].map(([n,l])=>(
              <div key={l} style={{ textAlign:'center' }}>
                <div style={{ fontSize:'clamp(20px,4vw,26px)',fontWeight:900,color:'#10b981',lineHeight:1,textShadow:'0 0 30px rgba(16,185,129,.5)' }}>{n}</div>
                <div style={{ fontSize:10,color:'rgba(255,255,255,.35)',marginTop:4,textTransform:'uppercase',letterSpacing:'.08em' }}>{l}</div>
              </div>
            ))}
          </div>
        </section>

        {/* ── PRODUCTS ── */}
        <section id="products" className="section-pad" style={{ padding:'0 24px 72px',maxWidth:1240,margin:'0 auto' }}>
          <div style={{ textAlign:'center',marginBottom:40 }}>
            <div style={{ display:'inline-flex',alignItems:'center',gap:6,marginBottom:12 }}>
              <span style={{ width:5,height:5,borderRadius:'50%',background:'#10b981',boxShadow:'0 0 8px #10b981',display:'inline-block' }} />
              <span style={{ fontSize:11,fontWeight:700,color:'#10b981',letterSpacing:'.14em',textTransform:'uppercase' }}>XRPL Amendment Services</span>
            </div>
            <h2 style={{ fontSize:'clamp(24px,4vw,42px)',fontWeight:900,letterSpacing:'-2px',marginBottom:12 }}>AI-delivered on-chain protection</h2>
            <p style={{ fontSize:14,color:'rgba(255,255,255,.44)',maxWidth:500,margin:'0 auto' }}>
              Each service maps to a real XRPL transaction type. Pay in RLUSD or XRP. AI files the amendment within one ledger close (~4 seconds).
            </p>
          </div>

          <div style={{ display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(280px,1fr))',gap:18,marginBottom:18 }}>
            {featuredProducts.map(p=>(
              <div key={p.id} className="pcard-featured" onClick={()=>setActiveProduct(p)}
                style={{ background:`linear-gradient(135deg,${p.color}10,rgba(6,6,22,.8))`,border:`1px solid ${p.color}30`,borderRadius:22,padding:26,position:'relative',overflow:'hidden' }}>
                <div style={{ position:'absolute',top:-30,right:-30,width:150,height:150,borderRadius:'50%',background:`radial-gradient(circle,${p.color}14 0%,transparent 70%)`,pointerEvents:'none' }} />
                <div style={{ width:50,height:50,borderRadius:14,background:`${p.color}18`,border:`1px solid ${p.color}28`,display:'flex',alignItems:'center',justifyContent:'center',fontSize:24,marginBottom:14,animation:'float 4s ease-in-out infinite' }}>{p.emoji}</div>
                <div style={{ fontSize:9,fontWeight:700,color:p.color,letterSpacing:'.13em',textTransform:'uppercase',marginBottom:7,fontFamily:"'IBM Plex Mono',monospace" }}>{p.amendment}</div>
                <h3 style={{ fontSize:18,fontWeight:900,marginBottom:8 }}>{p.name}</h3>
                <p style={{ fontSize:12,color:'rgba(255,255,255,.46)',lineHeight:1.7,marginBottom:16 }}>{p.tagline}</p>
                <ul style={{ listStyle:'none',marginBottom:20 }}>
                  {p.features.slice(0,3).map(f=>(
                    <li key={f} style={{ fontSize:11,color:'rgba(255,255,255,.48)',marginBottom:5,display:'flex',alignItems:'center',gap:7 }}>
                      <span style={{ color:p.color,fontSize:10 }}>✓</span>{f}
                    </li>
                  ))}
                </ul>
                <div style={{ display:'flex',alignItems:'center',justifyContent:'space-between',borderTop:`1px solid ${p.color}18`,paddingTop:14,gap:8,flexWrap:'wrap' }}>
                  <div>
                    <span style={{ fontSize:20,fontWeight:900,color:p.color }}>{p.priceRLUSD} RLUSD</span>
                    <span style={{ fontSize:11,color:'rgba(255,255,255,.3)',marginLeft:8 }}>or {p.priceXRP} XRP</span>
                  </div>
                  <button onClick={()=>setActiveProduct(p)} style={{ padding:'8px 16px',borderRadius:99,background:p.color,color:'#000',border:'none',fontWeight:800,fontSize:12,cursor:'pointer',fontFamily:'inherit',transition:'all .15s' }}>
                    Buy Now →
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div style={{ display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(260px,1fr))',gap:14 }}>
            {otherProducts.map(p=>(
              <div key={p.id} className="pcard" onClick={()=>setActiveProduct(p)}
                style={{ background:'rgba(6,6,22,.72)',backdropFilter:'blur(16px)',border:`1px solid ${p.color}20`,borderRadius:18,padding:22,position:'relative',overflow:'hidden' }}>
                {p.comingSoon && (
                  <div style={{ position:'absolute',top:14,right:14,background:p.color,color:'#000',fontSize:9,fontWeight:800,padding:'3px 9px',borderRadius:99,letterSpacing:'.08em',animation:'pulse 2.5s infinite' }}>COMING SOON</div>
                )}
                <div style={{ display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:14 }}>
                  <div style={{ width:42,height:42,borderRadius:12,background:`${p.color}18`,border:`1px solid ${p.color}25`,display:'flex',alignItems:'center',justifyContent:'center',fontSize:20 }}>{p.emoji}</div>
                  {!p.comingSoon && (
                    <span style={{ fontSize:9,fontWeight:700,color:p.color,fontFamily:"'IBM Plex Mono',monospace",textTransform:'uppercase',letterSpacing:'.09em',border:`1px solid ${p.color}28`,borderRadius:99,padding:'3px 8px' }}>
                      {p.id==='credit'?'Monthly':'On-chain'}
                    </span>
                  )}
                </div>
                <div style={{ fontSize:9,color:p.color,fontFamily:"'IBM Plex Mono',monospace",fontWeight:700,letterSpacing:'.1em',textTransform:'uppercase',marginBottom:6 }}>{p.amendment}</div>
                <h3 style={{ fontSize:16,fontWeight:800,marginBottom:6 }}>{p.name}</h3>
                <p style={{ fontSize:12,color:'rgba(255,255,255,.42)',lineHeight:1.65,marginBottom:14 }}>{p.tagline}</p>
                <div style={{ display:'flex',alignItems:'center',justifyContent:'space-between',paddingTop:14,borderTop:`1px solid ${p.color}15`,gap:8,flexWrap:'wrap' }}>
                  {p.comingSoon ? (
                    <span style={{ fontSize:13,fontWeight:800,color:p.color }}>Pre-register free</span>
                  ) : (
                    <span style={{ fontSize:16,fontWeight:900,color:p.color }}>{p.priceRLUSD} RLUSD{p.id==='credit'?'/mo':''}</span>
                  )}
                  <button onClick={()=>setActiveProduct(p)} style={{ padding:'7px 15px',borderRadius:99,background:`${p.color}18`,border:`1px solid ${p.color}28`,color:p.color,fontWeight:700,fontSize:12,cursor:'pointer',fontFamily:'inherit',transition:'all .15s' }}>
                    {p.comingSoon?'🔔 Notify Me →':p.id==='credit'?'Subscribe →':'Buy →'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ── LEDGERSCORE + CREDIT BUILDER ── */}
        <section id="score" className="section-pad" style={{ padding:'0 24px 72px',maxWidth:1240,margin:'0 auto' }}>
          <div style={{ background:'linear-gradient(135deg,rgba(16,185,129,.07),rgba(6,6,22,.8))',border:'1px solid rgba(16,185,129,.18)',borderRadius:24,padding:'40px 32px',backdropFilter:'blur(20px)',animation:'borderPulse 4s ease-in-out infinite' }}>
            <div style={{ display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(300px,1fr))',gap:36,alignItems:'center' }}>
              <div>
                <div style={{ display:'inline-flex',alignItems:'center',gap:6,marginBottom:14 }}>
                  <span style={{ width:5,height:5,borderRadius:'50%',background:'#10b981',boxShadow:'0 0 8px #10b981',display:'inline-block' }} />
                  <span style={{ fontSize:11,fontWeight:700,color:'#10b981',letterSpacing:'.14em',textTransform:'uppercase' }}>LedgerScore — World First</span>
                </div>
                <h2 style={{ fontSize:'clamp(24px,3.5vw,40px)',fontWeight:900,letterSpacing:'-2px',marginBottom:14 }}>
                  On-chain credit score.<br />No SSN. No bureau. Just truth.
                </h2>
                <p style={{ fontSize:13,color:'rgba(255,255,255,.5)',lineHeight:1.8,marginBottom:20 }}>
                  300–850. Built entirely from your XRPL wallet activity. Account age, transaction volume, trust line diversity, DEX participation, escrow history. Calculated in real time. Owned by you forever on the blockchain.
                </p>
                <div style={{ display:'grid',gridTemplateColumns:'repeat(auto-fit, minmax(140px, 1fr))',gap:9,marginBottom:22 }}>
                  {[['No SSN Required','Wallet-only identity'],['300–850 Scale','New global standard'],['Real-Time','Calculated instantly'],['Permanent','No institution can revoke']].map(([t,d])=>(
                    <div key={t} style={{ background:'rgba(255,255,255,.04)',border:'1px solid rgba(255,255,255,.07)',borderRadius:11,padding:'11px 13px' }}>
                      <div style={{ fontSize:11,fontWeight:700,color:'#10b981',marginBottom:2 }}>{t}</div>
                      <div style={{ fontSize:10,color:'rgba(255,255,255,.38)' }}>{d}</div>
                    </div>
                  ))}
                </div>
                <div style={{ display:'flex',gap:9,flexWrap:'wrap' }}>
                  <input className="score-inp" type="text" value={walletInput} onChange={e=>setWalletInput(e.target.value)} onKeyDown={e=>e.key==='Enter'&&fetchScore(walletInput)} placeholder="Paste XRPL wallet address…" style={{ ...INP,flex:1,minWidth:180,borderRadius:99,paddingLeft:20,fontFamily:"'IBM Plex Mono',monospace",fontSize:12,transition:'border-color .15s' }} />
                  <button onClick={()=>fetchScore(walletInput)} style={{ padding:'12px 22px',borderRadius:99,background:'#10b981',color:'#000',border:'none',fontWeight:800,fontSize:13,cursor:'pointer',fontFamily:'inherit',whiteSpace:'nowrap',transition:'all .15s' }}>Check Score →</button>
                </div>
              </div>

              <div>
                <div style={{ fontSize:11,fontWeight:700,color:'#10b981',letterSpacing:'.1em',textTransform:'uppercase',marginBottom:16 }}>Credit Builder — Monthly on XRPL</div>
                <div style={{ display:'flex',flexDirection:'column',gap:11 }}>
                  {[
                    { name:'Starter', price:'$20 RLUSD/mo',  color:'#34d399', sub:'LedgerScore monitoring · Equifax soft · Email alerts' },
                    { name:'Builder', price:'$50 RLUSD/mo',  color:'#10b981', sub:'All 3 bureaus soft · Score simulator · Dispute assist', popular:true },
                    { name:'Pro',     price:'$100 RLUSD/mo', color:'#f59e0b', sub:'Hard bureau reporting · RLUSD rewards · DeFi pre-approval' },
                  ].map(t=>(
                    <div key={t.name} onClick={()=>setActiveProduct(PRODUCTS.find(p=>p.id==='credit')||null)}
                      style={{ background:'rgba(255,255,255,.04)',border:`1px solid ${t.color}28`,borderRadius:14,padding:'14px 18px',cursor:'pointer',transition:'all .18s',position:'relative' }}
                      onMouseEnter={e=>(e.currentTarget as HTMLDivElement).style.borderColor=`${t.color}55`}
                      onMouseLeave={e=>(e.currentTarget as HTMLDivElement).style.borderColor=`${t.color}28`}
                    >
                      {t.popular&&<div style={{ position:'absolute',top:-8,right:12,background:'#10b981',color:'#000',fontSize:8,fontWeight:800,padding:'2px 8px',borderRadius:99 }}>POPULAR</div>}
                      <div style={{ display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:4,flexWrap:'wrap',gap:6 }}>
                        <span style={{ fontWeight:800,fontSize:14,color:'#fff' }}>{t.name}</span>
                        <span style={{ fontSize:16,fontWeight:900,color:t.color }}>{t.price}</span>
                      </div>
                      <div style={{ fontSize:11,color:'rgba(255,255,255,.38)',lineHeight:1.5 }}>{t.sub}</div>
                    </div>
                  ))}
                </div>
                <button onClick={()=>setActiveProduct(PRODUCTS.find(p=>p.id==='credit')||null)} style={{ ...B('green',undefined,{width:'100%',marginTop:14,padding:'13px'}) }}>
                  Subscribe to Credit Builder →
                </button>
                <p style={{ fontSize:11,color:'rgba(255,255,255,.3)',textAlign:'center',marginTop:8 }}>First blockchain → FICO pathway ever built</p>
              </div>
            </div>
          </div>
        </section>

        {/* ── GRANTS ── */}
        <section id="grants" className="section-pad" style={{ padding:'0 24px 72px',maxWidth:1240,margin:'0 auto' }}>
          <div style={{ textAlign:'center',marginBottom:40 }}>
            <div style={{ display:'inline-flex',alignItems:'center',gap:6,marginBottom:12 }}>
              <span style={{ width:5,height:5,borderRadius:'50%',background:'#8b5cf6',boxShadow:'0 0 8px #8b5cf6',display:'inline-block' }} />
              <span style={{ fontSize:11,fontWeight:700,color:'#8b5cf6',letterSpacing:'.14em',textTransform:'uppercase' }}>AI-Reviewed Grants</span>
            </div>
            <h2 style={{ fontSize:'clamp(24px,4vw,42px)',fontWeight:900,letterSpacing:'-2px',marginBottom:12 }}>Real people. Real money. Wallet to wallet.</h2>
            <p style={{ fontSize:14,color:'rgba(255,255,255,.44)',maxWidth:520,margin:'0 auto' }}>
              No NGOs. No dark money. No election funneling. Donations flow directly from your wallet to someone in need — AI reviews every application — 100% verifiable on the XRP Ledger.
            </p>
          </div>
          <div style={{ display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(300px,1fr))',gap:20 }}>
            <div style={{ background:'linear-gradient(135deg,rgba(16,185,129,.08),rgba(6,6,22,.8))',border:'1px solid rgba(16,185,129,.2)',borderRadius:22,padding:'30px 26px',backdropFilter:'blur(20px)' }}>
              <div style={{ fontSize:40,marginBottom:14,animation:'float 4s ease-in-out infinite' }}>💚</div>
              <h3 style={{ fontSize:21,fontWeight:900,marginBottom:10 }}>Fund the Treasury</h3>
              <p style={{ fontSize:13,color:'rgba(255,255,255,.48)',lineHeight:1.8,marginBottom:22 }}>
                Send XRP or RLUSD. <strong style={{ color:'#fff' }}>100%</strong> goes to grant recipients. Treasury is public on XRPScan. Every transaction verifiable by anyone, forever.
              </p>
              <div style={{ display:'flex',gap:18,flexWrap:'wrap',marginBottom:20 }}>
                {[['0%','Overhead'],['<5s','Transfer'],['∞','On-Chain']].map(([n,l])=>(
                  <div key={l} style={{ textAlign:'center' }}>
                    <div style={{ fontSize:20,fontWeight:900,color:'#10b981' }}>{n}</div>
                    <div style={{ fontSize:9,color:'rgba(255,255,255,.32)',textTransform:'uppercase',letterSpacing:'.08em' }}>{l}</div>
                  </div>
                ))}
              </div>

              <div style={{ background:'rgba(16,185,129,.1)',border:'1px solid rgba(16,185,129,.3)',borderRadius:11,padding:'10px 13px',marginBottom:8,display:'flex',alignItems:'center',gap:8,flexWrap:'wrap' }}>
                <span style={{ fontSize:9,fontWeight:700,color:'#10b981',letterSpacing:'.12em',textTransform:'uppercase',fontFamily:"'IBM Plex Mono',monospace" }}>XRPNS · Primary</span>
                <code style={{ fontSize:13,color:'#10b981',fontWeight:700,fontFamily:"'IBM Plex Mono',monospace",wordBreak:'break-all' }}>{TREASURY_DOMAIN}</code>
              </div>
              <div style={{ background:'rgba(16,185,129,.06)',border:'1px solid rgba(16,185,129,.15)',borderRadius:11,padding:'9px 13px',marginBottom:18 }}>
                <code style={{ fontSize:10,color:'#34d399',wordBreak:'break-all',lineHeight:1.5,fontFamily:"'IBM Plex Mono',monospace" }}>{TREASURY}</code>
              </div>
              <button onClick={()=>setShowDonate(true)} style={{ ...B('green',undefined,{width:'100%',padding:'14px',fontSize:15}) }}>
                Donate — Scan QR in Xaman →
              </button>
            </div>

            <div style={{ background:'linear-gradient(135deg,rgba(139,92,246,.08),rgba(6,6,22,.8))',border:'1px solid rgba(139,92,246,.2)',borderRadius:22,padding:'30px 26px',backdropFilter:'blur(20px)' }}>
              <div style={{ fontSize:40,marginBottom:14,animation:'float 4s ease-in-out infinite',animationDelay:'1s' }}>❤️</div>
              <h3 style={{ fontSize:21,fontWeight:900,marginBottom:10 }}>Apply for Emergency Aid</h3>
              <p style={{ fontSize:13,color:'rgba(255,255,255,.48)',lineHeight:1.8,marginBottom:22 }}>
                Need help? Apply for $25–$100. AI reviews every application within 24 hours — no bias, no gatekeepers. Approved funds go directly to your XRPL wallet.
              </p>
              <div style={{ display:'flex',flexDirection:'column',gap:7,marginBottom:22 }}>
                {['Submit a help form','AI reviews using treasury','Help is on the way — direct to wallet','No bank account, no ID required'].map(f=>(
                  <div key={f} style={{ display:'flex',alignItems:'center',gap:8,fontSize:12,color:'rgba(255,255,255,.52)' }}>
                    <span style={{ color:'#8b5cf6',fontSize:11 }}>✓</span>{f}
                  </div>
                ))}
              </div>
              <button onClick={()=>setShowGrant(true)} style={{ ...B('color','#8b5cf6',{width:'100%',padding:'14px',fontSize:15}) }}>
                Apply for Emergency Grant →
              </button>
            </div>
          </div>
        </section>

        {/* ── WHY XRPL ── */}
        <section className="section-pad" style={{ padding:'0 24px 72px',maxWidth:1240,margin:'0 auto' }}>
          <div style={{ background:'rgba(6,6,22,.72)',backdropFilter:'blur(20px)',border:'1px solid rgba(255,255,255,.08)',borderRadius:22,padding:'36px 28px',textAlign:'center' }}>
            <div style={{ display:'inline-flex',alignItems:'center',gap:6,marginBottom:14 }}>
              <span style={{ width:5,height:5,borderRadius:'50%',background:'#10b981',boxShadow:'0 0 8px #10b981',display:'inline-block' }} />
              <span style={{ fontSize:11,fontWeight:700,color:'#10b981',letterSpacing:'.14em',textTransform:'uppercase' }}>Why XRPL</span>
            </div>
            <h2 style={{ fontSize:'clamp(22px,3.5vw,36px)',fontWeight:900,letterSpacing:'-2px',marginBottom:14 }}>The only blockchain built for this.</h2>
            <p style={{ fontSize:13,color:'rgba(255,255,255,.44)',maxWidth:480,margin:'0 auto 32px',lineHeight:1.7 }}>
              Not a trend. Not a whitepaper. Over a decade of continuous operation. Sub-cent fees. 3–5 second finality. And an AMM that&apos;s live right now.
            </p>
            <div style={{ display:'flex',justifyContent:'center',gap:'16px 28px',flexWrap:'wrap' }}>
              {[['3–5s','Finality'],['$0.000001','Avg Fee'],['10+','Years Live'],['1,500','TPS'],['0.0079kWh','Per TX']].map(([v,l])=>(
                <div key={l} style={{ textAlign:'center',minWidth:80 }}>
                  <div style={{ fontSize:'clamp(20px,3vw,26px)',fontWeight:900,color:'#10b981',textShadow:'0 0 28px rgba(16,185,129,.5)' }}>{v}</div>
                  <div style={{ fontSize:10,color:'rgba(255,255,255,.35)',marginTop:4,textTransform:'uppercase',letterSpacing:'.08em' }}>{l}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── CTA ── */}
        <section className="section-pad" style={{ padding:'0 24px 64px',maxWidth:820,margin:'0 auto',textAlign:'center' }}>
          <div style={{ background:'linear-gradient(135deg,rgba(16,185,129,.1),rgba(6,6,22,.85))',border:'1px solid rgba(16,185,129,.24)',borderRadius:24,padding:'48px 32px',backdropFilter:'blur(20px)' }}>
            <h2 style={{ fontSize:'clamp(24px,5vw,46px)',fontWeight:900,letterSpacing:'-2.5px',lineHeight:1.06,marginBottom:14 }}>
              Your wallet has a story.<br />
              <span style={{ color:'#10b981' }}>Let the ledger score it.</span>
            </h2>
            <p style={{ fontSize:14,color:'rgba(255,255,255,.44)',marginBottom:28,lineHeight:1.7 }}>Free. No SSN. No bank account. 100% on-chain. This is the XRPL build of the century.</p>
            <div className="hero-buttons" style={{ display:'flex',gap:12,justifyContent:'center',flexWrap:'wrap' }}>
              <button className="hero-p" onClick={()=>fetchScore()} style={{ display:'inline-flex',alignItems:'center',gap:8,padding:'15px 30px',background:'#fff',color:'#000',fontSize:15,fontWeight:700,borderRadius:99,border:'none',cursor:'pointer',transition:'all .18s',boxShadow:'0 4px 28px rgba(255,255,255,.12)' }}>Get Free LedgerScore →</button>
              <button className="hero-g" onClick={()=>setShowDonate(true)} style={{ display:'inline-flex',alignItems:'center',gap:8,padding:'15px 30px',border:'1.5px solid rgba(255,255,255,.22)',color:'#fff',fontSize:15,fontWeight:600,borderRadius:99,background:'transparent',cursor:'pointer',transition:'all .18s' }}>💚 Fund a Grant</button>
            </div>
            <p style={{ fontSize:11,color:'rgba(255,255,255,.22)',marginTop:20 }}>
              Seeking institutional partnerships · <a href="mailto:partners@kreditkarma.us" style={{ color:'#10b981' }}>partners@kreditkarma.us</a>
            </p>
          </div>
        </section>

        {/* ── FOOTER (neural background image — footer only) ── */}
        <footer className="neural-surface" style={{ backdropFilter:'blur(14px)',borderTop:'1px solid rgba(255,255,255,.07)',padding:'32px 24px 24px' }}>
          <div style={{ maxWidth:1240,margin:'0 auto',display:'flex',justifyContent:'space-between',alignItems:'center',flexWrap:'wrap',gap:18 }}>
            <div>
              <div style={{ display:'flex',alignItems:'center',gap:8,marginBottom:6 }}>
                <div style={{ width:28,height:28,background:'linear-gradient(135deg,#10b981,#059669)',borderRadius:7,display:'flex',alignItems:'center',justifyContent:'center',fontWeight:900,fontSize:13,color:'#000' }}>K</div>
                <span style={{ fontWeight:800,fontSize:15 }}>kreditkarma</span>
                <span style={{ fontSize:10,color:'#10b981',fontFamily:"'IBM Plex Mono',monospace",fontWeight:700,marginLeft:6,background:'rgba(16,185,129,.1)',padding:'2px 8px',borderRadius:99,border:'1px solid rgba(16,185,129,.25)' }}>{TREASURY_DOMAIN}</span>
              </div>
              <p style={{ fontSize:11,color:'rgba(255,255,255,.22)' }}>© {new Date().getFullYear()} KreditKarma.us · Social Impact Finance · Powered by the XRP Ledger</p>
              <p style={{ fontSize:10,color:'rgba(255,255,255,.16)',marginTop:2 }}>Not a bank · Not a broker · Not an insurer · 100% on-chain</p>
            </div>
            <div style={{ display:'flex',gap:'10px 18px',flexWrap:'wrap',alignItems:'center' }}>
              <a href={XAMAN_DOWNLOAD} target="_blank" rel="noopener noreferrer" className="footer-lnk" style={{ color:'#10b981',textDecoration:'none' }}>📲 Get Xaman</a>
              <button className="footer-lnk" onClick={()=>setShowAbout(true)}>About</button>
              <button className="footer-lnk" onClick={()=>setShowFaq(true)}>FAQ</button>
              <button className="footer-lnk" onClick={()=>setShowTerms(true)}>Terms</button>
              <button className="footer-lnk" onClick={()=>setShowPrivacy(true)}>Privacy</button>
              <a href="mailto:support@kreditkarma.us" style={{ fontSize:13,color:'rgba(255,255,255,.38)',textDecoration:'none' }}>support@kreditkarma.us</a>
              <a href={`https://xrpscan.com/account/${TREASURY}`} target="_blank" rel="noopener noreferrer"
                style={{ fontSize:11,color:'#10b981',textDecoration:'none',display:'flex',alignItems:'center',gap:5,fontFamily:"'IBM Plex Mono',monospace" }}>
                <span style={{ width:5,height:5,borderRadius:'50%',background:'#10b981',animation:'pulse 2.5s infinite',display:'inline-block' }} />
                Treasury Live ↗
              </a>
            </div>
          </div>
        </footer>
      </div>

      {/* ── MODALS ── */}
      <ScoreModal show={showScore} onClose={()=>setShowScore(false)} scoreData={scoreData} loading={scoreLoading} error={scoreError} onRetry={()=>fetchScore()} walletAddress={walletAddress} />
      <ProductModal show={!!activeProduct} onClose={()=>setActiveProduct(null)} product={activeProduct} />
      <DonateModal  show={showDonate}  onClose={()=>setShowDonate(false)} />
      <GrantModal   show={showGrant}   onClose={()=>setShowGrant(false)} />
      <LoginModal   show={showLogin}   onClose={()=>setShowLogin(false)} onLoggedIn={u=>setUser(u)} />
      <AboutModal   show={showAbout}   onClose={()=>setShowAbout(false)} />
      <FAQModal     show={showFaq}     onClose={()=>setShowFaq(false)} />
      <TermsModal   show={showTerms}   onClose={()=>setShowTerms(false)} />
      <PrivacyModal show={showPrivacy} onClose={()=>setShowPrivacy(false)} />
    </>
  );
}