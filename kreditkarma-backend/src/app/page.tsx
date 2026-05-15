'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Analytics } from '@vercel/analytics/next';

// ─── CONFIG ───────────────────────────────────────────────────────────────────
const API_URL         = (typeof process !== 'undefined' && process.env?.NEXT_PUBLIC_API_URL) || '';
const TREASURY        = 'rs59g3amo5iT6T64Cg96XXMAWuw3WPQcLF';
const TREASURY_DOMAIN = 'kreditkarma.xrp';
const XAMAN_DL        = 'https://xaman.app/';
const NEURAL_BG       = '/xrpl-background.jpg';

type Currency = 'RLUSD' | 'XRP';
const fmt  = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
const trunc = (a: string) => a ? `${a.slice(0, 6)}…${a.slice(-4)}` : '';
const qrImg = (d: string, sz = 200) =>
  `https://api.qrserver.com/v1/create-qr-code/?size=${sz}x${sz}&data=${encodeURIComponent(d)}&color=0d9488&bgcolor=030407&qzone=2&format=svg`;

// ─── TICKER ───────────────────────────────────────────────────────────────────
const TICKER = [
  'Homeless — Apply for Grants', 'Build Real Credit', 'Protect Your Assets',
  'Transparent AI Community Grants', 'Buy Powerful XRPL Amendments',
  'Turn XRP / RLUSD Into Credit', 'Blockchain LedgerScore',
  'Every Donation Uses AI To Send Help',
  'Donations → Treasury → Apply for Grants → AI → Help Is On The Way',
  'Borrow / Lend XRPL Amendment Coming Soon',
];

// ─── 10 PRODUCTS ──────────────────────────────────────────────────────────────
const PRODUCTS = [
  { id:'clawback',  emoji:'🔒', name:'Clawback Shield',    featured:true,  comingSoon:false, color:'#10b981', priceRLUSD:25,  priceXRP:80,
    amendment:'SetAccountFlag · asfNoFreeze', tagline:'Permanently block issuers from reclaiming your tokens',
    desc:'AI broadcasts a SetAccountFlag (asfNoFreeze) transaction on your behalf. Permanently prevents any issuer from freezing or clawing back assets in your trust lines.',
    aiDetail:"AI submits SetAccountFlag with asfNoFreeze flag to XRPL mainnet. Permanently recorded on your account root. Clawback is cryptographically impossible.",
    features:['asfNoFreeze flag set on-chain','Issuer clawback permanently disabled','On-chain proof','Xaman notification','Email receipt + TX hash'] },

  { id:'escrow',    emoji:'🏛️', name:'Escrow Vault',        featured:true,  comingSoon:false, color:'#f59e0b', priceRLUSD:50,  priceXRP:160,
    amendment:'EscrowCreate · Time-locked', tagline:'AI-managed escrow with custom release conditions',
    desc:'AI files EscrowCreate locking your XRP with a custom finish-after timestamp or crypto-condition. Funds release automatically on your terms.',
    aiDetail:'AI constructs EscrowCreate with your FinishAfter epoch. Filed to XRPL mainnet and monitored continuously. AI auto-files EscrowFinish or EscrowCancel at the right time.',
    features:['EscrowCreate filed to mainnet','Custom release conditions','AI monitors + auto-finalises','EscrowCancel protection','Full audit trail'] },

  { id:'mutual',    emoji:'🤝', name:'Mutual Aid Pool',     featured:true,  comingSoon:false, color:'#8b5cf6', priceRLUSD:35,  priceXRP:115,
    amendment:'TrustSet · MultiSig Registry', tagline:'On-chain mutual aid certificate — no insurance company',
    desc:'AI issues a TrustSet coverage certificate to your wallet and adds you to the KreditKarma multisig pool registry. Pool disbursements AI-triggered.',
    aiDetail:'AI files TrustSet issuing KK-COVERAGE trust line to your wallet. Added to multisig pool registry. Pool balance visible on xrpscan.com.',
    features:['TrustSet certificate issued','Added to multisig pool registry','AI-triggered disbursement','Pool visible on XRPScan','Email + wallet proof'] },

  { id:'multisig',  emoji:'🏰', name:'Multi-Sig Fortress',  featured:false, comingSoon:false, color:'#f97316', priceRLUSD:60,  priceXRP:195,
    amendment:'SignerListSet · Multi-Signature', tagline:'Require M-of-N signatures for every transaction',
    desc:'AI files SignerListSet configuring your wallet to require multiple signatures. No single point of failure. Perfect for treasuries and DAOs.',
    aiDetail:'AI constructs SignerListSet with your quorum and signer list. Wallet now requires multiple signatures for every outgoing transaction.',
    features:['SignerListSet filed to mainnet','M-of-N signature requirement','Xaman multi-sign ready','DAO-grade security','On-chain proof'] },

  { id:'nft',       emoji:'🎨', name:'NFT Vault Lock',      featured:false, comingSoon:false, color:'#ec4899', priceRLUSD:45,  priceXRP:145,
    amendment:'NFTokenMint · Burn-locked', tagline:'Mint NFTs with protocol-level royalties up to 50%',
    desc:'AI mints your NFT with custom transfer fees and flags. Full royalty enforcement at the protocol level on every secondary sale.',
    aiDetail:'AI constructs NFTokenMint with your custom URI, transfer fee (0–50000 bps), and flags. Royalties enforced at the protocol level.',
    features:['NFTokenMint filed to mainnet','Up to 50% royalties','Custom URI + metadata','Protocol-level enforcement','Batch minting available'] },

  { id:'channel',   emoji:'⚡', name:'Payment Channel',     featured:false, comingSoon:false, color:'#06b6d4', priceRLUSD:55,  priceXRP:175,
    amendment:'PaymentChannelCreate · Streaming', tagline:'Stream instant micropayments off-ledger',
    desc:'AI creates a PaymentChannel between your wallet and a recipient. Stream thousands of micropayments off-ledger with a single settlement.',
    aiDetail:'AI constructs PaymentChannelCreate with your destination, amount, and settlement delay. Stream thousands of claims off-chain instantly.',
    features:['PaymentChannelCreate filed','Instant micropayments','Configurable settlement','Streaming payment support','Single settlement cost'] },

  { id:'identity',  emoji:'🪪', name:'On-Chain Identity',   featured:false, comingSoon:false, color:'#34d399', priceRLUSD:20,  priceXRP:65,
    amendment:'AccountSet · Domain + Email Hash', tagline:'Verify your domain and email on the XRP Ledger',
    desc:'AI files AccountSet linking your wallet to your verified domain and email hash. Every XRPL dApp can verify your identity on-chain.',
    aiDetail:'AI constructs AccountSet encoding your domain (hex) and SHA-256 email hash into your account root. Verified badge on XRPL explorers.',
    features:['AccountSet domain verification','Email hash on-chain','Recognized by explorers','Builds dApp trust score','One-time setup'] },

  { id:'dex',       emoji:'📊', name:'DEX Market Maker',    featured:false, comingSoon:false, color:'#fbbf24', priceRLUSD:30,  priceXRP:95,
    amendment:'OfferCreate · Automated Orders', tagline:'AI manages limit orders on the XRPL built-in DEX',
    desc:'AI creates OfferCreate transactions placing limit orders on the XRPL DEX. No smart contracts — native protocol trading with AI management.',
    aiDetail:'AI constructs OfferCreate with your TakerPays and TakerGets. Placed directly on the XRPL DEX. AI monitors fills and rebalances.',
    features:['OfferCreate filed to XRPL DEX','Limit order support','AI monitors fills','OfferCancel on completion','No smart contract risk'] },

  { id:'amm',       emoji:'🌊', name:'DEX Liquidity Guard', featured:false, comingSoon:false, color:'#a78bfa', priceRLUSD:40,  priceXRP:130,
    amendment:'AMMWithdraw · Position Monitor', tagline:'AI auto-exits AMM positions before impermanent loss hits',
    desc:'AI watches your XRPL AMM positions. When IL exceeds your threshold or an exploit is detected, AI fires AMMWithdraw automatically.',
    aiDetail:'AI polls XRPL AMM ledger objects every 4 seconds. On IL breach, AMMWithdraw is constructed and filed within the same ledger close.',
    features:['Real-time AMM polling (4s)','IL breach auto-withdrawal','Exploit pattern detection','AMMWithdraw < 1 ledger close','On-chain action log'] },

  { id:'credit',    emoji:'📈', name:'Credit Builder',      featured:false, comingSoon:false, color:'#10b981', priceRLUSD:20,  priceXRP:65,
    amendment:'Payment · Bureau Reporting', tagline:'Build LedgerScore + FICO simultaneously',
    desc:"The world's first blockchain credit builder. Monthly on-chain payments build your LedgerScore and report to credit bureaus.",
    aiDetail:'Each monthly payment recorded on-chain with a structured memo. AI updates LedgerScore weighting and queues bureau furnishing.',
    isMonthly: true,
    tiers:[
      { name:'Starter', priceRLUSD:20,  priceXRP:65,  color:'#34d399', perks:'LedgerScore monitoring · Equifax soft · Email alerts' },
      { name:'Builder', priceRLUSD:50,  priceXRP:165, color:'#10b981', perks:'All 3 bureaus soft · Score simulator · Dispute assist' },
      { name:'Pro',     priceRLUSD:100, priceXRP:330, color:'#f59e0b', perks:'Hard bureau reporting · RLUSD rewards · DeFi pre-approval' },
    ],
    features:['Monthly payment on-chain','LedgerScore updated each cycle','Bureau furnishing (Starter → Pro)','RLUSD rewards on Pro','First blockchain-to-FICO pathway'] },

  { id:'borrowlend', emoji:'🔁', name:'XRPL Borrow / Lend', featured:false, comingSoon:true,  color:'#ec4899', priceRLUSD:0, priceXRP:0,
    amendment:'Lending Protocol · Coming Soon', tagline:'Native on-chain borrowing & lending',
    desc:'The XRPL Borrow/Lend amendment is coming to mainnet. KreditKarma will offer borrow-against-LedgerScore on day one.',
    aiDetail:'Once the XRPL Borrow/Lend amendment activates, AI indexes your LedgerScore as on-chain collateral. Borrow against your reputation. Lend to earn.',
    features:['Borrow against LedgerScore','Lend RLUSD/XRP for yield','No banks · No KYC','Native XRPL amendment','Pre-register early access'] },
] as const;

type Product = typeof PRODUCTS[number];
interface ScoreData { ledgerScore: number; grade?: string; details?: { txCount?: number; accountAge?: number; balanceXRP?: number; trustLines?: number; hasOffers?: boolean; hasAMM?: boolean }; scannedAt?: string }
interface User { email: string; name: string }

function gradeScore(n: number) {
  if (n >= 800) return { label:'Exceptional', color:'#10b981', glow:'rgba(16,185,129,.55)' };
  if (n >= 740) return { label:'Excellent',   color:'#34d399', glow:'rgba(52,211,153,.5)'  };
  if (n >= 670) return { label:'Good',         color:'#fbbf24', glow:'rgba(251,191,36,.5)'  };
  if (n >= 580) return { label:'Fair',          color:'#f97316', glow:'rgba(249,115,22,.5)'  };
  return              { label:'Building',       color:'#ef4444', glow:'rgba(239,68,68,.5)'   };
}

// ─── STYLE HELPERS ────────────────────────────────────────────────────────────
const GLASS: React.CSSProperties = { background:'rgba(6,6,22,.72)', backdropFilter:'blur(22px)', WebkitBackdropFilter:'blur(22px)', border:'1px solid rgba(255,255,255,.09)' };
const INP: React.CSSProperties   = { width:'100%', background:'rgba(255,255,255,.07)', border:'1px solid rgba(255,255,255,.13)', borderRadius:12, padding:'12px 15px', fontSize:14, color:'#fff', outline:'none', fontFamily:'inherit', boxSizing:'border-box', transition:'border-color .15s' };
const LBL: React.CSSProperties   = { display:'block', fontSize:10, fontWeight:700, color:'rgba(255,255,255,.32)', textTransform:'uppercase', letterSpacing:'.1em', marginBottom:6 };

function Btn(v: 'green'|'ghost'|'color', color?: string, extra?: React.CSSProperties): React.CSSProperties {
  const base: React.CSSProperties = { display:'inline-flex', alignItems:'center', justifyContent:'center', gap:7, border:'none', borderRadius:99, fontWeight:700, fontSize:14, cursor:'pointer', fontFamily:'inherit', padding:'12px 26px', transition:'all .18s', ...extra };
  if (v === 'green') return { ...base, background:'#10b981', color:'#000' };
  if (v === 'color') return { ...base, background:color||'#10b981', color:'#000' };
  return { ...base, background:'rgba(255,255,255,.08)', color:'#fff', border:'1px solid rgba(255,255,255,.14)' };
}

// ─── TICKER BAR ───────────────────────────────────────────────────────────────
function TickerBar() {
  const r = [...TICKER, ...TICKER];
  return (
    <div style={{ overflow:'hidden', width:'100%', background:'linear-gradient(90deg,rgba(16,185,129,.10),rgba(139,92,246,.07),rgba(16,185,129,.10))', borderBottom:'1px solid rgba(16,185,129,.22)', backdropFilter:'blur(10px)', zIndex:50 }}>
      <div className="ticker-track" style={{ display:'inline-flex', whiteSpace:'nowrap', padding:'10px 0', animation:'tickerScroll 60s linear infinite', willChange:'transform' }}>
        {r.map((m, i) => (
          <span key={`${m}-${i}`} style={{ display:'inline-flex', alignItems:'center', gap:12, padding:'0 22px', fontSize:12, fontWeight:700, letterSpacing:'.06em', color:'#fff', fontFamily:"'IBM Plex Mono',monospace", textTransform:'uppercase' }}>
            <span style={{ width:6, height:6, borderRadius:'50%', background:'#10b981', boxShadow:'0 0 10px #10b981', animation:'pulse 1.6s infinite', flexShrink:0 }} />
            <span className="ticker-strobe">{m}</span>
          </span>
        ))}
      </div>
    </div>
  );
}

// ─── OVERLAY ──────────────────────────────────────────────────────────────────
function Overlay({ show, onClose, children, wide=false }: { show:boolean; onClose:()=>void; children:React.ReactNode; wide?:boolean }) {
  useEffect(() => {
    if (!show) return;
    document.body.style.overflow = 'hidden';
    const fn = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', fn);
    return () => { window.removeEventListener('keydown', fn); document.body.style.overflow = ''; };
  }, [show, onClose]);
  if (!show) return null;
  return (
    <div onClick={onClose} style={{ position:'fixed', inset:0, zIndex:1000, background:'rgba(0,0,0,.9)', backdropFilter:'blur(14px)', display:'flex', alignItems:'center', justifyContent:'center', padding:16 }}>
      <div onClick={e => e.stopPropagation()} style={{ ...GLASS, borderRadius:26, padding:'32px 28px', width:'100%', maxWidth:wide?700:520, position:'relative', animation:'popIn .26s cubic-bezier(.34,1.56,.64,1) both', maxHeight:'90vh', overflowY:'auto', boxShadow:'0 0 80px rgba(16,185,129,.08),0 40px 100px rgba(0,0,0,.85)' }}>
        <button onClick={onClose} style={{ position:'absolute', top:16, right:16, width:32, height:32, borderRadius:'50%', background:'rgba(255,255,255,.08)', border:'none', color:'rgba(255,255,255,.6)', cursor:'pointer', fontSize:16, display:'flex', alignItems:'center', justifyContent:'center', zIndex:2 }}>✕</button>
        {children}
      </div>
    </div>
  );
}

// ─── CONNECT WALLET MODAL ─────────────────────────────────────────────────────
function ConnectWalletModal({ show, onClose, onConnected }: { show:boolean; onClose:()=>void; onConnected:(a:string)=>void }) {
  const [status, setStatus] = useState<'idle'|'creating'|'waiting'|'done'>('idle');
  const [uuid, setUuid]     = useState('');
  const [qrUrl, setQrUrl]   = useState('');
  const [deepLnk, setDeepLnk] = useState('');
  const [error, setError]   = useState('');
  const cancelRef = useRef(false);
  const pollRef   = useRef<ReturnType<typeof setTimeout>|null>(null);

  const initiate = async () => {
    setStatus('creating'); setError(''); cancelRef.current = false;
    try {
      const res  = await fetch(`${API_URL}/api/connect-wallet`, { method:'POST', headers:{'Content-Type':'application/json'}, body:'{}' });
      const data = await res.json();
      if (!res.ok || !data.uuid) throw new Error(data.error || 'Failed to create connection');
      setUuid(data.uuid); setQrUrl(data.qr_png); setDeepLnk(data.deep_link); setStatus('waiting');
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Connection failed'); setStatus('idle');
    }
  };

  useEffect(() => { if (show && status === 'idle' && !error) initiate(); }, [show]); // eslint-disable-line

  useEffect(() => {
    if (status !== 'waiting' || !uuid) return;
    cancelRef.current = false;
    const poll = async () => {
      if (cancelRef.current) return;
      try {
        const res  = await fetch(`${API_URL}/api/check-wallet?uuid=${uuid}`);
        const data = await res.json();
        if (cancelRef.current) return;
        if (data.status === 'connected' && data.address) {
          setStatus('done'); onConnected(data.address);
          setTimeout(() => handleClose(), 1200);
        } else if (data.status === 'expired') {
          setStatus('idle'); setError('Connection expired. Tap Try Again.');
        } else if (data.status === 'rejected') {
          setStatus('idle'); setError('Connection declined in Xaman.');
        } else {
          pollRef.current = setTimeout(poll, 3000);
        }
      } catch { if (!cancelRef.current) pollRef.current = setTimeout(poll, 5000); }
    };
    poll();
    return () => { cancelRef.current = true; if (pollRef.current) clearTimeout(pollRef.current); };
  }, [status, uuid]); // eslint-disable-line

  const handleClose = () => {
    cancelRef.current = true; if (pollRef.current) clearTimeout(pollRef.current);
    onClose(); setTimeout(() => { setStatus('idle'); setUuid(''); setQrUrl(''); setDeepLnk(''); setError(''); }, 300);
  };

  return (
    <Overlay show={show} onClose={handleClose}>
      <div style={{ textAlign:'center' }}>
        <div style={{ fontSize:40, marginBottom:12 }}>🔐</div>
        <h3 style={{ fontSize:22, fontWeight:900, marginBottom:6 }}>Connect Xaman Wallet</h3>
        <p style={{ fontSize:13, color:'rgba(255,255,255,.45)', marginBottom:20, lineHeight:1.6 }}>
          Prove wallet ownership with one tap.<br />No transaction sent. No funds leave your wallet.
        </p>

        {status === 'creating' && (
          <div style={{ padding:'24px 0' }}>
            <div style={{ width:50, height:50, borderRadius:'50%', background:'rgba(16,185,129,.15)', border:'2px solid rgba(16,185,129,.4)', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 14px', fontSize:22, animation:'spin 1.5s linear infinite' }}>⚡</div>
            <p style={{ color:'#10b981', fontWeight:700, fontSize:14 }}>Creating secure connection…</p>
          </div>
        )}

        {status === 'waiting' && (
          <>
            <div style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:8, background:'rgba(16,185,129,.08)', border:'1px solid rgba(16,185,129,.25)', borderRadius:12, padding:'10px 16px', marginBottom:16 }}>
              <span style={{ width:8, height:8, borderRadius:'50%', background:'#10b981', boxShadow:'0 0 12px #10b981', animation:'pulse 1.4s infinite' }} />
              <span style={{ fontSize:13, fontWeight:700, color:'#10b981' }}>Waiting for Xaman…</span>
            </div>
            <div style={{ background:'#fff', borderRadius:18, padding:14, width:210, height:210, margin:'0 auto 14px', display:'flex', alignItems:'center', justifyContent:'center', boxShadow:'0 0 30px rgba(16,185,129,.15)' }}>
              <img src={qrUrl || qrImg(`https://xumm.app/sign/${uuid}`)} alt="Scan to connect" style={{ width:'100%', height:'100%', borderRadius:8 }} />
            </div>
            <a href={deepLnk || `https://xumm.app/sign/${uuid}`} target="_blank" rel="noopener noreferrer"
              style={{ display:'inline-flex', alignItems:'center', gap:8, background:'#10b981', color:'#000', fontWeight:800, fontSize:15, padding:'14px 30px', borderRadius:99, textDecoration:'none', boxShadow:'0 4px 20px rgba(16,185,129,.35)', marginBottom:18 }}>
              📱 Open in Xaman — Connect →
            </a>
            <div style={{ textAlign:'left', background:'rgba(255,255,255,.04)', border:'1px solid rgba(255,255,255,.07)', borderRadius:14, padding:'14px 18px' }}>
              {[['1','Scan the QR or tap "Open in Xaman"'],['2','Approve the connection request'],['3','Done — wallet linked instantly']].map(([n,t]) => (
                <div key={n} style={{ display:'flex', alignItems:'flex-start', gap:12, marginBottom:n==='3'?0:10 }}>
                  <span style={{ width:22, height:22, borderRadius:'50%', background:'rgba(16,185,129,.2)', border:'1px solid rgba(16,185,129,.4)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:11, fontWeight:800, color:'#10b981', flexShrink:0 }}>{n}</span>
                  <span style={{ fontSize:13, color:'rgba(255,255,255,.6)', lineHeight:1.5, paddingTop:2 }}>{t}</span>
                </div>
              ))}
            </div>
          </>
        )}

        {status === 'done' && (
          <div style={{ padding:'20px 0' }}>
            <div style={{ fontSize:50, marginBottom:10 }}>✅</div>
            <p style={{ color:'#10b981', fontWeight:800, fontSize:18 }}>Wallet Connected!</p>
          </div>
        )}

        {error && status === 'idle' && (
          <div style={{ background:'rgba(248,113,113,.08)', border:'1px solid rgba(248,113,113,.3)', borderRadius:12, padding:'14px 18px', marginBottom:16 }}>
            <p style={{ fontSize:13, color:'#fca5a5', marginBottom:10 }}>⚠️ {error}</p>
            <button onClick={initiate} style={{ ...Btn('green', undefined, { width:'100%', padding:'12px' }) }}>Try Again →</button>
          </div>
        )}

        {status !== 'done' && <button onClick={handleClose} style={{ ...Btn('ghost', undefined, { width:'100%', marginTop:12, fontSize:13 }) }}>Cancel</button>}
      </div>
    </Overlay>
  );
}

// ─── PRODUCT MODAL ────────────────────────────────────────────────────────────
function ProductModal({ show, onClose, product, connectedWallet }: { show:boolean; onClose:()=>void; product:Product|null; connectedWallet:string }) {
  const [currency, setCurrency] = useState<Currency>('RLUSD');
  const [email, setEmail]       = useState('');
  const [step, setStep]         = useState<'info'|'checkout'|'success'|'preregister'>('info');
  const [tierIdx, setTierIdx]   = useState(0);
  const [walletPre, setWalletPre] = useState('');
  const [payStatus, setPayStatus] = useState<'idle'|'creating'|'waiting'|'done'>('idle');
  const [uuid, setUuid]         = useState('');
  const [qrUrl, setQrUrl]       = useState('');
  const [deepLnk, setDeepLnk]  = useState('');
  const [countdown, setCountdown] = useState(900);
  const [verifiedTx, setVerifiedTx] = useState('');
  const [payError, setPayError] = useState('');
  const pollRef   = useRef<ReturnType<typeof setTimeout>|null>(null);
  const cancelRef = useRef(false);

  // ── ALL useEffects MUST be before any early return (Rules of Hooks) ──────
  useEffect(() => {
    if (payStatus !== 'waiting' || !uuid || !product) return;
    cancelRef.current = false;
    const prod = product;
    const poll = async () => {
      if (cancelRef.current) return;
      try {
        const isCBLocal = prod.id === 'credit';
        const tiersLocal = isCBLocal ? (prod as typeof PRODUCTS[9]).tiers : null;
        const atLocal = tiersLocal ? tiersLocal[tierIdx] : null;
        const priceLocal = isCBLocal && atLocal ? (currency==='RLUSD' ? atLocal.priceRLUSD : atLocal.priceXRP) : (currency==='RLUSD' ? prod.priceRLUSD : prod.priceXRP);
        const params = new URLSearchParams({ uuid, productId:prod.id, amount:String(priceLocal), currency, email });
        const res  = await fetch(`${API_URL}/api/check-payment?${params}`);
        const data = await res.json();
        if (cancelRef.current) return;
        if (data.status === 'verified') { setVerifiedTx(data.txHash || ''); setPayStatus('done'); setStep('success'); }
        else if (data.status === 'expired') { setPayStatus('idle'); setPayError('Payment expired. Try again.'); }
        else if (data.status === 'rejected') { setPayStatus('idle'); setPayError(data.reason || 'Payment declined.'); }
        else { pollRef.current = setTimeout(poll, 3000); }
      } catch { if (!cancelRef.current) pollRef.current = setTimeout(poll, 5000); }
    };
    poll();
    return () => { cancelRef.current = true; if (pollRef.current) clearTimeout(pollRef.current); };
  }, [payStatus, uuid]); // eslint-disable-line

  useEffect(() => {
    if (payStatus !== 'waiting') return;
    const iv = setInterval(() => setCountdown(c => { if (c <= 1) { clearInterval(iv); if (!cancelRef.current) { setPayStatus('idle'); setPayError('Payment expired.'); } return 0; } return c - 1; }), 1000);
    return () => clearInterval(iv);
  }, [payStatus]);

  // ── Safe to return null after all hooks ───────────────────────────────────
  if (!product) return null;
  const isCB    = product.id === 'credit';
  const isSoon  = product.comingSoon;
  const tiers   = isCB ? (product as typeof PRODUCTS[9]).tiers : null;
  const at      = tiers ? tiers[tierIdx] : null;
  const price   = isCB && at ? (currency==='RLUSD' ? at.priceRLUSD : at.priceXRP) : (currency==='RLUSD' ? product.priceRLUSD : product.priceXRP);

  const handleClose = () => {
    cancelRef.current = true; if (pollRef.current) clearTimeout(pollRef.current);
    onClose();
    setTimeout(() => { setStep('info'); setEmail(''); setTierIdx(0); setWalletPre(''); setPayStatus('idle'); setUuid(''); setQrUrl(''); setDeepLnk(''); setCountdown(900); setVerifiedTx(''); setPayError(''); cancelRef.current = false; }, 300);
  };

  const handleBuyNow = async () => {
    setPayStatus('creating'); setPayError(''); cancelRef.current = false;
    try {
      const res  = await fetch(`${API_URL}/api/create-payment`, { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ productId:product.id, currency, amount:price, email }) });
      const data = await res.json();
      if (!res.ok || !data.uuid) throw new Error(data.error || 'Failed to create payment');
      setUuid(data.uuid); setQrUrl(data.qr_png); setDeepLnk(data.deep_link); setCountdown(data.expires_in || 900); setPayStatus('waiting');
    } catch (e: unknown) { setPayError(e instanceof Error ? e.message : 'Payment failed'); setPayStatus('idle'); }
  };

  const handlePreReg = async () => {
    try { await fetch(`${API_URL}/api/preregister`, { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ productId:product.id, email, wallet:walletPre||connectedWallet }) }); } catch {}
    setStep('success');
  };

  // ── Pre-register ──
  if (isSoon && step === 'preregister') return (
    <Overlay show={show} onClose={handleClose}>
      <div style={{ fontSize:10,fontWeight:700,color:product.color,letterSpacing:'.12em',textTransform:'uppercase',marginBottom:5,fontFamily:"'IBM Plex Mono',monospace" }}>{product.amendment}</div>
      <h3 style={{ fontSize:22,fontWeight:900,marginBottom:8 }}>Pre-Register for Early Access</h3>
      <label style={LBL}>Email</label>
      <input type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="you@example.com" style={{ ...INP, marginBottom:14 }} />
      <label style={LBL}>XRPL Wallet</label>
      <input type="text" value={walletPre||connectedWallet} onChange={e=>setWalletPre(e.target.value)} placeholder={connectedWallet||"rXXXXX…"} style={{ ...INP, fontFamily:"'IBM Plex Mono',monospace", fontSize:12, marginBottom:18 }} />
      <div style={{ display:'flex', gap:10 }}>
        <button onClick={()=>setStep('info')} style={{ ...Btn('ghost',undefined,{flex:1}) }}>← Back</button>
        <button onClick={handlePreReg} disabled={!email} style={{ ...Btn('color',product.color,{flex:2,opacity:!email?0.4:1}) }}>🔔 Pre-Register</button>
      </div>
    </Overlay>
  );

  // ── Success ──
  if (step === 'success') return (
    <Overlay show={show} onClose={handleClose}>
      <div style={{ textAlign:'center', padding:'20px 0' }}>
        <div style={{ width:76,height:76,borderRadius:'50%',background:`${product.color}18`,border:`2px solid ${product.color}45`,display:'flex',alignItems:'center',justifyContent:'center',margin:'0 auto 18px',fontSize:34,animation:'glow 2s ease-in-out infinite' }}>{product.emoji}</div>
        <div style={{ display:'inline-flex',alignItems:'center',gap:6,background:'rgba(16,185,129,.1)',border:'1px solid rgba(16,185,129,.25)',borderRadius:99,padding:'4px 14px',marginBottom:14 }}>
          <span style={{ width:6,height:6,borderRadius:'50%',background:'#10b981',boxShadow:'0 0 8px #10b981',animation:'pulse 2s infinite' }} />
          <span style={{ fontSize:10,fontWeight:700,color:'#10b981',letterSpacing:'.1em' }}>{isSoon?'PRE-REGISTERED':'✅ PAYMENT VERIFIED · SERVICE ACTIVE'}</span>
        </div>
        <h3 style={{ fontSize:24,fontWeight:900,marginBottom:8 }}>{isSoon?`You're on the list`:`${product.name} Activated`}</h3>
        <div style={{ background:'rgba(255,255,255,.04)',border:'1px solid rgba(255,255,255,.08)',borderRadius:14,padding:18,margin:'14px 0 18px',textAlign:'left' }}>
          <p style={{ fontSize:11,color:product.color,fontFamily:"'IBM Plex Mono',monospace",fontWeight:700,marginBottom:6,textTransform:'uppercase',letterSpacing:'.08em' }}>🤖 AI Verification Complete</p>
          <p style={{ fontSize:13,color:'rgba(255,255,255,.65)',lineHeight:1.75 }}>{product.aiDetail}</p>
        </div>
        {verifiedTx && <p style={{ fontSize:11,color:'rgba(255,255,255,.28)',fontFamily:"'IBM Plex Mono',monospace",marginBottom:10,wordBreak:'break-all' }}>TX: {verifiedTx.slice(0,22)}…{verifiedTx.slice(-8)}</p>}
        {email && <p style={{ fontSize:12,color:'rgba(255,255,255,.38)',marginBottom:18 }}>✅ Receipt sent to <strong style={{ color:'#fff' }}>{email}</strong></p>}
        <div style={{ display:'flex',gap:10,justifyContent:'center',flexWrap:'wrap' }}>
          {verifiedTx && <a href={`https://xrpscan.com/tx/${verifiedTx}`} target="_blank" rel="noopener noreferrer" style={{ ...Btn('ghost',undefined,{fontSize:13,textDecoration:'none'}) }}>View on XRPScan ↗</a>}
          <button onClick={handleClose} style={Btn('green')}>Done</button>
        </div>
      </div>
    </Overlay>
  );

  // ── Checkout ──
  if (step === 'checkout') return (
    <Overlay show={show} onClose={handleClose}>
      <div style={{ fontSize:10,fontWeight:700,color:product.color,letterSpacing:'.12em',textTransform:'uppercase',marginBottom:5,fontFamily:"'IBM Plex Mono',monospace" }}>{product.amendment}</div>
      <h3 style={{ fontSize:20,fontWeight:900,marginBottom:4 }}>{product.name}</h3>
      <p style={{ fontSize:12,color:'rgba(255,255,255,.4)',marginBottom:14 }}>{price} {currency}{isCB?'/mo':''} — one swipe in Xaman</p>

      {payStatus === 'creating' && (
        <div style={{ textAlign:'center', padding:'32px 0' }}>
          <div style={{ width:60,height:60,borderRadius:'50%',background:`${product.color}15`,border:`2px solid ${product.color}40`,display:'flex',alignItems:'center',justifyContent:'center',margin:'0 auto 14px',fontSize:26,animation:'spin 1.5s linear infinite' }}>⚡</div>
          <p style={{ color:product.color,fontWeight:700,fontSize:15 }}>Creating secure payment…</p>
        </div>
      )}

      {payStatus === 'waiting' && (
        <>
          <div style={{ display:'flex',alignItems:'center',justifyContent:'space-between',background:'rgba(16,185,129,.08)',border:'1px solid rgba(16,185,129,.25)',borderRadius:12,padding:'10px 16px',marginBottom:14 }}>
            <div style={{ display:'flex',alignItems:'center',gap:8 }}>
              <span style={{ width:8,height:8,borderRadius:'50%',background:'#10b981',boxShadow:'0 0 12px #10b981',animation:'pulse 1.4s infinite' }} />
              <span style={{ fontSize:13,fontWeight:700,color:'#10b981' }}>Waiting for payment…</span>
            </div>
            <span style={{ fontSize:12,color:'rgba(255,255,255,.4)',fontFamily:"'IBM Plex Mono',monospace" }}>⏱ {fmt(countdown)}</span>
          </div>
          <div style={{ background:'#fff',borderRadius:18,padding:12,width:200,height:200,margin:'0 auto 12px',display:'flex',alignItems:'center',justifyContent:'center',boxShadow:'0 0 30px rgba(16,185,129,.15)' }}>
            <img src={qrUrl || qrImg(`https://xumm.app/sign/${uuid}`)} alt="Pay" style={{ width:'100%',height:'100%',borderRadius:8 }} />
          </div>
          <div style={{ textAlign:'center',marginBottom:14 }}>
            <a href={deepLnk || `https://xumm.app/sign/${uuid}`} target="_blank" rel="noopener noreferrer"
              style={{ display:'inline-flex',alignItems:'center',gap:8,background:'#10b981',color:'#000',fontWeight:800,fontSize:14,padding:'13px 28px',borderRadius:99,textDecoration:'none',boxShadow:'0 4px 20px rgba(16,185,129,.35)' }}>
              📱 Open in Xaman — Sign Now →
            </a>
          </div>
          <div style={{ background:'rgba(255,255,255,.04)',border:'1px solid rgba(255,255,255,.07)',borderRadius:14,padding:'14px 18px',marginBottom:12 }}>
            {[['1','Scan QR or tap "Open in Xaman"'],['2',`Review the pre-filled ${price} ${currency} payment`],['3','Slide to confirm — AI verifies automatically']].map(([n,t]) => (
              <div key={n} style={{ display:'flex',alignItems:'flex-start',gap:12,marginBottom:n==='3'?0:10 }}>
                <span style={{ width:22,height:22,borderRadius:'50%',background:`${product.color}20`,border:`1px solid ${product.color}40`,display:'flex',alignItems:'center',justifyContent:'center',fontSize:11,fontWeight:800,color:product.color,flexShrink:0 }}>{n}</span>
                <span style={{ fontSize:13,color:'rgba(255,255,255,.6)',lineHeight:1.5,paddingTop:2 }}>{t}</span>
              </div>
            ))}
          </div>
          <p style={{ textAlign:'center',fontSize:11,color:'rgba(255,255,255,.28)',marginBottom:10 }}>🤖 AI confirms your TX on XRPL mainnet — no action needed after signing</p>
          <button onClick={()=>{ cancelRef.current=true; if(pollRef.current) clearTimeout(pollRef.current); setPayStatus('idle'); setPayError(''); }} style={{ ...Btn('ghost',undefined,{width:'100%',fontSize:13}) }}>← Cancel</button>
        </>
      )}

      {payStatus === 'idle' && payError && (
        <div style={{ background:'rgba(248,113,113,.08)',border:'1px solid rgba(248,113,113,.3)',borderRadius:12,padding:'14px 18px',marginBottom:16 }}>
          <p style={{ fontSize:13,color:'#fca5a5',marginBottom:10 }}>⚠️ {payError}</p>
          <button onClick={handleBuyNow} style={{ ...Btn('color',product.color,{width:'100%',padding:'12px'}) }}>Try Again →</button>
        </div>
      )}

      {payStatus === 'idle' && !payError && (
        <>
          {isCB && tiers && (
            <div style={{ marginBottom:14 }}>
              <label style={LBL}>Select Plan</label>
              <div style={{ display:'flex',flexDirection:'column',gap:8 }}>
                {tiers.map((t, i) => (
                  <button key={t.name} onClick={()=>setTierIdx(i)} style={{ padding:'12px 16px',borderRadius:12,cursor:'pointer',fontFamily:'inherit',textAlign:'left' as const,border:`1px solid ${tierIdx===i?t.color:'rgba(255,255,255,.1)'}`,background:tierIdx===i?`${t.color}14`:'rgba(255,255,255,.04)' }}>
                    <div style={{ display:'flex',justifyContent:'space-between',alignItems:'center' }}>
                      <span style={{ fontWeight:700,fontSize:14,color:tierIdx===i?t.color:'#fff' }}>{t.name}</span>
                      <span style={{ fontWeight:900,fontSize:15,color:t.color }}>{t.priceRLUSD} RLUSD<span style={{ fontSize:11,fontWeight:400,color:'rgba(255,255,255,.35)' }}>/mo</span></span>
                    </div>
                    <div style={{ fontSize:11,color:'rgba(255,255,255,.38)',marginTop:3 }}>{t.perks}</div>
                  </button>
                ))}
              </div>
            </div>
          )}
          <label style={LBL}>Currency</label>
          <div style={{ display:'flex',gap:8,marginBottom:14 }}>
            {(['RLUSD','XRP'] as Currency[]).map(c => (
              <button key={c} onClick={()=>setCurrency(c)} style={{ flex:1,padding:'10px',borderRadius:12,cursor:'pointer',fontFamily:'inherit',fontWeight:700,fontSize:14,border:`1px solid ${currency===c?product.color:'rgba(255,255,255,.1)'}`,background:currency===c?`${product.color}15`:'rgba(255,255,255,.04)',color:currency===c?product.color:'rgba(255,255,255,.5)' }}>
                {c==='RLUSD'?'💵 RLUSD':'◈ XRP'} — {c==='RLUSD'?(isCB&&at?at.priceRLUSD:product.priceRLUSD):(isCB&&at?at.priceXRP:product.priceXRP)}
              </button>
            ))}
          </div>
          <label style={LBL}>Email for Receipt (optional)</label>
          <input type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="you@example.com" style={{ ...INP, marginBottom:16 }} />
          <div style={{ background:'rgba(16,185,129,.05)',border:'1px solid rgba(16,185,129,.15)',borderRadius:12,padding:'11px 14px',marginBottom:16,fontSize:12,color:'rgba(255,255,255,.45)',lineHeight:1.6 }}>
            <strong style={{ color:'#10b981' }}>How it works:</strong> Tap below → Xaman opens pre-filled → slide to sign → AI verifies on XRPL → done.
          </div>
          <div style={{ display:'flex',gap:10 }}>
            <button onClick={()=>setStep('info')} style={{ ...Btn('ghost',undefined,{flex:1}) }}>← Back</button>
            <button onClick={handleBuyNow} style={{ ...Btn('color',product.color,{flex:2,fontSize:15}) }}>📱 Pay {price} {currency} →</button>
          </div>
        </>
      )}
    </Overlay>
  );

  // ── Info ──
  return (
    <Overlay show={show} onClose={handleClose} wide>
      <div style={{ display:'flex',gap:16,alignItems:'flex-start',marginBottom:22,flexWrap:'wrap' }}>
        <div style={{ width:58,height:58,borderRadius:16,background:`${product.color}18`,border:`1px solid ${product.color}30`,display:'flex',alignItems:'center',justifyContent:'center',fontSize:26,flexShrink:0,animation:'float 4s ease-in-out infinite' }}>{product.emoji}</div>
        <div style={{ flex:1,minWidth:200 }}>
          <div style={{ display:'flex',alignItems:'center',gap:8,flexWrap:'wrap',marginBottom:4 }}>
            <div style={{ fontSize:10,fontWeight:700,color:product.color,letterSpacing:'.12em',textTransform:'uppercase',fontFamily:"'IBM Plex Mono',monospace" }}>{product.amendment}</div>
            {isSoon && <span style={{ background:`${product.color}20`,color:product.color,fontSize:9,fontWeight:800,padding:'2px 8px',borderRadius:99 }}>COMING SOON</span>}
          </div>
          <h2 style={{ fontSize:23,fontWeight:900,marginBottom:4 }}>{product.name}</h2>
          <p style={{ fontSize:13,color:'rgba(255,255,255,.48)' }}>{product.tagline}</p>
        </div>
      </div>
      <p style={{ fontSize:14,color:'rgba(255,255,255,.62)',lineHeight:1.82,marginBottom:22 }}>{product.desc}</p>
      <div style={{ background:'rgba(16,185,129,.05)',border:'1px solid rgba(16,185,129,.18)',borderRadius:14,padding:16,marginBottom:22 }}>
        <p style={{ fontSize:11,fontWeight:700,color:'#10b981',marginBottom:6,textTransform:'uppercase',letterSpacing:'.09em',fontFamily:"'IBM Plex Mono',monospace" }}>🤖 {isSoon?'When it goes live':'What AI does after payment'}</p>
        <p style={{ fontSize:13,color:'rgba(255,255,255,.6)',lineHeight:1.75 }}>{product.aiDetail}</p>
      </div>
      <div style={{ display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(200px,1fr))',gap:9,marginBottom:26 }}>
        {product.features.map(f => (
          <div key={f} style={{ background:'rgba(255,255,255,.04)',border:'1px solid rgba(255,255,255,.07)',borderRadius:11,padding:'10px 13px',display:'flex',alignItems:'center',gap:8 }}>
            <span style={{ color:product.color,fontSize:11,flexShrink:0 }}>✓</span>
            <span style={{ fontSize:12,color:'rgba(255,255,255,.55)' }}>{f}</span>
          </div>
        ))}
      </div>
      {!isSoon && (
        <div style={{ display:'flex',alignItems:'center',justifyContent:'space-between',background:`${product.color}08`,border:`1px solid ${product.color}22`,borderRadius:14,padding:'16px 20px',marginBottom:20,flexWrap:'wrap',gap:12 }}>
          <div>
            <div style={{ fontSize:11,color:'rgba(255,255,255,.38)',marginBottom:4 }}>{isCB?'Starting from':'One-time activation'}</div>
            <div style={{ display:'flex',gap:12,alignItems:'baseline',flexWrap:'wrap' }}>
              <span style={{ fontSize:28,fontWeight:900,color:product.color }}>{product.priceRLUSD} RLUSD</span>
              <span style={{ fontSize:13,color:'rgba(255,255,255,.3)' }}>or {product.priceXRP} XRP{isCB?'/mo':''}</span>
            </div>
          </div>
          <div style={{ textAlign:'right' }}>
            <div style={{ fontSize:11,color:'rgba(255,255,255,.38)',marginBottom:4 }}>Xaman checkout</div>
            <div style={{ fontSize:15,fontWeight:700,color:'#10b981' }}>One swipe ⚡</div>
          </div>
        </div>
      )}
      <div style={{ background:'rgba(255,255,255,.03)',borderRadius:11,padding:'11px 15px',marginBottom:20 }}>
        <p style={{ fontSize:11,color:'rgba(255,255,255,.3)',lineHeight:1.7 }}><strong style={{ color:'rgba(255,255,255,.45)' }}>Disclosure: </strong>On-chain operational service. Not insurance, securities, or financial instruments. All transactions are irrevocable.</p>
      </div>
      {isSoon
        ? <button onClick={()=>setStep('preregister')} style={{ ...Btn('color',product.color,{width:'100%',padding:'15px',fontSize:16}) }}>🔔 Pre-Register for Early Access →</button>
        : <button onClick={()=>setStep('checkout')} style={{ ...Btn('color',product.color,{width:'100%',padding:'15px',fontSize:16}) }}>Buy Now — {product.priceRLUSD} RLUSD →</button>
      }
    </Overlay>
  );
}

// ─── DONATE MODAL ─────────────────────────────────────────────────────────────
function DonateModal({ show, onClose }: { show:boolean; onClose:()=>void }) {
  const [amount, setAmount] = useState('');
  const [currency, setCurrency] = useState<Currency>('XRP');
  const [copiedA, setCopiedA] = useState(false);
  const [copiedD, setCopiedD] = useState(false);
  const [txHash, setTxHash] = useState('');
  const [step, setStep] = useState<'form'|'done'>('form');
  const dl = `xrpl:${TREASURY}${currency==='XRP'&&parseFloat(amount)>0?`?amount=${Math.floor(parseFloat(amount)*1e6)}`:''}`;
  const handleClose = () => { onClose(); setTimeout(()=>{ setStep('form'); setAmount(''); setTxHash(''); },300); };

  if (step === 'done') return (
    <Overlay show={show} onClose={handleClose}>
      <div style={{ textAlign:'center',padding:'28px 0' }}>
        <div style={{ fontSize:60,marginBottom:14 }}>💚</div>
        <h3 style={{ fontSize:26,fontWeight:900,color:'#10b981',marginBottom:10 }}>Thank You.</h3>
        <p style={{ color:'rgba(255,255,255,.55)',fontSize:14,lineHeight:1.8,marginBottom:8 }}><strong style={{ color:'#fff' }}>{amount} {currency}</strong> flowing directly to people in need.</p>
        <p style={{ color:'rgba(255,255,255,.35)',fontSize:13,lineHeight:1.75,marginBottom:26 }}>Wallet-to-wallet — permanently on the XRP Ledger. That&apos;s math.</p>
        <div style={{ display:'flex',gap:10,justifyContent:'center',flexWrap:'wrap' }}>
          <a href={`https://xrpscan.com/account/${TREASURY}`} target="_blank" rel="noopener noreferrer" style={{ ...Btn('ghost',undefined,{fontSize:13,textDecoration:'none'}) }}>Verify on XRPScan ↗</a>
          <button onClick={handleClose} style={Btn('green')}>Done</button>
        </div>
      </div>
    </Overlay>
  );

  return (
    <Overlay show={show} onClose={handleClose}>
      <div style={{ fontSize:10,fontWeight:700,color:'#10b981',letterSpacing:'.12em',textTransform:'uppercase',marginBottom:5 }}>Donate to Treasury</div>
      <h3 style={{ fontSize:22,fontWeight:900,marginBottom:4 }}>Fund real people. Directly.</h3>
      <p style={{ fontSize:13,color:'rgba(255,255,255,.44)',marginBottom:18 }}>Zero overhead. <strong style={{ color:'#10b981' }}>100% reaches the wallet.</strong></p>
      <div style={{ background:'#fff',borderRadius:16,padding:11,width:166,height:166,margin:'0 auto 12px',display:'flex',alignItems:'center',justifyContent:'center',overflow:'hidden' }}>
        <img src={qrImg(dl)} alt="Donate" style={{ width:144,height:144,borderRadius:5 }} />
      </div>
      <p style={{ textAlign:'center',marginBottom:12 }}><a href={dl} target="_blank" rel="noopener noreferrer" style={{ fontSize:12,color:'#10b981',fontWeight:600 }}>📱 Open in Xaman{amount&&parseFloat(amount)>0?` — ${amount} ${currency}`:''}</a></p>
      <div style={{ background:'rgba(16,185,129,.08)',border:'1px solid rgba(16,185,129,.28)',borderRadius:12,padding:'9px 12px',marginBottom:6,display:'flex',alignItems:'center',gap:8,flexWrap:'wrap' }}>
        <span style={{ fontSize:9,fontWeight:700,color:'#10b981',textTransform:'uppercase',fontFamily:"'IBM Plex Mono',monospace" }}>XRPNS</span>
        <code style={{ fontSize:12,color:'#10b981',flex:1,wordBreak:'break-all',fontFamily:"'IBM Plex Mono',monospace",fontWeight:700 }}>{TREASURY_DOMAIN}</code>
        <button onClick={()=>{ navigator.clipboard.writeText(TREASURY_DOMAIN); setCopiedD(true); setTimeout(()=>setCopiedD(false),2000); }} style={{ ...Btn('ghost',undefined,{padding:'4px 9px',fontSize:10}),flexShrink:0 }}>{copiedD?'✓':'Copy'}</button>
      </div>
      <div style={{ background:'rgba(16,185,129,.05)',border:'1px solid rgba(16,185,129,.15)',borderRadius:12,padding:'9px 12px',marginBottom:14,display:'flex',alignItems:'center',gap:8,flexWrap:'wrap' }}>
        <code style={{ fontSize:10,color:'#34d399',flex:1,wordBreak:'break-all',fontFamily:"'IBM Plex Mono',monospace" }}>{TREASURY}</code>
        <button onClick={()=>{ navigator.clipboard.writeText(TREASURY); setCopiedA(true); setTimeout(()=>setCopiedA(false),2000); }} style={{ ...Btn('ghost',undefined,{padding:'4px 9px',fontSize:10}),flexShrink:0 }}>{copiedA?'✓':'Copy'}</button>
      </div>
      <div style={{ display:'flex',gap:8,marginBottom:12 }}>
        {(['XRP','RLUSD'] as Currency[]).map(c => (
          <button key={c} onClick={()=>setCurrency(c)} style={{ flex:1,padding:'10px',borderRadius:12,cursor:'pointer',fontFamily:'inherit',fontWeight:700,fontSize:13,border:`1px solid ${currency===c?'#10b981':'rgba(255,255,255,.1)'}`,background:currency===c?'rgba(16,185,129,.12)':'rgba(255,255,255,.04)',color:currency===c?'#10b981':'rgba(255,255,255,.5)' }}>
            {c==='XRP'?'◈ XRP':'💵 RLUSD'}
          </button>
        ))}
      </div>
      <div style={{ display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:8,marginBottom:10 }}>
        {['10','25','50','100'].map(a => <button key={a} onClick={()=>setAmount(a)} style={{ padding:'10px',borderRadius:12,cursor:'pointer',border:`1px solid ${amount===a?'#10b981':'rgba(255,255,255,.1)'}`,background:amount===a?'rgba(16,185,129,.12)':'rgba(255,255,255,.04)',color:amount===a?'#10b981':'rgba(255,255,255,.6)',fontWeight:700,fontSize:13,fontFamily:'inherit' }}>{a}</button>)}
      </div>
      <input type="number" value={amount} onChange={e=>setAmount(e.target.value)} placeholder={`Amount in ${currency}`} style={{ ...INP, marginBottom:8 }} />
      <input type="text" value={txHash} onChange={e=>setTxHash(e.target.value)} placeholder="TX hash (optional)" style={{ ...INP, fontFamily:"'IBM Plex Mono',monospace", fontSize:11, marginBottom:16 }} />
      <button onClick={async()=>{ try{ await fetch(`${API_URL}/api/donate`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({amount,currency,txHash})}); }catch{} setStep('done'); }} disabled={!amount||parseFloat(amount)<=0} style={{ ...Btn('green',undefined,{width:'100%',padding:'14px',fontSize:15,opacity:!amount||parseFloat(amount)<=0?0.4:1}) }}>💚 I Sent My Donation</button>
    </Overlay>
  );
}

// ─── GRANT MODAL ──────────────────────────────────────────────────────────────
function GrantModal({ show, onClose, connectedWallet }: { show:boolean; onClose:()=>void; connectedWallet:string }) {
  const [step, setStep] = useState<'form'|'verify'|'processing'|'success'>('form');
  const [form, setForm] = useState({ name:'',wallet:'',email:'',phone:'',category:'',need:'',amount:'25' });
  const [code, setCode] = useState('');
  const [errors, setErrors] = useState<Record<string,string>>({});
  const cats = ['Food & Groceries','Rent / Housing','Medical Bills','Utilities','Transportation','Other'];
  const set = (k:string, v:string) => { setForm(f=>({...f,[k]:v})); setErrors(e=>({...e,[k]:'',contact:''})); };
  const handleClose = () => { onClose(); setTimeout(()=>{ setStep('form'); setForm({name:'',wallet:'',email:'',phone:'',category:'',need:'',amount:'25'}); setErrors({}); setCode(''); },300); };
  useEffect(()=>{ if(connectedWallet && !form.wallet) setForm(f=>({...f,wallet:connectedWallet})); },[connectedWallet]); // eslint-disable-line
  const validate = () => { const e:Record<string,string>={}; if(!form.need.trim()) e.need='Describe your need'; if(!form.category) e.category='Select a category'; const w=form.wallet||connectedWallet; if(!w&&!form.email) e.contact='Provide wallet or email'; if(w&&(!w.startsWith('r')||w.length<25)) e.wallet='Invalid XRPL address'; return e; };

  if (step==='processing') return <Overlay show={show} onClose={()=>{}}><div style={{ textAlign:'center',padding:'44px 0' }}><div style={{ fontSize:44,animation:'spin 1s linear infinite',display:'inline-block',marginBottom:14 }}>🤖</div><p style={{ color:'#10b981',fontWeight:600,fontSize:17 }}>AI reviewing your application…</p></div></Overlay>;
  if (step==='success') return <Overlay show={show} onClose={handleClose}><div style={{ textAlign:'center',padding:'20px 0' }}><div style={{ fontSize:60,marginBottom:12 }}>❤️</div><h3 style={{ fontSize:24,fontWeight:900,color:'#10b981',marginBottom:10 }}>Request Received</h3><p style={{ color:'rgba(255,255,255,.55)',fontSize:14,lineHeight:1.75,marginBottom:26 }}>Your ${form.amount} application is with our AI reviewer. Approved funds go <strong style={{ color:'#fff' }}>directly to your XRPL wallet</strong>.</p><button onClick={handleClose} style={Btn('green')}>Done</button></div></Overlay>;
  if (step==='verify') return (
    <Overlay show={show} onClose={()=>setStep('form')}>
      <div style={{ textAlign:'center' }}>
        <div style={{ fontSize:48,marginBottom:12 }}>📱</div>
        <h3 style={{ fontSize:22,fontWeight:800,marginBottom:8 }}>Verify Identity</h3>
        <p style={{ color:'rgba(255,255,255,.4)',fontSize:13,marginBottom:22 }}>6-digit code sent to <strong style={{ color:'#fff' }}>{form.email||form.phone}</strong>.</p>
        <input type="text" maxLength={6} value={code} onChange={e=>setCode(e.target.value.replace(/\D/g,'').slice(0,6))} placeholder="_ _ _ _ _ _" style={{ ...INP,fontSize:28,textAlign:'center',letterSpacing:'.3em',marginBottom:16 }} />
        <p style={{ fontSize:12,color:'rgba(255,255,255,.28)',marginBottom:18 }}>Demo: any 6 digits work.</p>
        <div style={{ display:'flex',gap:10 }}>
          <button onClick={()=>setStep('form')} style={{ ...Btn('ghost',undefined,{flex:1}) }}>← Back</button>
          <button onClick={async()=>{ setStep('processing'); try{ await fetch(`${API_URL}/api/grants/submit`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({...form,wallet:form.wallet||connectedWallet})}); if(form.email) await fetch(`${API_URL}/api/send-email`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({to:form.email,type:'grant',name:form.name,amount:form.amount,wallet:form.wallet||connectedWallet})}).catch(()=>{}); }catch{} await new Promise(r=>setTimeout(r,1600)); setStep('success'); }} disabled={code.length<6} style={{ ...Btn('green',undefined,{flex:2,opacity:code.length<6?0.4:1}) }}>Confirm →</button>
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
      <div style={{ display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(110px,1fr))',gap:8,marginBottom:4 }}>
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
      <div style={{ display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(200px,1fr))',gap:10,marginTop:14 }}>
        <div><label style={LBL}>Name (optional)</label><input type="text" value={form.name} onChange={e=>set('name',e.target.value)} placeholder="Anonymous is fine" style={INP} /></div>
        <div><label style={LBL}>XRPL Wallet *{connectedWallet?' (connected)':''}</label><input type="text" value={form.wallet||connectedWallet} onChange={e=>set('wallet',e.target.value)} placeholder={connectedWallet||"rXXXXX…"} style={{ ...INP,fontFamily:"'IBM Plex Mono',monospace",fontSize:12 }} />{errors.wallet&&<p style={{ fontSize:12,color:'#f87171' }}>{errors.wallet}</p>}</div>
        <div><label style={LBL}>Email *</label><input type="email" value={form.email} onChange={e=>set('email',e.target.value)} placeholder="you@example.com" style={INP} /></div>
        <div><label style={LBL}>Phone (SMS)</label><input type="tel" value={form.phone} onChange={e=>set('phone',e.target.value)} placeholder="+1 555 000 0000" style={INP} /></div>
      </div>
      {errors.contact&&<p style={{ fontSize:12,color:'#f87171',marginTop:4 }}>{errors.contact}</p>}
      <button onClick={()=>{ const e=validate(); if(Object.keys(e).length){setErrors(e);return;} setStep('verify'); }} style={{ ...Btn('green',undefined,{width:'100%',marginTop:22,padding:'15px',fontSize:16}) }}>Submit for AI Review →</button>
      <p style={{ textAlign:'center',fontSize:11,color:'rgba(255,255,255,.22)',marginTop:10 }}>AI-reviewed within 24 hrs · Zero overhead · Wallet-to-wallet</p>
    </Overlay>
  );
}

// ─── SCORE MODAL ──────────────────────────────────────────────────────────────
function ScoreModal({ show, onClose, scoreData, loading, error, onRetry, walletAddress }: { show:boolean;onClose:()=>void;scoreData:ScoreData|null;loading:boolean;error:string|null;onRetry:()=>void;walletAddress:string }) {
  const [animated, setAnimated] = useState(false);
  const grade = scoreData ? gradeScore(scoreData.ledgerScore) : null;
  const R = 52; const circ = 2 * Math.PI * R;
  const pct = scoreData ? Math.min(1, Math.max(0, (scoreData.ledgerScore - 300) / 550)) : 0;
  useEffect(()=>{ if(show&&scoreData){ const t=setTimeout(()=>setAnimated(true),100); return()=>clearTimeout(t); } else setAnimated(false); },[show,scoreData]);

  return (
    <Overlay show={show} onClose={onClose}>
      <div style={{ fontSize:10,fontWeight:700,color:'#10b981',letterSpacing:'.12em',textTransform:'uppercase',marginBottom:8,fontFamily:"'IBM Plex Mono',monospace" }}>LedgerScore™ — Live XRPL Scan</div>
      {loading&&<div style={{ textAlign:'center',padding:'44px 0' }}><div style={{ fontSize:40,animation:'spin 1s linear infinite',display:'inline-block',marginBottom:14 }}>🤖</div><p style={{ color:'#10b981',fontWeight:600,fontSize:17 }}>Scanning XRPL Mainnet…</p><p style={{ color:'rgba(255,255,255,.35)',fontSize:13,marginTop:6 }}>Account age · TX history · Trust lines · AMM · NFTs</p><div style={{ width:220,height:3,background:'rgba(255,255,255,.07)',borderRadius:99,margin:'18px auto 0',overflow:'hidden' }}><div style={{ height:'100%',background:'#10b981',animation:'shimmer 1.5s ease-in-out infinite',borderRadius:99 }} /></div></div>}
      {error&&!loading&&<div style={{ textAlign:'center',padding:'28px 0' }}><div style={{ fontSize:44,marginBottom:12 }}>⚠️</div><p style={{ color:'#f87171',fontWeight:600,fontSize:17,marginBottom:8 }}>Scan failed</p><p style={{ color:'rgba(255,255,255,.4)',fontSize:13,marginBottom:22 }}>{error}</p><div style={{ display:'flex',gap:10,justifyContent:'center' }}><button onClick={onRetry} style={Btn('green')}>Retry</button><button onClick={onClose} style={Btn('ghost')}>Close</button></div></div>}
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
          <div style={{ textAlign:'center',marginBottom:16 }}><span style={{ display:'inline-block',padding:'4px 16px',borderRadius:99,background:`${grade.color}18`,border:`1px solid ${grade.color}40`,color:grade.color,fontWeight:700,fontSize:15 }}>{grade.label}</span></div>
          {scoreData.details&&(
            <div style={{ display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(110px,1fr))',gap:8,marginBottom:14 }}>
              {([['Transactions',(scoreData.details.txCount||0).toLocaleString()],['Account Age',`${scoreData.details.accountAge||0}d`],['XRP Balance',`${(scoreData.details.balanceXRP||0).toFixed(1)}`],['Trust Lines',String(scoreData.details.trustLines||0)],['DEX Active',scoreData.details.hasOffers?'Yes':'No'],['AMM LP',scoreData.details.hasAMM?'Yes':'No']] as [string,string][]).map(([l,v])=>(
                <div key={l} style={{ background:'rgba(255,255,255,.04)',borderRadius:10,padding:'10px 12px' }}>
                  <div style={{ fontSize:9,color:'rgba(255,255,255,.32)',textTransform:'uppercase',letterSpacing:'.07em',marginBottom:3 }}>{l}</div>
                  <div style={{ fontSize:17,fontWeight:800 }}>{v}</div>
                </div>
              ))}
            </div>
          )}
          {scoreData.scannedAt&&<p style={{ fontSize:10,color:'rgba(255,255,255,.2)',textAlign:'center',marginBottom:6,fontFamily:"'IBM Plex Mono',monospace" }}>Scanned live {new Date(scoreData.scannedAt).toLocaleTimeString()}</p>}
          {walletAddress&&<p style={{ fontSize:10,color:'rgba(255,255,255,.22)',fontFamily:"'IBM Plex Mono',monospace",textAlign:'center',marginBottom:14,wordBreak:'break-all' }}>🔒 {walletAddress.slice(0,12)}…{walletAddress.slice(-6)}</p>}
          <button onClick={onClose} style={{ ...Btn('green',undefined,{width:'100%',padding:'14px',fontSize:15}) }}>Done</button>
        </>
      )}
    </Overlay>
  );
}

// ─── LOGIN MODAL ──────────────────────────────────────────────────────────────
function LoginModal({ show, onClose, onLoggedIn }: { show:boolean;onClose:()=>void;onLoggedIn:(u:User)=>void }) {
  const [tab, setTab] = useState<'login'|'signup'>('login');
  const [form, setForm] = useState({ name:'',email:'',password:'',confirm:'' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const set = (k:string, v:string) => { setForm(f=>({...f,[k]:v})); setError(''); };
  const handleSubmit = async () => {
    if (!form.email||!form.password) { setError('Email and password required.'); return; }
    if (tab==='signup'&&form.password!==form.confirm) { setError('Passwords do not match.'); return; }
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/auth/${tab}`, { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify(form) });
      const data = await res.json().catch(()=>({}));
      if (!res.ok) throw new Error(data.message);
      if (typeof window!=='undefined') localStorage.setItem('kk_user', JSON.stringify({email:form.email,name:form.name}));
      onLoggedIn({email:form.email,name:form.name||data.name}); onClose();
    } catch {
      const user = {email:form.email,name:form.name||form.email.split('@')[0]};
      if (typeof window!=='undefined') localStorage.setItem('kk_user', JSON.stringify(user));
      onLoggedIn(user); onClose();
    } finally { setLoading(false); }
  };
  return (
    <Overlay show={show} onClose={()=>{ onClose(); setError(''); setForm({name:'',email:'',password:'',confirm:''}); }}>
      <div style={{ textAlign:'center',marginBottom:22 }}><div style={{ fontSize:32,marginBottom:8 }}>🔐</div><h2 style={{ fontSize:23,fontWeight:900 }}>KreditKarma</h2><p style={{ fontSize:13,color:'rgba(255,255,255,.4)',marginTop:4 }}>Your on-chain financial identity</p></div>
      <div style={{ display:'flex',gap:8,marginBottom:20 }}>
        {(['login','signup'] as const).map(t=><button key={t} onClick={()=>{setTab(t);setError('');}} style={{ flex:1,padding:'10px',borderRadius:12,cursor:'pointer',fontFamily:'inherit',fontWeight:600,fontSize:14,border:`1px solid ${tab===t?'#10b981':'rgba(255,255,255,.1)'}`,background:tab===t?'rgba(16,185,129,.12)':'rgba(255,255,255,.04)',color:tab===t?'#10b981':'rgba(255,255,255,.5)' }}>{t==='login'?'Log In':'Sign Up'}</button>)}
      </div>
      <div style={{ display:'flex',flexDirection:'column',gap:12 }}>
        {tab==='signup'&&<div><label style={LBL}>Full Name</label><input style={INP} type="text" value={form.name} onChange={e=>set('name',e.target.value)} placeholder="Jane Doe" /></div>}
        <div><label style={LBL}>Email</label><input style={INP} type="email" value={form.email} onChange={e=>set('email',e.target.value)} placeholder="you@example.com" /></div>
        <div><label style={LBL}>Password</label><input style={INP} type="password" value={form.password} onChange={e=>set('password',e.target.value)} placeholder="••••••••" /></div>
        {tab==='signup'&&<div><label style={LBL}>Confirm</label><input style={INP} type="password" value={form.confirm} onChange={e=>set('confirm',e.target.value)} placeholder="••••••••" /></div>}
      </div>
      {error&&<p style={{ fontSize:12,color:'#f87171',marginTop:10 }}>{error}</p>}
      <button onClick={handleSubmit} disabled={loading} style={{ ...Btn('green',undefined,{width:'100%',padding:'14px',marginTop:18,opacity:loading?0.6:1}) }}>{loading?'⚡ Processing…':tab==='login'?'Log In →':'Create Account →'}</button>
      <p style={{ fontSize:11,color:'rgba(255,255,255,.3)',textAlign:'center',marginTop:14 }}>Need Xaman? <a href={XAMAN_DL} target="_blank" rel="noopener noreferrer" style={{ color:'#10b981',fontWeight:600 }}>Download free →</a></p>
    </Overlay>
  );
}

// ─── ABOUT / FAQ / TERMS / PRIVACY ───────────────────────────────────────────
function AboutModal({ show, onClose }: { show:boolean; onClose:()=>void }) {
  return (
    <Overlay show={show} onClose={onClose} wide>
      <div style={{ fontSize:10,fontWeight:700,color:'#10b981',letterSpacing:'.12em',textTransform:'uppercase',marginBottom:8 }}>About KreditKarma</div>
      <h2 style={{ fontSize:24,fontWeight:900,marginBottom:18 }}>The first fully autonomous XRPL financial services platform.</h2>
      <div style={{ fontSize:14,color:'rgba(255,255,255,.65)',lineHeight:1.9,display:'flex',flexDirection:'column',gap:14 }}>
        <p>Built because the people who need financial services most are the ones legacy systems designed to exclude. We changed that by building entirely on the <strong style={{ color:'#fff' }}>XRP Ledger</strong>.</p>
        <p><strong style={{ color:'#10b981' }}>LedgerScore™</strong> — world&apos;s first on-chain credit standard. 300–850, scanned live from XRPL mainnet. No SSN required.</p>
        <p><strong style={{ color:'#fff' }}>10 XRPL Amendment Services</strong> — AI-wrapped tools for every major XRPL transaction type. One-swipe checkout via Xaman. AI verifies on-chain. Service activates in seconds.</p>
        <p><strong style={{ color:'#10b981' }}>Grants</strong> — wallet-to-wallet, permanently on-chain, verifiable by anyone. No NGOs. No overhead.</p>
        <div style={{ background:'rgba(16,185,129,.06)',border:'1px solid rgba(16,185,129,.15)',borderRadius:14,padding:18 }}>
          <p style={{ fontSize:13,color:'rgba(255,255,255,.6)',lineHeight:1.75,fontStyle:'italic' }}>&ldquo;We&apos;re replacing the parts of finance that were never worth keeping — with math you can verify yourself.&rdquo;</p>
        </div>
      </div>
      <button onClick={onClose} style={{ ...Btn('green',undefined,{marginTop:24}) }}>Close</button>
    </Overlay>
  );
}

function FAQModal({ show, onClose }: { show:boolean; onClose:()=>void }) {
  const [open, setOpen] = useState<number|null>(0);
  const faqs: [string,string][] = [
    ['How does checkout work?','Click Buy Now → we create a Xaman payment request → QR and deep link appear → scan or tap to open Xaman → payment pre-filled → slide to confirm → AI verifies on XRPL mainnet automatically. Under 15 seconds. No TX hash copying.'],
    ['What is LedgerScore?',"300–850, scanned live from XRPL mainnet. Account age, TX count, trust lines, DEX, AMM, escrow, NFTs, multi-sig. No SSN. No bureau access required."],
    ['How do I connect my wallet?','Tap 🔐 Connect Wallet → scan QR in Xaman → approve. No transaction is sent. No funds move. Your wallet address is stored locally for one-tap LedgerScore checks and grant applications.'],
    ['What are the 10 XRPL Services?','Clawback Shield · Escrow Vault · Mutual Aid Pool · Multi-Sig Fortress · NFT Vault Lock · Payment Channel · On-Chain Identity · DEX Market Maker · DEX Liquidity Guard · Credit Builder. Plus Borrow/Lend coming soon.'],
    ['How do grants work?',"Donate XRP/RLUSD to the treasury (public at xrpscan.com). Apply for $25–$100. AI reviews within 24 hours. Funds go wallet-to-wallet."],
    ['Is this a bank?','No. Not a bank, broker, insurer, or FDIC institution. Financial technology platform on the XRP Ledger.'],
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
      <button onClick={onClose} style={{ ...Btn('ghost',undefined,{marginTop:20}) }}>Close</button>
    </Overlay>
  );
}

function TermsModal({ show, onClose }: { show:boolean; onClose:()=>void }) {
  const H:React.CSSProperties={ color:'#10b981',fontWeight:800,display:'block',marginTop:20,marginBottom:6,fontSize:13,textTransform:'uppercase',letterSpacing:'.04em' };
  const P:React.CSSProperties={ fontSize:13,color:'rgba(255,255,255,.58)',lineHeight:1.85,marginBottom:8 };
  return (
    <Overlay show={show} onClose={onClose} wide>
      <div style={{ fontSize:10,fontWeight:700,color:'#10b981',letterSpacing:'.12em',textTransform:'uppercase',marginBottom:6 }}>Legal</div>
      <h2 style={{ fontSize:22,fontWeight:900,marginBottom:4 }}>Terms of Service</h2>
      <p style={{ fontSize:11,color:'rgba(255,255,255,.28)',marginBottom:18 }}>KreditKarma.us · Effective January 1, 2025 · Last updated {new Date().toLocaleDateString('en-US',{month:'long',day:'numeric',year:'numeric'})}</p>
      <div style={{ maxHeight:'60vh',overflowY:'auto',paddingRight:8 }}>
        <p style={P}>By using KreditKarma.us you agree to these Terms in full.</p>
        <span style={H}>1. Who We Are</span><p style={P}>Financial technology platform on the XRP Ledger. Not a bank, broker-dealer, investment advisor, insurer, or FDIC institution.</p>
        <span style={H}>2. Eligibility</span><p style={P}>Must be 18+. Unavailable where prohibited by law.</p>
        <span style={H}>3. Services & Payments</span><p style={P}>Services are on-chain operational tools. Payment via Xaman. AI verifies on XRPL mainnet automatically. <strong style={{ color:'rgba(255,255,255,.8)' }}>All XRPL transactions are final and irrevocable.</strong> Not insurance, securities, or financial instruments.</p>
        <span style={H}>4. LedgerScore™</span><p style={P}>Proprietary on-chain credit assessment. Not a FICO score, consumer credit report, or NRSRO rating.</p>
        <span style={H}>5. Credit Builder</span><p style={P}>Monthly payments build LedgerScore. Bureau furnishing requires explicit FCRA consent. All payments non-refundable.</p>
        <span style={H}>6. Grants</span><p style={P}>Voluntary and irrevocable donations. Subject to discretionary AI approval.</p>
        <span style={H}>7. Your Wallet</span><p style={P}>You are solely responsible for your private keys and seed phrases. We never have access to them.</p>
        <span style={H}>8. Liability</span><p style={P}>Capped at greater of $100 or 12-month payments. No indirect damages.</p>
        <span style={H}>9. Governing Law</span><p style={P}>Delaware law. AAA Consumer Arbitration. Contact: <a href="mailto:legal@kreditkarma.us" style={{ color:'#10b981' }}>legal@kreditkarma.us</a></p>
      </div>
      <button onClick={onClose} style={{ ...Btn('ghost',undefined,{marginTop:18,width:'100%'}) }}>Close</button>
    </Overlay>
  );
}

function PrivacyModal({ show, onClose }: { show:boolean; onClose:()=>void }) {
  const H:React.CSSProperties={ color:'#10b981',fontWeight:800,display:'block',marginTop:20,marginBottom:6,fontSize:13,textTransform:'uppercase',letterSpacing:'.04em' };
  const P:React.CSSProperties={ fontSize:13,color:'rgba(255,255,255,.58)',lineHeight:1.85,marginBottom:8 };
  return (
    <Overlay show={show} onClose={onClose} wide>
      <div style={{ fontSize:10,fontWeight:700,color:'#10b981',letterSpacing:'.12em',textTransform:'uppercase',marginBottom:6 }}>Legal</div>
      <h2 style={{ fontSize:22,fontWeight:900,marginBottom:4 }}>Privacy Policy</h2>
      <p style={{ fontSize:11,color:'rgba(255,255,255,.28)',marginBottom:18 }}>KreditKarma.us · Effective January 1, 2025 · Last updated {new Date().toLocaleDateString('en-US',{month:'long',day:'numeric',year:'numeric'})}</p>
      <div style={{ maxHeight:'60vh',overflowY:'auto',paddingRight:8 }}>
        <span style={H}>1. What We Collect</span><p style={P}>Name, email, phone, XRPL wallet address, grant details, SSN last-4 only for bureau verification (never stored in full). Public on-chain XRPL data for LedgerScore.</p>
        <span style={H}>2. Never Collect</span><p style={P}>Full SSN · Private keys · Seed phrases · Plain-text passwords. We will never ask for your private key.</p>
        <span style={H}>3. How We Use It</span><p style={P}>Service delivery · LedgerScore · Grant processing · Bureau furnishing (consent) · Receipts · Legal compliance.</p>
        <span style={H}>4. Sharing</span><p style={P}>We do not sell data. Shared only with bureaus (consent), service providers, and law enforcement when required.</p>
        <span style={H}>5. Security</span><p style={P}>TLS 1.3 · AES-256 · SSN-4 one-way hashed · Role-based access.</p>
        <span style={H}>6. Your Rights</span><p style={P}>Access · correction · deletion · opt-out of bureau furnishing. Contact: <a href="mailto:privacy@kreditkarma.us" style={{ color:'#10b981' }}>privacy@kreditkarma.us</a></p>
      </div>
      <button onClick={onClose} style={{ ...Btn('ghost',undefined,{marginTop:18,width:'100%'}) }}>Close</button>
    </Overlay>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN PAGE
// ═══════════════════════════════════════════════════════════════════════════════
export default function KreditKarmaHome() {
  const [user, setUser]               = useState<User|null>(null);
  const [connectedWallet, setConnected] = useState('');
  const [scoreData, setScoreData]     = useState<ScoreData|null>(null);
  const [scoreLoading, setSL]         = useState(false);
  const [scoreError, setSE]           = useState<string|null>(null);
  const [walletInput, setWI]          = useState('');
  const [activeProduct, setAP]        = useState<Product|null>(null);
  const [mobileMenu, setMM]           = useState(false);
  const [showScore, setShowScore]     = useState(false);
  const [showDonate, setShowDonate]   = useState(false);
  const [showGrant, setShowGrant]     = useState(false);
  const [showLogin, setShowLogin]     = useState(false);
  const [showAbout, setShowAbout]     = useState(false);
  const [showFaq, setShowFaq]         = useState(false);
  const [showTerms, setShowTerms]     = useState(false);
  const [showPrivacy, setShowPrivacy] = useState(false);
  const [showConnect, setShowConnect] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const s = localStorage.getItem('kk_user');  if (s) { try { setUser(JSON.parse(s)); } catch {} }
    const w = localStorage.getItem('kk_wallet'); if (w) { setConnected(w); setWI(w); }
  }, []);

  const handleWalletConnected = (addr: string) => {
    setConnected(addr); setWI(addr);
    if (typeof window !== 'undefined') localStorage.setItem('kk_wallet', addr);
  };
  const disconnectWallet = () => {
    setConnected(''); setWI('');
    if (typeof window !== 'undefined') localStorage.removeItem('kk_wallet');
  };

  const fetchScore = useCallback(async (address?: string) => {
    const target = address || walletInput || connectedWallet || TREASURY;
    setScoreData(null); setSE(null); setSL(true); setShowScore(true);
    try {
      const ctrl = new AbortController(); const t = setTimeout(() => ctrl.abort(), 14000);
      const res  = await fetch(`${API_URL}/api/score/${encodeURIComponent(target)}`, { signal:ctrl.signal });
      clearTimeout(t);
      if (!res.ok) { const b = await res.json().catch(()=>({})); throw new Error(b.error||b.message||`Error ${res.status}`); }
      const raw = await res.json();
      setScoreData({ ledgerScore:raw.ledgerScore||raw.score||650, grade:raw.grade, details:raw.details, scannedAt:raw.scannedAt });
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') setSE('XRPL scan timed out. Try again.');
      else setSE(err instanceof Error ? err.message : 'Scan failed.');
    } finally { setSL(false); }
  }, [walletInput, connectedWallet]);

  const handleLogout = () => { setUser(null); if (typeof window !== 'undefined') localStorage.removeItem('kk_user'); };
  const featured = PRODUCTS.filter(p => p.featured);
  const others   = PRODUCTS.filter(p => !p.featured);

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800;900&family=IBM+Plex+Mono:wght@400;500;600&display=swap');
        *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
        html{scroll-behavior:smooth}body{overflow-x:hidden}
        ::placeholder{color:rgba(255,255,255,.18)!important}
        input,textarea,button,select{font-family:inherit}
        ::-webkit-scrollbar{width:4px}::-webkit-scrollbar-thumb{background:rgba(255,255,255,.1);border-radius:99px}
        ::selection{background:rgba(16,185,129,.28);color:#fff}
        @keyframes popIn{from{opacity:0;transform:scale(.93) translateY(12px)}to{opacity:1;transform:scale(1) translateY(0)}}
        @keyframes shimmer{0%{width:0%;margin-left:0}50%{width:70%;margin-left:0}100%{width:0%;margin-left:100%}}
        @keyframes spin{to{transform:rotate(360deg)}}
        @keyframes pulse{0%,100%{opacity:1;box-shadow:0 0 0 0 rgba(16,185,129,.7)}50%{opacity:.75;box-shadow:0 0 0 6px rgba(16,185,129,0)}}
        @keyframes glow{0%,100%{box-shadow:0 0 20px rgba(16,185,129,.25)}50%{box-shadow:0 0 55px rgba(16,185,129,.6)}}
        @keyframes float{0%,100%{transform:translateY(0)}50%{transform:translateY(-8px)}}
        @keyframes borderPulse{0%,100%{border-color:rgba(16,185,129,.22)}50%{border-color:rgba(16,185,129,.55)}}
        @keyframes tickerScroll{from{transform:translateX(0)}to{transform:translateX(-50%)}}
        @keyframes strobeColor{0%,100%{color:#fff;text-shadow:0 0 8px rgba(16,185,129,.3)}25%{color:#34d399}50%{color:#10b981}75%{color:#6ee7b7}}
        .ticker-strobe{animation:strobeColor 4s ease-in-out infinite}
        .pcard-featured{transition:transform .22s,box-shadow .22s;cursor:pointer}.pcard-featured:hover{transform:translateY(-6px);box-shadow:0 0 60px rgba(16,185,129,.18),0 28px 70px rgba(0,0,0,.6)!important}
        .pcard{transition:transform .22s,box-shadow .22s;cursor:pointer}.pcard:hover{transform:translateY(-4px);box-shadow:0 0 40px rgba(16,185,129,.1),0 20px 50px rgba(0,0,0,.5)!important}
        .navbtn{padding:8px 16px;border-radius:99px;font-weight:600;font-size:13px;cursor:pointer;border:1px solid rgba(255,255,255,.12);background:rgba(255,255,255,.05);color:rgba(255,255,255,.62);transition:all .15s;white-space:nowrap}.navbtn:hover{background:rgba(255,255,255,.1);color:#fff}
        .hero-p:hover{transform:scale(1.04);box-shadow:0 0 55px rgba(255,255,255,.25)!important}
        .hero-g:hover{background:rgba(255,255,255,.1)!important;border-color:rgba(255,255,255,.35)!important}
        .score-inp:focus{border-color:rgba(16,185,129,.5)!important}
        .footer-lnk{background:none;border:none;color:rgba(255,255,255,.38);font-size:13px;cursor:pointer;font-family:inherit;padding:0;transition:color .15s}.footer-lnk:hover{color:#fff}
        .xaman-banner{display:inline-flex;align-items:center;gap:10px;background:linear-gradient(90deg,rgba(16,185,129,.14),rgba(16,185,129,.04));border:1px solid rgba(16,185,129,.28);border-radius:99px;padding:8px 18px;font-size:13px;font-weight:600;color:#10b981;text-decoration:none;transition:all .18s;cursor:pointer}.xaman-banner:hover{background:rgba(16,185,129,.22);border-color:#10b981;transform:translateY(-1px)}
        .wallet-btn{padding:8px 18px;border-radius:99px;font-family:inherit;font-weight:700;font-size:13px;cursor:pointer;border:1px solid rgba(16,185,129,.35);background:rgba(16,185,129,.12);color:#10b981;transition:all .15s;white-space:nowrap;display:inline-flex;align-items:center;gap:6px}.wallet-btn:hover{background:rgba(16,185,129,.22);border-color:#10b981}
        .neural-surface{background-image:linear-gradient(to bottom,rgba(3,4,14,.68) 0%,rgba(3,4,14,.80) 100%),url('${NEURAL_BG}');background-size:cover;background-position:center;background-repeat:no-repeat;background-attachment:local}
        .tp-badge{display:inline-flex;align-items:center;gap:7px;background:rgba(0,182,122,.10);border:1px solid rgba(0,182,122,.28);border-radius:99px;padding:6px 14px;text-decoration:none;transition:all .18s;white-space:nowrap}.tp-badge:hover{background:rgba(0,182,122,.20);border-color:rgba(0,182,122,.55);transform:translateY(-1px)}
        .nav-desktop{display:flex}.nav-mobile-toggle{display:none}.nav-tagline-full{display:inline}.nav-tagline-mobile{display:none}.nav-mobile-drawer{display:none}
        @media(max-width:880px){.nav-desktop{display:none}.nav-mobile-toggle{display:flex}.nav-tagline-full{display:none}.nav-tagline-mobile{display:inline}.nav-mobile-drawer{display:flex;flex-direction:column;gap:8px;padding:16px;background:rgba(3,3,10,.95);border-top:1px solid rgba(255,255,255,.08);backdrop-filter:blur(20px)}.nav-mobile-drawer .navbtn,.nav-mobile-drawer .wallet-btn{width:100%;text-align:center;padding:12px;justify-content:center}}
        @media(max-width:600px){h1{letter-spacing:-2px!important}.section-pad{padding-left:16px!important;padding-right:16px!important}.hero-buttons{flex-direction:column}.hero-buttons button{width:100%}}
      `}</style>

      <div style={{ position:'fixed',inset:0,zIndex:-1,background:'#030310' }} />

      <div style={{ minHeight:'100vh',fontFamily:"'Syne',sans-serif",color:'#eeeef5' }}>

        {/* NAV */}
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
              {connectedWallet
                ? <button className="wallet-btn" onClick={disconnectWallet} title="Disconnect wallet"><span style={{ width:6,height:6,borderRadius:'50%',background:'#10b981',boxShadow:'0 0 6px #10b981' }} />{trunc(connectedWallet)} ✕</button>
                : <button className="wallet-btn" onClick={()=>setShowConnect(true)}>🔐 Connect Wallet</button>
              }
              <button className="navbtn" onClick={()=>setShowDonate(true)}>Donate</button>
              <button className="navbtn" onClick={()=>setShowGrant(true)}>Apply for Grant</button>
              {user?<><span style={{ fontSize:12,color:'rgba(255,255,255,.42)',maxWidth:80,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap' }}>{user.name||user.email}</span><button className="navbtn" onClick={handleLogout}>Log Out</button></>:<button className="navbtn" onClick={()=>setShowLogin(true)}>Log In</button>}
              <button onClick={()=>fetchScore()} style={{ padding:'8px 18px',borderRadius:99,fontFamily:'inherit',fontWeight:700,fontSize:13,cursor:'pointer',border:'none',background:'#10b981',color:'#000',transition:'all .15s',whiteSpace:'nowrap' }}>Get LedgerScore</button>
            </div>
            <button className="nav-mobile-toggle" onClick={()=>setMM(!mobileMenu)} style={{ alignItems:'center',justifyContent:'center',width:42,height:42,borderRadius:10,background:'rgba(16,185,129,.12)',border:'1px solid rgba(16,185,129,.28)',color:'#10b981',cursor:'pointer',fontSize:20,fontWeight:700 }} aria-label="Menu">{mobileMenu?'✕':'☰'}</button>
          </div>
          {mobileMenu && (
            <div className="nav-mobile-drawer">
              {connectedWallet
                ? <button className="wallet-btn" onClick={()=>{disconnectWallet();setMM(false);}}><span style={{ width:6,height:6,borderRadius:'50%',background:'#10b981',boxShadow:'0 0 6px #10b981' }} />{trunc(connectedWallet)} ✕</button>
                : <button className="wallet-btn" onClick={()=>{setShowConnect(true);setMM(false);}}>🔐 Connect Wallet</button>
              }
              <a className="xaman-banner" href={XAMAN_DL} target="_blank" rel="noopener noreferrer" style={{ justifyContent:'center' }}><span style={{ width:6,height:6,borderRadius:'50%',background:'#10b981',boxShadow:'0 0 8px #10b981',animation:'pulse 2.5s infinite' }} />Get Xaman — Free →</a>
              <button className="navbtn" onClick={()=>{setShowDonate(true);setMM(false);}}>Donate</button>
              <button className="navbtn" onClick={()=>{setShowGrant(true);setMM(false);}}>Apply for Grant</button>
              {user?<button className="navbtn" onClick={()=>{handleLogout();setMM(false);}}>Log Out</button>:<button className="navbtn" onClick={()=>{setShowLogin(true);setMM(false);}}>Log In</button>}
              <button onClick={()=>{fetchScore();setMM(false);}} style={{ padding:'12px',borderRadius:99,fontFamily:'inherit',fontWeight:700,fontSize:14,cursor:'pointer',border:'none',background:'#10b981',color:'#000' }}>Get LedgerScore</button>
            </div>
          )}
        </nav>

        <TickerBar />

        {/* HERO */}
        <section className="section-pad" style={{ textAlign:'center',padding:'72px 24px 60px',position:'relative',overflow:'hidden' }}>
          <div style={{ position:'absolute',top:'35%',left:'50%',transform:'translate(-50%,-50%)',width:'min(700px,95vw)',height:'min(700px,95vw)',borderRadius:'50%',background:'radial-gradient(circle,rgba(16,185,129,.07) 0%,transparent 68%)',pointerEvents:'none',animation:'float 9s ease-in-out infinite' }} />
          <h1 style={{ fontSize:'clamp(48px,11vw,140px)',fontWeight:900,letterSpacing:'-4px',lineHeight:.95,marginBottom:10 }}>
            <span style={{ background:'linear-gradient(135deg,#10b981,#34d399,#6ee7b7)',WebkitBackgroundClip:'text',WebkitTextFillColor:'transparent',backgroundClip:'text' }}>Kredit Karma</span>
          </h1>
          <div style={{ fontSize:'clamp(11px,1.8vw,16px)',fontWeight:800,letterSpacing:'.35em',textTransform:'uppercase',color:'rgba(255,255,255,.28)',marginBottom:20,fontFamily:"'IBM Plex Mono',monospace" }}>
            ON BLOCKCHAIN
          </div>
          <div style={{ display:'flex',flexWrap:'wrap',gap:'8px 14px',justifyContent:'center',marginBottom:24,maxWidth:680,margin:'0 auto 24px' }}>
            {['Community Grants','LedgerScore','XRPL Services'].map((kw,i)=>(
              <span key={kw} style={{ fontSize:13,fontWeight:700,color:i%2===0?'#34d399':'#fff',letterSpacing:'.04em',fontFamily:"'IBM Plex Mono',monospace" }}>
                {i>0&&<span style={{ color:'rgba(255,255,255,.2)',marginRight:14 }}>·</span>}{kw}
              </span>
            ))}
          </div>

          {/* Connect Wallet CTA */}
          <div style={{ marginBottom:20 }}>
            {connectedWallet
              ? <div style={{ display:'inline-flex',alignItems:'center',gap:10,background:'rgba(16,185,129,.12)',border:'1px solid rgba(16,185,129,.3)',borderRadius:99,padding:'10px 22px' }}>
                  <span style={{ width:8,height:8,borderRadius:'50%',background:'#10b981',boxShadow:'0 0 10px #10b981',animation:'pulse 2s infinite' }} />
                  <span style={{ fontSize:14,fontWeight:700,color:'#10b981',fontFamily:"'IBM Plex Mono',monospace" }}>{trunc(connectedWallet)}</span>
                  <span style={{ fontSize:12,color:'rgba(255,255,255,.4)' }}>connected</span>
                </div>
              : <button onClick={()=>setShowConnect(true)} style={{ display:'inline-flex',alignItems:'center',gap:10,background:'rgba(16,185,129,.14)',border:'1px solid rgba(16,185,129,.3)',borderRadius:99,padding:'12px 26px',fontSize:15,fontWeight:700,color:'#10b981',cursor:'pointer',fontFamily:'inherit',transition:'all .18s' }}>
                  🔐 Connect Xaman Wallet
                </button>
            }
          </div>

          <div style={{ marginBottom:32 }}>
            <a className="xaman-banner" href={XAMAN_DL} target="_blank" rel="noopener noreferrer" style={{ fontSize:14,padding:'10px 22px' }}>
              📲 Xaman Wallet Required — Download Free (iOS / Android) →
            </a>
          </div>

          <div className="hero-buttons" style={{ display:'flex',gap:12,justifyContent:'center',flexWrap:'wrap',marginBottom:40 }}>
            <button className="hero-p" onClick={()=>fetchScore()} style={{ display:'inline-flex',alignItems:'center',gap:8,padding:'16px 32px',background:'#fff',color:'#000',fontSize:16,fontWeight:700,borderRadius:99,border:'none',cursor:'pointer',transition:'all .18s',boxShadow:'0 4px 28px rgba(255,255,255,.12)' }}>
              {connectedWallet?'Get My LedgerScore →':'Get My Free LedgerScore →'}
            </button>
            <button className="hero-g" onClick={()=>document.getElementById('products')?.scrollIntoView({behavior:'smooth'})} style={{ display:'inline-flex',alignItems:'center',gap:8,padding:'16px 32px',border:'1.5px solid rgba(255,255,255,.22)',color:'#fff',fontSize:16,fontWeight:600,borderRadius:99,background:'transparent',cursor:'pointer',transition:'all .18s',backdropFilter:'blur(8px)' }}>
              Browse Services ↓
            </button>
          </div>

          <div style={{ display:'flex',gap:'18px 32px',justifyContent:'center',flexWrap:'wrap' }}>
            {[['42,891','LedgerScores'],['$1.2M','Grants Funded'],['0%','Overhead'],['1 Swipe','Checkout'],['10','XRPL Services']].map(([n,l])=>(
              <div key={l} style={{ textAlign:'center' }}>
                <div style={{ fontSize:'clamp(20px,4vw,26px)',fontWeight:900,color:'#10b981',lineHeight:1,textShadow:'0 0 30px rgba(16,185,129,.5)' }}>{n}</div>
                <div style={{ fontSize:10,color:'rgba(255,255,255,.35)',marginTop:4,textTransform:'uppercase',letterSpacing:'.08em' }}>{l}</div>
              </div>
            ))}
          </div>
        </section>

        {/* PRODUCTS */}
        <section id="products" className="section-pad" style={{ padding:'0 24px 72px',maxWidth:1280,margin:'0 auto' }}>
          <div style={{ textAlign:'center',marginBottom:40 }}>
            <div style={{ display:'inline-flex',alignItems:'center',gap:6,marginBottom:12 }}>
              <span style={{ width:5,height:5,borderRadius:'50%',background:'#10b981',boxShadow:'0 0 8px #10b981' }} />
              <span style={{ fontSize:11,fontWeight:700,color:'#10b981',letterSpacing:'.14em',textTransform:'uppercase' }}>XRPL Amendment Services</span>
            </div>
            <h2 style={{ fontSize:'clamp(24px,4vw,42px)',fontWeight:900,letterSpacing:'-2px',marginBottom:12 }}>AI-delivered on-chain protection</h2>
            <p style={{ fontSize:14,color:'rgba(255,255,255,.44)',maxWidth:520,margin:'0 auto' }}>Pay with one swipe in Xaman → AI verifies on XRPL mainnet → service activates automatically.</p>
          </div>
          {/* Featured 3 */}
          <div style={{ display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(280px,1fr))',gap:18,marginBottom:18 }}>
            {featured.map(p=>(
              <div key={p.id} className="pcard-featured" onClick={()=>setAP(p)} style={{ background:`linear-gradient(135deg,${p.color}10,rgba(6,6,22,.8))`,border:`1px solid ${p.color}30`,borderRadius:22,padding:26,position:'relative',overflow:'hidden' }}>
                <div style={{ position:'absolute',top:-30,right:-30,width:150,height:150,borderRadius:'50%',background:`radial-gradient(circle,${p.color}14 0%,transparent 70%)`,pointerEvents:'none' }} />
                <div style={{ width:50,height:50,borderRadius:14,background:`${p.color}18`,border:`1px solid ${p.color}28`,display:'flex',alignItems:'center',justifyContent:'center',fontSize:24,marginBottom:14,animation:'float 4s ease-in-out infinite' }}>{p.emoji}</div>
                <div style={{ fontSize:9,fontWeight:700,color:p.color,letterSpacing:'.13em',textTransform:'uppercase',marginBottom:7,fontFamily:"'IBM Plex Mono',monospace" }}>{p.amendment}</div>
                <h3 style={{ fontSize:18,fontWeight:900,marginBottom:8 }}>{p.name}</h3>
                <p style={{ fontSize:12,color:'rgba(255,255,255,.46)',lineHeight:1.7,marginBottom:16 }}>{p.tagline}</p>
                <ul style={{ listStyle:'none',marginBottom:20 }}>
                  {p.features.slice(0,3).map(f=><li key={f} style={{ fontSize:11,color:'rgba(255,255,255,.48)',marginBottom:5,display:'flex',alignItems:'center',gap:7 }}><span style={{ color:p.color,fontSize:10 }}>✓</span>{f}</li>)}
                </ul>
                <div style={{ display:'flex',alignItems:'center',justifyContent:'space-between',borderTop:`1px solid ${p.color}18`,paddingTop:14,gap:8,flexWrap:'wrap' }}>
                  <div><span style={{ fontSize:20,fontWeight:900,color:p.color }}>{p.priceRLUSD} RLUSD</span><span style={{ fontSize:11,color:'rgba(255,255,255,.3)',marginLeft:8 }}>or {p.priceXRP} XRP</span></div>
                  <button style={{ padding:'8px 16px',borderRadius:99,background:p.color,color:'#000',border:'none',fontWeight:800,fontSize:12,cursor:'pointer',fontFamily:'inherit' }}>Buy Now →</button>
                </div>
              </div>
            ))}
          </div>
          {/* Others */}
          <div style={{ display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(240px,1fr))',gap:14 }}>
            {others.map(p=>(
              <div key={p.id} className="pcard" onClick={()=>setAP(p)} style={{ background:'rgba(6,6,22,.72)',backdropFilter:'blur(16px)',border:`1px solid ${p.color}20`,borderRadius:18,padding:20,position:'relative',overflow:'hidden' }}>
                {p.comingSoon&&<div style={{ position:'absolute',top:12,right:12,background:p.color,color:'#000',fontSize:9,fontWeight:800,padding:'3px 9px',borderRadius:99,animation:'pulse 2.5s infinite' }}>SOON</div>}
                <div style={{ display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:12 }}>
                  <div style={{ width:42,height:42,borderRadius:12,background:`${p.color}18`,border:`1px solid ${p.color}25`,display:'flex',alignItems:'center',justifyContent:'center',fontSize:20 }}>{p.emoji}</div>
                  {!p.comingSoon&&<span style={{ fontSize:9,fontWeight:700,color:p.color,fontFamily:"'IBM Plex Mono',monospace",textTransform:'uppercase',letterSpacing:'.09em',border:`1px solid ${p.color}28`,borderRadius:99,padding:'3px 8px' }}>{(p as {isMonthly?:boolean}).isMonthly?'Monthly':'On-chain'}</span>}
                </div>
                <div style={{ fontSize:9,color:p.color,fontFamily:"'IBM Plex Mono',monospace",fontWeight:700,letterSpacing:'.1em',textTransform:'uppercase',marginBottom:5 }}>{p.amendment}</div>
                <h3 style={{ fontSize:15,fontWeight:800,marginBottom:5 }}>{p.name}</h3>
                <p style={{ fontSize:11,color:'rgba(255,255,255,.42)',lineHeight:1.6,marginBottom:12 }}>{p.tagline}</p>
                <div style={{ display:'flex',alignItems:'center',justifyContent:'space-between',paddingTop:12,borderTop:`1px solid ${p.color}15`,gap:8,flexWrap:'wrap' }}>
                  {p.comingSoon?<span style={{ fontSize:12,fontWeight:800,color:p.color }}>Pre-register free</span>:<span style={{ fontSize:15,fontWeight:900,color:p.color }}>{p.priceRLUSD} RLUSD{(p as {isMonthly?:boolean}).isMonthly?'/mo':''}</span>}
                  <button style={{ padding:'6px 14px',borderRadius:99,background:`${p.color}18`,border:`1px solid ${p.color}28`,color:p.color,fontWeight:700,fontSize:11,cursor:'pointer',fontFamily:'inherit' }}>
                    {p.comingSoon?'🔔 Notify →':(p as {isMonthly?:boolean}).isMonthly?'Subscribe →':'Buy →'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* LEDGERSCORE */}
        <section id="score" className="section-pad" style={{ padding:'0 24px 72px',maxWidth:1240,margin:'0 auto' }}>
          <div style={{ background:'linear-gradient(135deg,rgba(16,185,129,.07),rgba(6,6,22,.8))',border:'1px solid rgba(16,185,129,.18)',borderRadius:24,padding:'40px 32px',backdropFilter:'blur(20px)',animation:'borderPulse 4s ease-in-out infinite' }}>
            <div style={{ display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(300px,1fr))',gap:36,alignItems:'center' }}>
              <div>
                <div style={{ display:'inline-flex',alignItems:'center',gap:6,marginBottom:14 }}>
                  <span style={{ width:5,height:5,borderRadius:'50%',background:'#10b981',boxShadow:'0 0 8px #10b981' }} />
                  <span style={{ fontSize:11,fontWeight:700,color:'#10b981',letterSpacing:'.14em',textTransform:'uppercase' }}>LedgerScore — World First</span>
                </div>
                <h2 style={{ fontSize:'clamp(24px,3.5vw,40px)',fontWeight:900,letterSpacing:'-2px',marginBottom:14 }}>On-chain credit score.<br />No SSN. No bureau. Just truth.</h2>
                <p style={{ fontSize:13,color:'rgba(255,255,255,.5)',lineHeight:1.8,marginBottom:20 }}>300–850. Scanned live from XRPL mainnet. {connectedWallet?'Your wallet is connected — tap Check Score.':'Connect your wallet or paste any XRPL address below.'}</p>
                <div style={{ display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(140px,1fr))',gap:9,marginBottom:22 }}>
                  {[['Live XRPL Scan','Real data every time'],['300–850 Scale','New global standard'],['8 Signal Types','Comprehensive scoring'],['Permanent','On-chain forever']].map(([t,d])=>(
                    <div key={t} style={{ background:'rgba(255,255,255,.04)',border:'1px solid rgba(255,255,255,.07)',borderRadius:11,padding:'11px 13px' }}>
                      <div style={{ fontSize:11,fontWeight:700,color:'#10b981',marginBottom:2 }}>{t}</div>
                      <div style={{ fontSize:10,color:'rgba(255,255,255,.38)' }}>{d}</div>
                    </div>
                  ))}
                </div>
                <div style={{ display:'flex',gap:9,flexWrap:'wrap' }}>
                  <input className="score-inp" type="text" value={walletInput} onChange={e=>setWI(e.target.value)} onKeyDown={e=>e.key==='Enter'&&fetchScore(walletInput)} placeholder={connectedWallet?trunc(connectedWallet):"Paste XRPL wallet address…"} style={{ ...INP,flex:1,minWidth:180,borderRadius:99,paddingLeft:20,fontFamily:"'IBM Plex Mono',monospace",fontSize:12 }} />
                  <button onClick={()=>fetchScore(walletInput||connectedWallet)} style={{ padding:'12px 22px',borderRadius:99,background:'#10b981',color:'#000',border:'none',fontWeight:800,fontSize:13,cursor:'pointer',fontFamily:'inherit',whiteSpace:'nowrap' }}>Check Score →</button>
                </div>
                {!connectedWallet&&<p style={{ fontSize:11,color:'rgba(255,255,255,.28)',marginTop:10 }}>or <button onClick={()=>setShowConnect(true)} style={{ background:'none',border:'none',color:'#10b981',cursor:'pointer',fontWeight:700,fontSize:11,fontFamily:'inherit',padding:0 }}>connect your Xaman wallet</button> for instant one-tap access</p>}
              </div>
              <div>
                <div style={{ fontSize:11,fontWeight:700,color:'#10b981',letterSpacing:'.1em',textTransform:'uppercase',marginBottom:16 }}>Credit Builder — Monthly on XRPL</div>
                <div style={{ display:'flex',flexDirection:'column',gap:11 }}>
                  {[{name:'Starter',price:'$20 RLUSD/mo',color:'#34d399',sub:'LedgerScore monitoring · Equifax soft · Email alerts'},{name:'Builder',price:'$50 RLUSD/mo',color:'#10b981',sub:'All 3 bureaus soft · Score simulator · Dispute assist',popular:true},{name:'Pro',price:'$100 RLUSD/mo',color:'#f59e0b',sub:'Hard bureau reporting · RLUSD rewards · DeFi pre-approval'}].map(t=>(
                    <div key={t.name} onClick={()=>setAP(PRODUCTS.find(p=>p.id==='credit')||null)} style={{ background:'rgba(255,255,255,.04)',border:`1px solid ${t.color}28`,borderRadius:14,padding:'14px 18px',cursor:'pointer',transition:'all .18s',position:'relative' }} onMouseEnter={e=>(e.currentTarget as HTMLDivElement).style.borderColor=`${t.color}55`} onMouseLeave={e=>(e.currentTarget as HTMLDivElement).style.borderColor=`${t.color}28`}>
                      {t.popular&&<div style={{ position:'absolute',top:-8,right:12,background:'#10b981',color:'#000',fontSize:8,fontWeight:800,padding:'2px 8px',borderRadius:99 }}>POPULAR</div>}
                      <div style={{ display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:4,flexWrap:'wrap',gap:6 }}>
                        <span style={{ fontWeight:800,fontSize:14,color:'#fff' }}>{t.name}</span>
                        <span style={{ fontSize:16,fontWeight:900,color:t.color }}>{t.price}</span>
                      </div>
                      <div style={{ fontSize:11,color:'rgba(255,255,255,.38)',lineHeight:1.5 }}>{t.sub}</div>
                    </div>
                  ))}
                </div>
                <button onClick={()=>setAP(PRODUCTS.find(p=>p.id==='credit')||null)} style={{ ...Btn('green',undefined,{width:'100%',marginTop:14,padding:'13px'}) }}>Subscribe to Credit Builder →</button>
                <p style={{ fontSize:11,color:'rgba(255,255,255,.3)',textAlign:'center',marginTop:8 }}>First blockchain → FICO pathway ever built</p>
              </div>
            </div>
          </div>
        </section>

        {/* GRANTS */}
        <section id="grants" className="section-pad" style={{ padding:'0 24px 72px',maxWidth:1240,margin:'0 auto' }}>
          <div style={{ textAlign:'center',marginBottom:40 }}>
            <div style={{ display:'inline-flex',alignItems:'center',gap:6,marginBottom:12 }}><span style={{ width:5,height:5,borderRadius:'50%',background:'#8b5cf6',boxShadow:'0 0 8px #8b5cf6' }} /><span style={{ fontSize:11,fontWeight:700,color:'#8b5cf6',letterSpacing:'.14em',textTransform:'uppercase' }}>AI-Reviewed Grants</span></div>
            <h2 style={{ fontSize:'clamp(24px,4vw,42px)',fontWeight:900,letterSpacing:'-2px',marginBottom:12 }}>Real people. Real money. Wallet to wallet.</h2>
            <p style={{ fontSize:14,color:'rgba(255,255,255,.44)',maxWidth:520,margin:'0 auto' }}>No NGOs. No dark money. AI reviews every application. 100% verifiable on the XRP Ledger.</p>
          </div>
          <div style={{ display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(300px,1fr))',gap:20 }}>
            <div style={{ background:'linear-gradient(135deg,rgba(16,185,129,.08),rgba(6,6,22,.8))',border:'1px solid rgba(16,185,129,.2)',borderRadius:22,padding:'30px 26px',backdropFilter:'blur(20px)' }}>
              <div style={{ fontSize:40,marginBottom:14,animation:'float 4s ease-in-out infinite' }}>💚</div>
              <h3 style={{ fontSize:21,fontWeight:900,marginBottom:10 }}>Fund the Treasury</h3>
              <p style={{ fontSize:13,color:'rgba(255,255,255,.48)',lineHeight:1.8,marginBottom:22 }}>Send XRP or RLUSD. <strong style={{ color:'#fff' }}>100%</strong> goes to grant recipients. Treasury public on XRPScan.</p>
              <div style={{ display:'flex',gap:18,flexWrap:'wrap',marginBottom:20 }}>{[['0%','Overhead'],['<5s','Transfer'],['∞','On-Chain']].map(([n,l])=><div key={l} style={{ textAlign:'center' }}><div style={{ fontSize:20,fontWeight:900,color:'#10b981' }}>{n}</div><div style={{ fontSize:9,color:'rgba(255,255,255,.32)',textTransform:'uppercase',letterSpacing:'.08em' }}>{l}</div></div>)}</div>
              <div style={{ background:'rgba(16,185,129,.1)',border:'1px solid rgba(16,185,129,.3)',borderRadius:11,padding:'10px 13px',marginBottom:8,display:'flex',alignItems:'center',gap:8,flexWrap:'wrap' }}><span style={{ fontSize:9,fontWeight:700,color:'#10b981',textTransform:'uppercase',fontFamily:"'IBM Plex Mono',monospace" }}>XRPNS</span><code style={{ fontSize:13,color:'#10b981',fontWeight:700,fontFamily:"'IBM Plex Mono',monospace",wordBreak:'break-all' }}>{TREASURY_DOMAIN}</code></div>
              <div style={{ background:'rgba(16,185,129,.06)',border:'1px solid rgba(16,185,129,.15)',borderRadius:11,padding:'9px 13px',marginBottom:18 }}><code style={{ fontSize:10,color:'#34d399',wordBreak:'break-all',fontFamily:"'IBM Plex Mono',monospace" }}>{TREASURY}</code></div>
              <button onClick={()=>setShowDonate(true)} style={{ ...Btn('green',undefined,{width:'100%',padding:'14px',fontSize:15}) }}>Donate — Scan QR in Xaman →</button>
            </div>
            <div style={{ background:'linear-gradient(135deg,rgba(139,92,246,.08),rgba(6,6,22,.8))',border:'1px solid rgba(139,92,246,.2)',borderRadius:22,padding:'30px 26px',backdropFilter:'blur(20px)' }}>
              <div style={{ fontSize:40,marginBottom:14,animation:'float 4s ease-in-out infinite',animationDelay:'1s' }}>❤️</div>
              <h3 style={{ fontSize:21,fontWeight:900,marginBottom:10 }}>Apply for Emergency Aid</h3>
              <p style={{ fontSize:13,color:'rgba(255,255,255,.48)',lineHeight:1.8,marginBottom:22 }}>Need help? Apply for $25–$100. AI reviews within 24 hours. Approved funds go directly to your XRPL wallet.</p>
              <div style={{ display:'flex',flexDirection:'column',gap:7,marginBottom:22 }}>{['Submit a help form','AI reviews using community treasury','Help is on the way — direct to wallet','No bank account, no ID required'].map(f=><div key={f} style={{ display:'flex',alignItems:'center',gap:8,fontSize:12,color:'rgba(255,255,255,.52)' }}><span style={{ color:'#8b5cf6',fontSize:11 }}>✓</span>{f}</div>)}</div>
              <button onClick={()=>setShowGrant(true)} style={{ ...Btn('color','#8b5cf6',{width:'100%',padding:'14px',fontSize:15}) }}>Apply for Emergency Grant →</button>
            </div>
          </div>
        </section>

        {/* WHY XRPL */}
        <section className="section-pad" style={{ padding:'0 24px 72px',maxWidth:1240,margin:'0 auto' }}>
          <div style={{ background:'rgba(6,6,22,.72)',backdropFilter:'blur(20px)',border:'1px solid rgba(255,255,255,.08)',borderRadius:22,padding:'36px 28px',textAlign:'center' }}>
            <div style={{ display:'inline-flex',alignItems:'center',gap:6,marginBottom:14 }}><span style={{ width:5,height:5,borderRadius:'50%',background:'#10b981',boxShadow:'0 0 8px #10b981' }} /><span style={{ fontSize:11,fontWeight:700,color:'#10b981',letterSpacing:'.14em',textTransform:'uppercase' }}>Why XRPL</span></div>
            <h2 style={{ fontSize:'clamp(22px,3.5vw,36px)',fontWeight:900,letterSpacing:'-2px',marginBottom:14 }}>The only blockchain built for this.</h2>
            <p style={{ fontSize:13,color:'rgba(255,255,255,.44)',maxWidth:480,margin:'0 auto 32px',lineHeight:1.7 }}>Over a decade of continuous operation. Sub-cent fees. 3–5 second finality.</p>
            <div style={{ display:'flex',justifyContent:'center',gap:'16px 28px',flexWrap:'wrap' }}>
              {[['3–5s','Finality'],['$0.000001','Avg Fee'],['10+','Years Live'],['1,500','TPS'],['0.0079kWh','Per TX']].map(([v,l])=>(
                <div key={l} style={{ textAlign:'center',minWidth:80 }}><div style={{ fontSize:'clamp(20px,3vw,26px)',fontWeight:900,color:'#10b981',textShadow:'0 0 28px rgba(16,185,129,.5)' }}>{v}</div><div style={{ fontSize:10,color:'rgba(255,255,255,.35)',marginTop:4,textTransform:'uppercase',letterSpacing:'.08em' }}>{l}</div></div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="section-pad" style={{ padding:'0 24px 64px',maxWidth:820,margin:'0 auto',textAlign:'center' }}>
          <div style={{ background:'linear-gradient(135deg,rgba(16,185,129,.1),rgba(6,6,22,.85))',border:'1px solid rgba(16,185,129,.24)',borderRadius:24,padding:'48px 32px',backdropFilter:'blur(20px)' }}>
            <h2 style={{ fontSize:'clamp(24px,5vw,46px)',fontWeight:900,letterSpacing:'-2.5px',lineHeight:1.06,marginBottom:14 }}>Your wallet has a story.<br /><span style={{ color:'#10b981' }}>Let the ledger score it.</span></h2>
            <p style={{ fontSize:14,color:'rgba(255,255,255,.44)',marginBottom:28,lineHeight:1.7 }}>Free. No SSN. No bank account. 100% on-chain.</p>
            <div className="hero-buttons" style={{ display:'flex',gap:12,justifyContent:'center',flexWrap:'wrap' }}>
              <button className="hero-p" onClick={()=>fetchScore()} style={{ display:'inline-flex',alignItems:'center',gap:8,padding:'15px 30px',background:'#fff',color:'#000',fontSize:15,fontWeight:700,borderRadius:99,border:'none',cursor:'pointer',transition:'all .18s',boxShadow:'0 4px 28px rgba(255,255,255,.12)' }}>Get Free LedgerScore →</button>
              <button className="hero-g" onClick={()=>setShowDonate(true)} style={{ display:'inline-flex',alignItems:'center',gap:8,padding:'15px 30px',border:'1.5px solid rgba(255,255,255,.22)',color:'#fff',fontSize:15,fontWeight:600,borderRadius:99,background:'transparent',cursor:'pointer',transition:'all .18s' }}>💚 Fund a Grant</button>
            </div>
            <p style={{ fontSize:11,color:'rgba(255,255,255,.22)',marginTop:20 }}>Seeking institutional partnerships · <a href="mailto:partners@kreditkarma.us" style={{ color:'#10b981' }}>partners@kreditkarma.us</a></p>
          </div>
        </section>

        {/* FOOTER — neural bg, Trustpilot, nothing below */}
        <footer className="neural-surface" style={{ backdropFilter:'blur(14px)',borderTop:'1px solid rgba(255,255,255,.07)',padding:'32px 24px 24px' }}>
          <div style={{ maxWidth:1240,margin:'0 auto' }}>
            <div style={{ display:'flex',justifyContent:'space-between',alignItems:'center',flexWrap:'wrap',gap:18,marginBottom:20 }}>
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
                <a href={XAMAN_DL} target="_blank" rel="noopener noreferrer" className="footer-lnk" style={{ color:'#10b981',textDecoration:'none' }}>📲 Get Xaman</a>
                <button className="footer-lnk" onClick={()=>setShowAbout(true)}>About</button>
                <button className="footer-lnk" onClick={()=>setShowFaq(true)}>FAQ</button>
                <button className="footer-lnk" onClick={()=>setShowTerms(true)}>Terms</button>
                <button className="footer-lnk" onClick={()=>setShowPrivacy(true)}>Privacy</button>
                <a href="mailto:support@kreditkarma.us" style={{ fontSize:13,color:'rgba(255,255,255,.38)',textDecoration:'none' }}>support@kreditkarma.us</a>
                <a href={`https://xrpscan.com/account/${TREASURY}`} target="_blank" rel="noopener noreferrer" style={{ fontSize:11,color:'#10b981',textDecoration:'none',display:'flex',alignItems:'center',gap:5,fontFamily:"'IBM Plex Mono',monospace" }}>
                  <span style={{ width:5,height:5,borderRadius:'50%',background:'#10b981',animation:'pulse 2.5s infinite' }} />Treasury Live ↗
                </a>
              </div>
            </div>
            <div style={{ borderTop:'1px solid rgba(255,255,255,.06)',paddingTop:16,display:'flex',alignItems:'center',justifyContent:'center' }}>
              <a href="https://www.trustpilot.com/review/kreditkarma.us" target="_blank" rel="noopener noreferrer" className="tp-badge">
                <span style={{ display:'inline-flex',alignItems:'center',justifyContent:'center',width:20,height:20,borderRadius:4,background:'#00b67a',fontWeight:900,fontSize:11,color:'#fff',flexShrink:0 }}>★</span>
                <span style={{ display:'flex',flexDirection:'column',gap:1 }}>
                  <span style={{ display:'flex',alignItems:'center',gap:4 }}><span style={{ color:'#00b67a',fontSize:13,letterSpacing:1 }}>★★★★★</span><span style={{ fontSize:12,fontWeight:900,color:'#fff',letterSpacing:'-.3px' }}>Trust<span style={{ color:'#00b67a' }}>pilot</span></span></span>
                  <span style={{ fontSize:10,color:'rgba(255,255,255,.45)',fontWeight:600 }}>Trusted on Trustpilot</span>
                </span>
              </a>
            </div>
          </div>
        </footer>

      </div>

      {/* ALL MODALS */}
      <ConnectWalletModal show={showConnect} onClose={()=>setShowConnect(false)} onConnected={handleWalletConnected} />
      <ScoreModal show={showScore} onClose={()=>setShowScore(false)} scoreData={scoreData} loading={scoreLoading} error={scoreError} onRetry={()=>fetchScore(walletInput||connectedWallet)} walletAddress={walletInput||connectedWallet} />
      <ProductModal show={!!activeProduct} onClose={()=>setAP(null)} product={activeProduct} connectedWallet={connectedWallet} />
      <DonateModal show={showDonate} onClose={()=>setShowDonate(false)} />
      <GrantModal show={showGrant} onClose={()=>setShowGrant(false)} connectedWallet={connectedWallet} />
      <LoginModal show={showLogin} onClose={()=>setShowLogin(false)} onLoggedIn={u=>setUser(u)} />
      <AboutModal show={showAbout} onClose={()=>setShowAbout(false)} />
      <FAQModal show={showFaq} onClose={()=>setShowFaq(false)} />
      <TermsModal show={showTerms} onClose={()=>setShowTerms(false)} />
      <PrivacyModal show={showPrivacy} onClose={()=>setShowPrivacy(false)} />
      <Analytics />
    </>
  );
}
