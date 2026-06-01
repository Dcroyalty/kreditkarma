// src/app/score/page.tsx
// XRPLScore™ deep-dive — the world's first on-chain credit score, full product surface.
'use client';
import React, { useEffect, useState, useCallback } from 'react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || '';

interface BreakdownItem { label: string; signal: string; score: number; weight: string; desc: string; }
interface Recommendation { action: string; points: string; priority: 'high'|'medium'|'low'; }
interface Details {
  accountAgeDays: number; balanceXRP: number; txCount: number;
  trustLineCount?: number; activeTrustLines?: number; hasOffers: boolean; hasAMM: boolean;
  nftCount: number; hasMultiSig: boolean; hasRegKey: boolean; hasDomain: boolean;
  hasEmailHash: boolean; hasEscrow: boolean; dexTxCount: number; ammTxCount: number;
  objectCount: number; reserveXRP: number; sequence: number;
}
interface ScoreData {
  ledgerScore: number; xrplScore: number; grade: string;
  breakdown: BreakdownItem[]; signals: Record<string, number>;
  recommendations: Recommendation[]; percentile: number; percentileLabel: string;
  details: Details; address: string; scannedAt: string;
}
interface ScorePoint { score: number; tier?: string; scannedAt: string; }

const GRADE_COLORS: Record<string,{primary:string;glow:string;label:string}> = {
  Exceptional: { primary:'#10b981', glow:'rgba(16,185,129,.55)', label:'Top of the ledger' },
  Excellent:   { primary:'#34d399', glow:'rgba(52,211,153,.5)',  label:'Strong on-chain reputation' },
  Good:        { primary:'#38bdf8', glow:'rgba(56,189,248,.5)',  label:'Healthy XRPL profile' },
  Fair:        { primary:'#f59e0b', glow:'rgba(245,158,11,.5)',  label:'Room to grow' },
  Building:    { primary:'#a78bfa', glow:'rgba(167,139,250,.5)', label:'Early stage — build from here' },
};

export default function ScoreDeepDivePage() {
  const [wallet, setWallet] = useState('');
  const [user, setUser] = useState<{email:string;name:string}|null>(null);
  const [input, setInput] = useState('');
  const [score, setScore] = useState<ScoreData|null>(null);
  const [history, setHistory] = useState<ScorePoint[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Load session + connected wallet
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const u = localStorage.getItem('xh_user'); const w = localStorage.getItem('xh_wallet') || '';
    if (u) { try { setUser(JSON.parse(u)); } catch {} }
    setWallet(w); setInput(w);
  }, []);

  const fetchScore = useCallback(async (addr: string) => {
    if (!addr) return;
    setLoading(true); setError(''); setScore(null);
    try {
      const [sRes, hRes] = await Promise.all([
        fetch(`${API_URL}/api/score/${encodeURIComponent(addr)}`),
        fetch(`${API_URL}/api/score-history?wallet=${encodeURIComponent(addr)}`).catch(()=>null),
      ]);
      const sData = await sRes.json();
      if (!sRes.ok) throw new Error(sData?.error || 'Score lookup failed');
      setScore(sData);
      if (hRes && hRes.ok) {
        const hData = await hRes.json();
        setHistory(Array.isArray(hData) ? hData : (hData.history || []));
      }
    } catch (e:unknown) { setError(e instanceof Error ? e.message : 'Score lookup failed'); }
    setLoading(false);
  }, []);

  // Auto-fetch when connected wallet is present
  useEffect(() => { if (wallet) fetchScore(wallet); }, [wallet, fetchScore]);

  const handleCheck = () => { if (input) fetchScore(input.trim()); };
  const handleLogout = () => { if (typeof window !== 'undefined') { localStorage.removeItem('xh_user'); window.location.href = '/'; } };

  return (
    <main style={{ minHeight:'100vh', background:'#060616', color:'#fff', fontFamily:'system-ui,-apple-system,sans-serif' }}>
      {/* ── Header ── */}
      <header style={{ borderBottom:'1px solid rgba(255,255,255,.08)', padding:'14px 24px', display:'flex', justifyContent:'space-between', alignItems:'center', flexWrap:'wrap', gap:12 }}>
        <a href="/" style={{ color:'#fff', textDecoration:'none', fontSize:18, fontWeight:900 }}>
          <span style={{ color:'#10b981' }}>xrpl</span><span style={{ color:'#38bdf8' }}>Hub</span><span style={{ color:'#ef4444' }}>.io</span>
        </a>
        <div style={{ display:'flex', alignItems:'center', gap:10 }}>
          <a href="/" style={{ color:'rgba(255,255,255,.55)', textDecoration:'none', fontSize:13 }}>← Home</a>
          {user && <a href="/account" style={{ color:'rgba(255,255,255,.55)', textDecoration:'none', fontSize:13, marginLeft:4 }}>My Account</a>}
          {user && <button onClick={handleLogout} style={{ background:'none', border:'1px solid rgba(255,255,255,.15)', color:'#fff', padding:'7px 14px', borderRadius:99, fontSize:12, cursor:'pointer', fontFamily:'inherit' }}>Log Out</button>}
        </div>
      </header>

      <div style={{ maxWidth:1100, margin:'0 auto', padding:'34px 22px 80px' }}>
        {/* ── Page title ── */}
        <div style={{ marginBottom:24 }}>
          <p style={{ fontSize:11, fontWeight:700, color:'#10b981', letterSpacing:'.16em', textTransform:'uppercase', marginBottom:6, fontFamily:"'IBM Plex Mono',monospace" }}>The XRPLScore™ Deep Dive</p>
          <h1 style={{ fontSize:'clamp(28px,5vw,44px)', fontWeight:900, letterSpacing:'-2px', lineHeight:1.1, marginBottom:8 }}>Your on-chain reputation, scored.</h1>
          <p style={{ fontSize:14, color:'rgba(255,255,255,.5)', lineHeight:1.7, maxWidth:680 }}>Computed live from XRPL mainnet across 8 proprietary signals. No FICO. No bureau. No SSN. Just verifiable activity, weighted by what actually matters on the XRP Ledger.</p>
        </div>

        {/* ── Wallet input ── */}
        <div style={{ display:'flex', gap:8, flexWrap:'wrap', marginBottom:28 }}>
          <input type="text" value={input} onChange={e=>setInput(e.target.value)} onKeyDown={e=>e.key==='Enter'&&handleCheck()}
            placeholder="Paste any XRPL wallet (rXXX…)" style={{ flex:1, minWidth:220, background:'rgba(255,255,255,.06)', border:'1px solid rgba(255,255,255,.13)', borderRadius:99, padding:'13px 22px', fontSize:13, color:'#fff', outline:'none', fontFamily:"'IBM Plex Mono',monospace" }} />
          <button onClick={handleCheck} disabled={loading} style={{ padding:'13px 24px', borderRadius:99, background:'#10b981', color:'#000', border:'none', fontWeight:800, fontSize:13, cursor:loading?'wait':'pointer', fontFamily:'inherit', opacity:loading?.6:1 }}>{loading?'Scanning…':'Check Score →'}</button>
        </div>

        {error && <div style={{ background:'rgba(239,68,68,.1)', border:'1px solid rgba(239,68,68,.3)', borderRadius:12, padding:'14px 18px', color:'#fca5a5', marginBottom:24 }}>⚠️ {error}</div>}

        {/* ── Empty state ── */}
        {!score && !loading && !error && (
          <div style={{ background:'rgba(255,255,255,.025)', border:'1px solid rgba(255,255,255,.08)', borderRadius:18, padding:'42px 22px', textAlign:'center' }}>
            <div style={{ fontSize:54, marginBottom:14 }}>📊</div>
            <h2 style={{ fontSize:20, fontWeight:800, marginBottom:8 }}>Enter any XRPL wallet to begin</h2>
            <p style={{ fontSize:13, color:'rgba(255,255,255,.5)', maxWidth:480, margin:'0 auto', lineHeight:1.7 }}>Your XRPLScore is computed instantly from public ledger data — no signup, no signing required. Subscribers to the Builder tier see their score climb over time as their on-chain history grows.</p>
          </div>
        )}

        {loading && (
          <div style={{ textAlign:'center', padding:'60px 20px' }}>
            <div style={{ fontSize:42, marginBottom:14, animation:'spin 1.6s linear infinite', display:'inline-block' }}>📡</div>
            <p style={{ color:'#10b981', fontWeight:700, fontSize:15 }}>Scanning XRPL mainnet…</p>
          </div>
        )}

        {/* ── Score reveal ── */}
        {score && <ScoreReveal score={score} history={history} />}

        {/* ── License / IP footer note (subtle) ── */}
        <div style={{ marginTop:48, paddingTop:22, borderTop:'1px solid rgba(255,255,255,.06)', fontSize:11, color:'rgba(255,255,255,.34)', lineHeight:1.7 }}>
          XRPLScore™ methodology and the underlying 8-signal weighting framework are proprietary intellectual property of XRPLHub.io and are available for licensing to financial institutions, DeFi platforms, and on-chain data partners. Inquiries: <a href="mailto:partners@xrplhub.io" style={{ color:'#10b981' }}>partners@xrplhub.io</a>
        </div>
      </div>

      <style jsx>{`
        @keyframes spin { from { transform: rotate(0deg) } to { transform: rotate(360deg) } }
        @keyframes scoreReveal { from { opacity:0; transform:scale(.92) } to { opacity:1; transform:scale(1) } }
      `}</style>
    </main>
  );
}

// ─── SCORE REVEAL ─────────────────────────────────────────────────────────────
function ScoreReveal({ score, history }: { score: ScoreData; history: ScorePoint[] }) {
  const grade = GRADE_COLORS[score.grade] || GRADE_COLORS.Building;
  const pct   = Math.max(0, Math.min(100, ((score.ledgerScore - 300) / 550) * 100));
  return (
    <div style={{ animation:'scoreReveal .6s ease-out' }}>
      {/* ── HERO TILE ── */}
      <div style={{ background:`linear-gradient(135deg, ${grade.primary}15, rgba(6,6,22,.85))`, border:`1px solid ${grade.primary}40`, borderRadius:22, padding:'34px 26px', marginBottom:22, position:'relative', overflow:'hidden' }}>
        <div style={{ position:'absolute', top:-60, right:-60, width:240, height:240, borderRadius:'50%', background:`radial-gradient(circle, ${grade.primary}22 0%, transparent 70%)`, pointerEvents:'none' }} />
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(220px,1fr))', gap:24, alignItems:'center', position:'relative' }}>
          <div>
            <p style={{ fontSize:10, fontWeight:700, color:grade.primary, letterSpacing:'.16em', textTransform:'uppercase', marginBottom:6, fontFamily:"'IBM Plex Mono',monospace" }}>Your XRPLScore™</p>
            <div style={{ fontSize:'clamp(60px,11vw,96px)', fontWeight:900, color:grade.primary, lineHeight:1, letterSpacing:'-3px', textShadow:`0 0 30px ${grade.glow}`, fontFamily:"'IBM Plex Mono',monospace" }}>{score.ledgerScore}</div>
            <p style={{ fontSize:16, fontWeight:800, marginTop:6 }}>{score.grade} <span style={{ color:'rgba(255,255,255,.4)', fontWeight:500 }}>· {grade.label}</span></p>
            <p style={{ fontSize:12, color:'rgba(255,255,255,.4)', marginTop:8, fontFamily:"'IBM Plex Mono',monospace" }}>{score.address.slice(0,10)}…{score.address.slice(-6)}</p>
          </div>
          <div>
            <div style={{ marginBottom:12 }}>
              <div style={{ display:'flex', justifyContent:'space-between', fontSize:10, color:'rgba(255,255,255,.4)', marginBottom:5, fontFamily:"'IBM Plex Mono',monospace" }}><span>300</span><span>575</span><span>850</span></div>
              <div style={{ height:8, background:'rgba(255,255,255,.05)', borderRadius:99, overflow:'hidden', position:'relative' }}>
                <div style={{ height:'100%', width:`${pct}%`, background:`linear-gradient(90deg, ${grade.primary}, ${grade.primary})`, borderRadius:99, transition:'width 1s ease-out', boxShadow:`0 0 14px ${grade.glow}` }} />
              </div>
            </div>
            <div style={{ background:'rgba(255,255,255,.04)', border:'1px solid rgba(255,255,255,.08)', borderRadius:12, padding:'12px 14px' }}>
              <p style={{ fontSize:10, fontWeight:700, color:'rgba(255,255,255,.4)', letterSpacing:'.13em', textTransform:'uppercase', marginBottom:4 }}>Peer percentile</p>
              <p style={{ fontSize:15, fontWeight:800, color:'#fff' }}>{score.percentileLabel}</p>
            </div>
          </div>
        </div>
      </div>

      {/* ── HISTORY SPARKLINE ── */}
      {history.length >= 2 && (
        <div style={{ background:'rgba(255,255,255,.025)', border:'1px solid rgba(255,255,255,.07)', borderRadius:16, padding:'18px 20px', marginBottom:22 }}>
          <p style={{ fontSize:11, fontWeight:700, color:'#10b981', letterSpacing:'.14em', textTransform:'uppercase', marginBottom:10, fontFamily:"'IBM Plex Mono',monospace" }}>Score Trajectory · {history.length} scans</p>
          <Sparkline points={history} color={grade.primary} />
        </div>
      )}

      {/* ── 8 SIGNAL BREAKDOWN ── */}
      <div style={{ background:'rgba(255,255,255,.025)', border:'1px solid rgba(255,255,255,.07)', borderRadius:16, padding:'18px 20px', marginBottom:22 }}>
        <p style={{ fontSize:11, fontWeight:700, color:'#10b981', letterSpacing:'.14em', textTransform:'uppercase', marginBottom:12, fontFamily:"'IBM Plex Mono',monospace" }}>The 8 Proprietary Signals</p>
        <div style={{ display:'grid', gap:10 }}>
          {score.breakdown.map(b => <SignalBar key={b.signal} b={b} primary={grade.primary} />)}
        </div>
      </div>

      {/* ── RECOMMENDATIONS ── */}
      {score.recommendations.length > 0 && (
        <div style={{ background:'rgba(16,185,129,.04)', border:'1px solid rgba(16,185,129,.18)', borderRadius:16, padding:'18px 20px', marginBottom:22 }}>
          <p style={{ fontSize:11, fontWeight:700, color:'#10b981', letterSpacing:'.14em', textTransform:'uppercase', marginBottom:6, fontFamily:"'IBM Plex Mono',monospace" }}>Personalized Recommendations</p>
          <p style={{ fontSize:12, color:'rgba(255,255,255,.5)', marginBottom:14 }}>Take these actions on-chain — your score rescans the moment your wallet activity changes.</p>
          <div style={{ display:'grid', gap:8 }}>
            {score.recommendations.map((r,i) => (
              <div key={i} style={{ display:'flex', alignItems:'center', justifyContent:'space-between', gap:12, padding:'12px 14px', background:'rgba(255,255,255,.03)', border:'1px solid rgba(255,255,255,.06)', borderRadius:11, flexWrap:'wrap' }}>
                <div style={{ flex:1, minWidth:180 }}>
                  <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                    <span style={{ fontSize:9, fontWeight:800, padding:'2px 7px', borderRadius:99, background: r.priority==='high'?'#ef4444':r.priority==='medium'?'#f59e0b':'#34d399', color: r.priority==='high'?'#fff':'#000', textTransform:'uppercase', letterSpacing:'.08em', fontFamily:"'IBM Plex Mono',monospace" }}>{r.priority}</span>
                    <span style={{ fontSize:13, fontWeight:600, color:'#fff' }}>{r.action}</span>
                  </div>
                </div>
                <span style={{ fontSize:13, fontWeight:800, color:'#10b981', fontFamily:"'IBM Plex Mono',monospace", whiteSpace:'nowrap' }}>{r.points}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── ACCOUNT DETAILS ── */}
      <div style={{ background:'rgba(255,255,255,.025)', border:'1px solid rgba(255,255,255,.07)', borderRadius:16, padding:'18px 20px', marginBottom:22 }}>
        <p style={{ fontSize:11, fontWeight:700, color:'#10b981', letterSpacing:'.14em', textTransform:'uppercase', marginBottom:12, fontFamily:"'IBM Plex Mono',monospace" }}>On-Chain Footprint</p>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(150px,1fr))', gap:10 }}>
          <Stat label="Account Age"    value={`${score.details.accountAgeDays} days`} />
          <Stat label="Total TX Count" value={String(score.details.txCount)} />
          <Stat label="XRP Balance"    value={`${score.details.balanceXRP.toFixed(2)}`} />
          <Stat label="Trust Lines"    value={String(score.details.activeTrustLines ?? score.details.trustLineCount ?? '—')} />
          <Stat label="DEX Activity"   value={String(score.details.dexTxCount)} />
          <Stat label="AMM Activity"   value={String(score.details.ammTxCount)} />
          <Stat label="NFTs Held"      value={String(score.details.nftCount)} />
          <Stat label="Multi-Sig"      value={score.details.hasMultiSig ? '✓ Active' : '— None'} good={score.details.hasMultiSig} />
        </div>
      </div>

      {/* ── BUILDER CTA ── */}
      <div style={{ background:'linear-gradient(135deg, rgba(16,185,129,.1), rgba(56,189,248,.06), rgba(6,6,22,.85))', border:'1px solid rgba(16,185,129,.3)', borderRadius:18, padding:'24px 22px', textAlign:'center' }}>
        <p style={{ fontSize:11, fontWeight:700, color:'#10b981', letterSpacing:'.16em', textTransform:'uppercase', marginBottom:6, fontFamily:"'IBM Plex Mono',monospace" }}>XRPLScore Builder</p>
        <h3 style={{ fontSize:'clamp(20px,2.8vw,26px)', fontWeight:900, marginBottom:8 }}>Build your score on-chain. Monthly. Verifiable.</h3>
        <p style={{ fontSize:13, color:'rgba(255,255,255,.55)', maxWidth:520, margin:'0 auto 18px', lineHeight:1.7 }}>Each monthly subscription payment is written to XRPL mainnet and factors into your score. The first reputation builder native to the XRP Ledger.</p>
        <a href="/#products" style={{ display:'inline-block', padding:'13px 26px', borderRadius:99, background:'#10b981', color:'#000', fontWeight:800, fontSize:14, textDecoration:'none' }}>Start Building →</a>
      </div>
    </div>
  );
}

function Stat({ label, value, good }: { label:string; value:string; good?:boolean }) {
  return (
    <div style={{ background:'rgba(255,255,255,.03)', border:'1px solid rgba(255,255,255,.06)', borderRadius:11, padding:'11px 13px' }}>
      <div style={{ fontSize:10, fontWeight:700, color:'rgba(255,255,255,.4)', letterSpacing:'.13em', textTransform:'uppercase', marginBottom:4 }}>{label}</div>
      <div style={{ fontSize:15, fontWeight:800, color:good?'#10b981':'#fff', fontFamily:"'IBM Plex Mono',monospace" }}>{value}</div>
    </div>
  );
}

function SignalBar({ b, primary }: { b: BreakdownItem; primary: string }) {
  const pct = Math.max(0, Math.min(100, b.score));
  const color = pct >= 70 ? '#10b981' : pct >= 45 ? '#f59e0b' : '#ef4444';
  return (
    <div>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'baseline', marginBottom:5, gap:8, flexWrap:'wrap' }}>
        <div>
          <span style={{ fontSize:13, fontWeight:700, color:'#fff' }}>{b.label}</span>
          <span style={{ fontSize:10, color:'rgba(255,255,255,.32)', marginLeft:8, fontFamily:"'IBM Plex Mono',monospace" }}>weight {b.weight}</span>
        </div>
        <span style={{ fontSize:14, fontWeight:800, color, fontFamily:"'IBM Plex Mono',monospace" }}>{pct}/100</span>
      </div>
      <div style={{ height:6, background:'rgba(255,255,255,.05)', borderRadius:99, overflow:'hidden', marginBottom:4 }}>
        <div style={{ height:'100%', width:`${pct}%`, background:color, borderRadius:99, transition:'width .9s ease-out' }} />
      </div>
      <p style={{ fontSize:11, color:'rgba(255,255,255,.38)' }}>{b.desc}</p>
    </div>
  );
}

function Sparkline({ points, color }: { points: ScorePoint[]; color:string }) {
  if (points.length < 2) return null;
  const w = 700, h = 120, pad = 8;
  const scores = points.map(p => p.score);
  const min = Math.min(...scores, 300), max = Math.max(...scores, 850);
  const range = Math.max(max - min, 1);
  const xs = (i:number) => pad + (i / (points.length-1)) * (w - 2*pad);
  const ys = (v:number) => h - pad - ((v - min) / range) * (h - 2*pad);
  const path = points.map((p,i) => `${i===0?'M':'L'}${xs(i).toFixed(1)},${ys(p.score).toFixed(1)}`).join(' ');
  const last = points[points.length - 1];
  const first = points[0];
  const delta = last.score - first.score;
  return (
    <>
      <svg viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" style={{ width:'100%', height:120, display:'block' }}>
        <path d={path} fill="none" stroke={color} strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" />
        <circle cx={xs(points.length-1)} cy={ys(last.score)} r="5" fill={color} />
      </svg>
      <div style={{ display:'flex', justifyContent:'space-between', fontSize:11, color:'rgba(255,255,255,.4)', marginTop:6, fontFamily:"'IBM Plex Mono',monospace" }}>
        <span>First scan: {first.score}</span>
        <span style={{ color: delta >= 0 ? '#10b981' : '#ef4444' }}>{delta >= 0 ? '▲' : '▼'} {Math.abs(delta)} pts</span>
        <span>Latest: <strong style={{ color }}>{last.score}</strong></span>
      </div>
    </>
  );
}
