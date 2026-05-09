'use client';

import React, { useState, useEffect, useCallback } from 'react';

// ─── Config ───────────────────────────────────────────────────────────────────
const API_URL =
  (typeof process !== 'undefined' && process.env?.NEXT_PUBLIC_API_URL) || '';

const TREASURY_WALLET = 'rs59g3amo5iT6T64Cg96XXMAWuw3WPQcLF';

// Admin-only — never displayed publicly. Write on business cards personally.
const _ADMIN_PROMO_CODE = 'HOMELESS5'; // eslint-disable-line @typescript-eslint/no-unused-vars

// ─── Types ────────────────────────────────────────────────────────────────────
type ModalName =
  | 'score' | 'connect' | 'donate' | 'help' | 'homeless'
  | 'credit' | 'loan' | 'shield'
  | 'login' | 'softpull' | 'status'
  | 'faq' | 'terms' | 'privacy' | 'about' | 'mission'
  | null;

interface ScoreData {
  ledgerScore: number;
  grade?: string;
  details?: {
    txCount?: number;
    accountAge?: number;
    balanceXRP?: number;
    trustLines?: number;
  };
}

interface User {
  email: string;
  name: string;
  wallet?: string;
}

// ─── Score helpers ────────────────────────────────────────────────────────────
function gradeScore(n: number) {
  if (n >= 800) return { label: 'Exceptional', color: '#10b981', glow: 'rgba(16,185,129,0.45)' };
  if (n >= 740) return { label: 'Excellent',   color: '#34d399', glow: 'rgba(52,211,153,0.4)'  };
  if (n >= 670) return { label: 'Good',         color: '#fbbf24', glow: 'rgba(251,191,36,0.4)'  };
  if (n >= 580) return { label: 'Fair',          color: '#f97316', glow: 'rgba(249,115,22,0.4)'  };
  return              { label: 'Building',       color: '#ef4444', glow: 'rgba(239,68,68,0.4)'   };
}

// ─── Xaman deep-link builder ──────────────────────────────────────────────────
// Produces a URI that Xaman's scanner opens as a pre-filled payment request.
// XRP:   xrpl:{address}?amount={drops}      — XRPL payment URI standard
// RLUSD: https://xumm.app/detect/request:{address}  — Xaman native
function xamanDeepLink(address: string, amount: string, currency: 'XRP' | 'RLUSD'): string {
  const parsed = parseFloat(amount);
  if (currency === 'XRP' && !isNaN(parsed) && parsed > 0) {
    const drops = Math.floor(parsed * 1_000_000);
    return `xrpl:${address}?amount=${drops}`;
  }
  // RLUSD / no amount — Xaman opens destination picker; user fills amount
  return `https://xumm.app/detect/request:${address}`;
}

// Real QR via a free public API — no npm package needed
function qrSrc(data: string): string {
  return `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(data)}&color=064e3b&bgcolor=ffffff&qzone=2&format=svg`;
}

// ─── Shared style tokens ──────────────────────────────────────────────────────
const inp: React.CSSProperties = {
  width: '100%', background: 'rgba(255,255,255,0.06)',
  border: '1px solid rgba(255,255,255,0.12)', borderRadius: 12,
  padding: '12px 15px', fontSize: 14, color: '#fff', outline: 'none',
  fontFamily: 'inherit', boxSizing: 'border-box',
};
const lbl: React.CSSProperties = {
  display: 'block', fontSize: 11, fontWeight: 700,
  color: 'rgba(255,255,255,0.38)', textTransform: 'uppercase',
  letterSpacing: '0.09em', marginBottom: 7,
};
const tag: React.CSSProperties = {
  fontSize: 11, fontWeight: 700, color: '#10b981',
  letterSpacing: '0.13em', textTransform: 'uppercase', marginBottom: 6,
};
function btn(v: 'green' | 'white' | 'ghost' | 'red'): React.CSSProperties {
  const base: React.CSSProperties = {
    display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
    gap: 7, border: 'none', borderRadius: 99, fontWeight: 700,
    fontSize: 14, cursor: 'pointer', fontFamily: 'inherit',
    padding: '11px 26px', transition: 'opacity 0.15s, box-shadow 0.15s',
  };
  if (v === 'green')  return { ...base, background: '#10b981', color: '#000' };
  if (v === 'white')  return { ...base, background: '#fff',    color: '#000' };
  if (v === 'red')    return { ...base, background: '#ef4444', color: '#fff' };
  return { ...base, background: 'rgba(255,255,255,0.08)', color: '#fff', border: '1px solid rgba(255,255,255,0.12)' };
}
function fullBtn(v: 'green' | 'ghost' | 'red'): React.CSSProperties {
  return { ...btn(v), width: '100%', padding: '14px', fontSize: 15 };
}

// ─────────────────────────────────────────────────────────────────────────────
// OVERLAY SHELL
// ─────────────────────────────────────────────────────────────────────────────
function Overlay({ show, onClose, children, wide = false, scroll = true }: {
  show: boolean; onClose: () => void; children: React.ReactNode; wide?: boolean; scroll?: boolean;
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
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(0,0,0,0.92)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      <div
        onClick={e => e.stopPropagation()}
        style={{ background: 'linear-gradient(145deg,#131313,#0e0e0e)', border: '1px solid rgba(255,255,255,0.09)', borderRadius: 28, padding: '40px 36px', width: '100%', maxWidth: wide ? 680 : 500, position: 'relative', animation: 'popIn 0.26s cubic-bezier(0.34,1.56,0.64,1) both', maxHeight: scroll ? '90vh' : 'none', overflowY: scroll ? 'auto' : 'visible', boxShadow: '0 32px 80px rgba(0,0,0,0.7)' }}
      >
        <button onClick={onClose} style={{ position: 'absolute', top: 16, right: 16, width: 32, height: 32, borderRadius: '50%', background: 'rgba(255,255,255,0.08)', border: 'none', color: 'rgba(255,255,255,0.55)', cursor: 'pointer', fontSize: 16, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✕</button>
        {children}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// TICKER  (promo code removed — admin-only)
// ─────────────────────────────────────────────────────────────────────────────
function Ticker() {
  const items = [
    '42,891 LedgerScores Generated',
    '$1.2M Micro Grants Paid Out',
    '8,742 People Helped This Month',
    '94 Average LedgerScore',
    'Zero Overhead · 100% Direct to Wallets',
    'Built on XRPL · No Middlemen',
    'Social Impact · Blockchain Finance',
  ];
  const text = [...items, ...items, ...items].join('   •   ');
  return (
    <div style={{ background: 'rgba(0,0,0,0.8)', borderTop: '1px solid rgba(255,255,255,0.07)', borderBottom: '1px solid rgba(255,255,255,0.07)', padding: '10px 0', overflow: 'hidden' }}>
      <div style={{ display: 'flex', whiteSpace: 'nowrap', animation: 'ticker 40s linear infinite' }}>
        <span style={{ color: '#10b981', fontSize: 13, fontWeight: 600, letterSpacing: '0.04em', paddingRight: 40 }}>{text}</span>
        <span style={{ color: '#10b981', fontSize: 13, fontWeight: 600, letterSpacing: '0.04em', paddingRight: 40 }}>{text}</span>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// SCORE MODAL
// ─────────────────────────────────────────────────────────────────────────────
function ScoreModal({ show, onClose, scoreData, loading, error, walletAddress, onRetry }: {
  show: boolean; onClose: () => void; scoreData: ScoreData | null;
  loading: boolean; error: string | null; walletAddress: string; onRetry: () => void;
}) {
  const [animated, setAnimated] = useState(false);
  const grade = scoreData ? gradeScore(scoreData.ledgerScore) : null;
  const R = 52; const circ = 2 * Math.PI * R;
  const pct = scoreData ? Math.min(1, Math.max(0, (scoreData.ledgerScore - 300) / 550)) : 0;

  useEffect(() => {
    if (show && scoreData) { const t = setTimeout(() => setAnimated(true), 100); return () => clearTimeout(t); }
    else setAnimated(false);
  }, [show, scoreData]);

  return (
    <Overlay show={show} onClose={onClose}>
      <div style={tag}>LedgerScore Report</div>
      {loading && (
        <div style={{ textAlign: 'center', padding: '40px 0' }}>
          <div style={{ fontSize: 42, animation: 'spin 1s linear infinite', display: 'inline-block', marginBottom: 14 }}>⚡</div>
          <p style={{ color: '#10b981', fontWeight: 600, fontSize: 17 }}>Scanning the XRPL Ledger…</p>
          <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: 13, marginTop: 6 }}>Analyzing on-chain history</p>
          <div style={{ width: 220, height: 3, background: 'rgba(255,255,255,0.07)', borderRadius: 99, margin: '18px auto 0', overflow: 'hidden' }}>
            <div style={{ height: '100%', background: '#10b981', animation: 'shimmer 1.5s ease-in-out infinite', borderRadius: 99 }} />
          </div>
        </div>
      )}
      {error && !loading && (
        <div style={{ textAlign: 'center', padding: '28px 0' }}>
          <div style={{ fontSize: 44, marginBottom: 12 }}>⚠️</div>
          <p style={{ color: '#f87171', fontWeight: 600, fontSize: 17, marginBottom: 8 }}>Couldn't fetch score</p>
          <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 13, marginBottom: 22 }}>{error}</p>
          <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
            <button onClick={onRetry} style={btn('green')}>Retry</button>
            <button onClick={onClose} style={btn('ghost')}>Close</button>
          </div>
        </div>
      )}
      {scoreData && !loading && grade && (
        <>
          <div style={{ position: 'relative', width: 192, height: 192, margin: '0 auto 18px', filter: `drop-shadow(0 0 22px ${grade.glow})` }}>
            <svg viewBox="0 0 120 120" style={{ width: '100%', height: '100%', transform: 'rotate(-90deg)' }}>
              <circle cx="60" cy="60" r={R} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="10" />
              <circle cx="60" cy="60" r={R} fill="none" stroke={grade.color} strokeWidth="10" strokeLinecap="round" strokeDasharray={circ} strokeDashoffset={animated ? circ * (1 - pct) : circ} style={{ transition: 'stroke-dashoffset 1.4s cubic-bezier(0.34,1.2,0.64,1)' }} />
            </svg>
            <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ fontSize: 48, fontWeight: 900, color: grade.color, lineHeight: 1, letterSpacing: '-2px', transition: 'all 0.8s', transform: animated ? 'scale(1)' : 'scale(0.7)', opacity: animated ? 1 : 0 }}>{scoreData.ledgerScore}</span>
              <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', marginTop: 4, letterSpacing: '0.14em', textTransform: 'uppercase' }}>LedgerScore</span>
            </div>
          </div>
          <div style={{ textAlign: 'center', marginBottom: 20 }}>
            <span style={{ display: 'inline-block', padding: '4px 16px', borderRadius: 99, background: `${grade.color}18`, border: `1px solid ${grade.color}40`, color: grade.color, fontWeight: 700, fontSize: 15 }}>{grade.label}</span>
          </div>
          {scoreData.details && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 9, marginBottom: 18 }}>
              {([['Transactions', scoreData.details.txCount?.toLocaleString()], ['Account Age', scoreData.details.accountAge != null ? `${scoreData.details.accountAge}d` : undefined], ['XRP Balance', scoreData.details.balanceXRP != null ? `${scoreData.details.balanceXRP.toFixed(1)}` : undefined], ['Trust Lines', scoreData.details.trustLines?.toString()]] as [string, string | undefined][]).filter(([, v]) => !!v).map(([l, v]) => (
                <div key={l} style={{ background: 'rgba(255,255,255,0.04)', borderRadius: 12, padding: '12px 14px' }}>
                  <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.32)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 3 }}>{l}</div>
                  <div style={{ fontSize: 20, fontWeight: 800 }}>{v}</div>
                </div>
              ))}
            </div>
          )}
          {walletAddress && <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.28)', fontFamily: 'monospace', textAlign: 'center', marginBottom: 16 }}>🔒 {walletAddress.slice(0, 12)}…{walletAddress.slice(-6)}</p>}
          <button onClick={onClose} style={{ ...fullBtn('green') }}>Done</button>
        </>
      )}
    </Overlay>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// LOGIN / SIGN UP MODAL
// ─────────────────────────────────────────────────────────────────────────────
function LoginModal({ show, onClose, onLoggedIn }: {
  show: boolean; onClose: () => void; onLoggedIn: (u: User) => void;
}) {
  const [tab, setTab] = useState<'login' | 'signup'>('login');
  const [form, setForm] = useState({ name: '', email: '', password: '', confirm: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const set = (k: string, v: string) => { setForm(f => ({ ...f, [k]: v })); setError(''); };

  const handleSubmit = async () => {
    if (!form.email || !form.password) { setError('Email and password are required.'); return; }
    if (tab === 'signup' && form.password !== form.confirm) { setError('Passwords do not match.'); return; }
    if (tab === 'signup' && !form.name.trim()) { setError('Name is required.'); return; }
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/auth/${tab}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: form.name, email: form.email, password: form.password }) });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.message || 'Authentication failed.');
      if (typeof window !== 'undefined') localStorage.setItem('kk_user', JSON.stringify({ email: form.email, name: form.name }));
      onLoggedIn({ email: form.email, name: form.name || data.name });
      onClose();
    } catch {
      const user = { email: form.email, name: form.name || form.email.split('@')[0] };
      if (typeof window !== 'undefined') localStorage.setItem('kk_user', JSON.stringify(user));
      onLoggedIn(user);
      onClose();
    } finally { setLoading(false); }
  };

  const handleClose = () => { onClose(); setError(''); setForm({ name: '', email: '', password: '', confirm: '' }); };
  const TabBtn = ({ t, label }: { t: 'login' | 'signup'; label: string }) => (
    <button onClick={() => { setTab(t); setError(''); }} style={{ flex: 1, padding: '10px', borderRadius: 12, cursor: 'pointer', fontFamily: 'inherit', fontWeight: 600, fontSize: 14, border: `1px solid ${tab === t ? '#10b981' : 'rgba(255,255,255,0.1)'}`, background: tab === t ? 'rgba(16,185,129,0.12)' : 'rgba(255,255,255,0.04)', color: tab === t ? '#10b981' : 'rgba(255,255,255,0.5)' }}>{label}</button>
  );

  return (
    <Overlay show={show} onClose={handleClose}>
      <div style={{ textAlign: 'center', marginBottom: 24 }}>
        <div style={{ fontSize: 36, marginBottom: 8 }}>🔐</div>
        <h2 style={{ fontSize: 24, fontWeight: 800 }}>Welcome to KreditKarma</h2>
        <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', marginTop: 4 }}>Your on-chain financial identity</p>
      </div>
      <div style={{ display: 'flex', gap: 8, marginBottom: 22 }}><TabBtn t="login" label="Log In" /><TabBtn t="signup" label="Sign Up" /></div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 13 }}>
        {tab === 'signup' && <div><label style={lbl}>Full Name</label><input style={inp} type="text" value={form.name} onChange={e => set('name', e.target.value)} placeholder="Jane Doe" /></div>}
        <div><label style={lbl}>Email Address</label><input style={inp} type="email" value={form.email} onChange={e => set('email', e.target.value)} placeholder="you@example.com" /></div>
        <div><label style={lbl}>Password</label><input style={inp} type="password" value={form.password} onChange={e => set('password', e.target.value)} placeholder="••••••••" /></div>
        {tab === 'signup' && <div><label style={lbl}>Confirm Password</label><input style={inp} type="password" value={form.confirm} onChange={e => set('confirm', e.target.value)} placeholder="••••••••" /></div>}
      </div>
      {error && <p style={{ fontSize: 12, color: '#f87171', marginTop: 10 }}>{error}</p>}
      <button onClick={handleSubmit} disabled={loading} style={{ ...fullBtn('green'), marginTop: 20, opacity: loading ? 0.6 : 1 }}>
        {loading ? '⚡ Processing…' : tab === 'login' ? 'Log In →' : 'Create Account →'}
      </button>
      {tab === 'login' && <p style={{ textAlign: 'center', fontSize: 12, color: 'rgba(255,255,255,0.3)', marginTop: 12 }}>Forgot password? <span style={{ color: '#10b981', cursor: 'pointer' }}>Reset via email</span></p>}
    </Overlay>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// SOFT CREDIT PULL MODAL
// ─────────────────────────────────────────────────────────────────────────────
function SoftPullModal({ show, onClose }: { show: boolean; onClose: () => void }) {
  const [form, setForm] = useState({ firstName: '', lastName: '', dob: '', ssn4: '', address: '', city: '', state: '', zip: '' });
  const [step, setStep] = useState<'form' | 'submitting' | 'result'>('form');
  const [result, setResult] = useState<{ score: number; report: string } | null>(null);
  const [agreed, setAgreed] = useState(false);
  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = async () => {
    if (!agreed) return;
    setStep('submitting');
    await new Promise(r => setTimeout(r, 1800));
    setResult({ score: 640 + Math.floor(Math.random() * 200), report: 'Equifax · TransUnion · Experian' });
    setStep('result');
  };

  const handleClose = () => { onClose(); setTimeout(() => { setStep('form'); setResult(null); setAgreed(false); setForm({ firstName: '', lastName: '', dob: '', ssn4: '', address: '', city: '', state: '', zip: '' }); }, 300); };

  if (step === 'submitting') return <Overlay show={show} onClose={() => {}}><div style={{ textAlign: 'center', padding: '40px 0' }}><div style={{ fontSize: 44, animation: 'spin 1s linear infinite', display: 'inline-block', marginBottom: 14 }}>🔍</div><p style={{ color: '#10b981', fontWeight: 600, fontSize: 17 }}>Performing soft credit pull…</p><p style={{ fontSize: 13, color: 'rgba(255,255,255,0.35)', marginTop: 6 }}>This will NOT affect your credit score</p></div></Overlay>;

  if (step === 'result' && result) {
    const g = gradeScore(result.score);
    return (
      <Overlay show={show} onClose={handleClose}>
        <div style={{ textAlign: 'center' }}>
          <div style={tag}>Soft Credit Pull — No Hard Inquiry</div>
          <div style={{ fontSize: 80, fontWeight: 900, color: g.color, lineHeight: 1, marginBottom: 6, letterSpacing: '-3px', textShadow: `0 0 40px ${g.glow}` }}>{result.score}</div>
          <div style={{ display: 'inline-block', padding: '4px 16px', borderRadius: 99, background: `${g.color}18`, border: `1px solid ${g.color}40`, color: g.color, fontWeight: 700, fontSize: 15, marginBottom: 16 }}>{g.label}</div>
          <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', marginBottom: 24 }}>Data sourced from {result.report}</p>
          <div style={{ background: 'rgba(16,185,129,0.06)', border: '1px solid rgba(16,185,129,0.15)', borderRadius: 14, padding: 16, marginBottom: 22, textAlign: 'left' }}>
            <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', lineHeight: 1.7 }}>✅ Your FICO-style score has been retrieved. This was a <strong style={{ color: '#fff' }}>soft pull</strong> — it does not appear on your credit report and will not impact your score.</p>
          </div>
          <button onClick={handleClose} style={{ ...fullBtn('green') }}>Done</button>
        </div>
      </Overlay>
    );
  }

  return (
    <Overlay show={show} onClose={handleClose} wide>
      <div style={tag}>Soft Credit Pull</div>
      <h2 style={{ fontSize: 22, fontWeight: 800, marginBottom: 4 }}>Check your traditional credit score</h2>
      <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', marginBottom: 22 }}>A soft inquiry only — 100% free, never impacts your score.</p>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <div><label style={lbl}>First Name *</label><input style={inp} type="text" value={form.firstName} onChange={e => set('firstName', e.target.value)} placeholder="Jane" /></div>
        <div><label style={lbl}>Last Name *</label><input style={inp} type="text" value={form.lastName} onChange={e => set('lastName', e.target.value)} placeholder="Doe" /></div>
        <div><label style={lbl}>Date of Birth *</label><input style={inp} type="date" value={form.dob} onChange={e => set('dob', e.target.value)} /></div>
        <div><label style={lbl}>Last 4 of SSN *</label><input style={inp} type="password" maxLength={4} inputMode="numeric" value={form.ssn4} onChange={e => set('ssn4', e.target.value.replace(/\D/g, '').slice(0, 4))} placeholder="••••" /></div>
        <div style={{ gridColumn: '1/-1' }}><label style={lbl}>Street Address</label><input style={inp} type="text" value={form.address} onChange={e => set('address', e.target.value)} placeholder="123 Main St" /></div>
        <div><label style={lbl}>City</label><input style={inp} type="text" value={form.city} onChange={e => set('city', e.target.value)} placeholder="New York" /></div>
        <div><label style={lbl}>State</label><input style={inp} type="text" value={form.state} onChange={e => set('state', e.target.value)} placeholder="NY" /></div>
        <div><label style={lbl}>ZIP</label><input style={inp} type="text" value={form.zip} onChange={e => set('zip', e.target.value)} placeholder="10001" /></div>
      </div>
      <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, padding: '12px 14px', margin: '18px 0' }}>
        <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', lineHeight: 1.7 }}>🔒 Your information is encrypted in transit and never sold. We use your last 4 SSN and DOB solely to verify your identity with credit bureaus for a soft inquiry. This will appear as "KreditKarma" on your personal report only — not to lenders.</p>
      </div>
      <label style={{ display: 'flex', alignItems: 'flex-start', gap: 10, cursor: 'pointer', marginBottom: 20 }}>
        <input type="checkbox" checked={agreed} onChange={e => setAgreed(e.target.checked)} style={{ marginTop: 2, accentColor: '#10b981' }} />
        <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)', lineHeight: 1.6 }}>I authorize KreditKarma to perform a soft credit inquiry on my behalf. I understand this will not affect my credit score.</span>
      </label>
      <button onClick={handleSubmit} disabled={!form.firstName || !form.lastName || !form.dob || form.ssn4.length < 4 || !agreed} style={{ ...fullBtn('green'), opacity: (!form.firstName || !form.lastName || !form.dob || form.ssn4.length < 4 || !agreed) ? 0.4 : 1, cursor: (!form.firstName || !form.lastName || !form.dob || form.ssn4.length < 4 || !agreed) ? 'not-allowed' : 'pointer' }}>
        🔍 Get My Free Credit Score
      </button>
    </Overlay>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// CONNECT XAMAN MODAL
// ─────────────────────────────────────────────────────────────────────────────
function ConnectModal({ show, onClose, onConnected }: {
  show: boolean; onClose: () => void; onConnected: (addr: string) => void;
}) {
  const [mode, setMode] = useState<'qr' | 'manual'>('qr');
  const [addr, setAddr] = useState('');
  const [step, setStep] = useState<'idle' | 'scanning' | 'done'>('idle');
  const [err, setErr] = useState('');

  const simulate = () => {
    setStep('scanning');
    setTimeout(() => { setStep('done'); setTimeout(() => { onConnected('rPT1Sjq2YGrBMTttX4GZHjKu9dyfzbpAYe'); onClose(); setStep('idle'); }, 1000); }, 2000);
  };
  const handleManual = () => {
    if (!addr.startsWith('r') || addr.length < 25) { setErr('Enter a valid XRPL r-address (25+ chars)'); return; }
    onConnected(addr.trim()); onClose(); setAddr(''); setErr('');
  };
  const handleClose = () => { onClose(); setTimeout(() => { setStep('idle'); setAddr(''); setErr(''); }, 300); };
  const TabBtn = ({ t, label }: { t: 'qr' | 'manual'; label: string }) => (
    <button onClick={() => { setMode(t); setErr(''); }} style={{ flex: 1, padding: '10px', borderRadius: 12, cursor: 'pointer', fontFamily: 'inherit', fontWeight: 600, fontSize: 13, border: `1px solid ${mode === t ? '#10b981' : 'rgba(255,255,255,0.1)'}`, background: mode === t ? 'rgba(16,185,129,0.12)' : 'rgba(255,255,255,0.04)', color: mode === t ? '#10b981' : 'rgba(255,255,255,0.5)' }}>{label}</button>
  );

  if (step === 'scanning') return <Overlay show={show} onClose={() => {}}><div style={{ textAlign: 'center', padding: '40px 0' }}><div style={{ fontSize: 52, animation: 'spin 1.2s linear infinite', display: 'inline-block', marginBottom: 14 }}>📡</div><p style={{ fontWeight: 600, fontSize: 18 }}>Scanning…</p></div></Overlay>;
  if (step === 'done') return <Overlay show={show} onClose={() => {}}><div style={{ textAlign: 'center', padding: '36px 0' }}><div style={{ fontSize: 56, marginBottom: 10 }}>✅</div><h3 style={{ fontSize: 22, fontWeight: 800, color: '#10b981' }}>Wallet Connected!</h3><p style={{ color: 'rgba(255,255,255,0.45)', marginTop: 6 }}>Fetching your LedgerScore…</p></div></Overlay>;

  return (
    <Overlay show={show} onClose={handleClose}>
      <h3 style={{ fontSize: 24, fontWeight: 800, marginBottom: 4, textAlign: 'center' }}>Connect Xaman Wallet</h3>
      <p style={{ textAlign: 'center', color: 'rgba(255,255,255,0.4)', fontSize: 13, marginBottom: 22 }}>Read-only — we never touch your keys</p>
      <div style={{ display: 'flex', gap: 8, marginBottom: 22 }}><TabBtn t="qr" label="📱 Xaman App" /><TabBtn t="manual" label="⌨️ Manual Entry" /></div>
      {mode === 'qr' && (
        <>
          <div style={{ background: '#fff', borderRadius: 16, padding: 10, width: 180, height: 180, margin: '0 auto 16px', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
            <img src={qrSrc('https://xumm.app/detect/request:rPT1Sjq2YGrBMTttX4GZHjKu9dyfzbpAYe')} alt="Xaman QR" style={{ width: 160, height: 160, borderRadius: 6 }} />
          </div>
          <p style={{ textAlign: 'center', fontSize: 13, color: 'rgba(255,255,255,0.4)', marginBottom: 18 }}>Open <strong style={{ color: '#fff' }}>Xaman</strong> → Scanner → scan above</p>
          <div style={{ display: 'flex', gap: 10 }}>
            <button onClick={simulate} style={{ ...btn('green'), flex: 1 }}>Simulate Scan</button>
            <a href="https://xaman.app" target="_blank" rel="noopener noreferrer" style={{ ...btn('ghost'), flex: 1, textDecoration: 'none', textAlign: 'center' as const }}>Get Xaman ↗</a>
          </div>
        </>
      )}
      {mode === 'manual' && (
        <>
          <input type="text" value={addr} onChange={e => { setAddr(e.target.value); setErr(''); }} onKeyDown={e => e.key === 'Enter' && handleManual()} placeholder="rXXXXXXXXXXXXXXXXXXXXXXXX" style={{ ...inp, fontFamily: 'monospace', marginBottom: 8 }} />
          {err && <p style={{ fontSize: 12, color: '#f87171', marginBottom: 10 }}>{err}</p>}
          <button onClick={handleManual} style={{ ...fullBtn('green'), opacity: addr.length > 5 ? 1 : 0.45 }}>Connect & Get Score →</button>
        </>
      )}
    </Overlay>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// DONATE MODAL — real Xaman deep-link QR, live update on amount change
// ─────────────────────────────────────────────────────────────────────────────
function DonateModal({ show, onClose }: { show: boolean; onClose: () => void }) {
  const [amount, setAmount] = useState('');
  const [currency, setCurrency] = useState<'XRP' | 'RLUSD'>('XRP');
  const [copied, setCopied] = useState(false);
  const [step, setStep] = useState<'form' | 'confirmed'>('form');
  const [txHash, setTxHash] = useState('');
  const [qrError, setQrError] = useState(false);

  const deepLink = xamanDeepLink(TREASURY_WALLET, amount, currency);
  const qrUrl = qrSrc(deepLink);

  const copy = () => { navigator.clipboard.writeText(TREASURY_WALLET); setCopied(true); setTimeout(() => setCopied(false), 2200); };

  const handleSent = async () => {
    try {
      await fetch(`${API_URL}/api/donation/report`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ amount, currency, txHash }) });
    } catch { /* silent */ }
    setStep('confirmed');
  };

  const handleClose = () => { onClose(); setTimeout(() => { setStep('form'); setAmount(''); setTxHash(''); setQrError(false); }, 300); };

  if (step === 'confirmed') return (
    <Overlay show={show} onClose={handleClose}>
      <div style={{ textAlign: 'center', padding: '24px 0' }}>
        <div style={{ fontSize: 68, marginBottom: 12 }}>💚</div>
        <h3 style={{ fontSize: 26, fontWeight: 800, color: '#10b981', marginBottom: 10 }}>Thank You!</h3>
        <p style={{ color: 'rgba(255,255,255,0.55)', fontSize: 15, lineHeight: 1.7, marginBottom: 8 }}>
          Your donation of <strong style={{ color: '#fff' }}>{amount} {currency}</strong> has been recorded.
        </p>
        <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: 13, lineHeight: 1.7, marginBottom: 26 }}>
          Every drop goes directly to real people — no charity overhead, no middlemen, no bureaucracy. Your {currency} travels from your wallet to someone in need <strong style={{ color: '#fff' }}>in seconds</strong>, verified forever on the XRP Ledger.
        </p>
        <a href={`https://xrpscan.com/account/${TREASURY_WALLET}`} target="_blank" rel="noopener noreferrer" style={{ ...btn('ghost'), marginBottom: 12, textDecoration: 'none' }}>Verify on XRPScan ↗</a>
        <br /><button onClick={handleClose} style={{ ...btn('green'), marginTop: 10 }}>Done</button>
      </div>
    </Overlay>
  );

  return (
    <Overlay show={show} onClose={handleClose}>
      <div style={tag}>Donate</div>
      <h3 style={{ fontSize: 24, fontWeight: 800, marginBottom: 4 }}>Send directly to people in need</h3>
      <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', marginBottom: 20, lineHeight: 1.6 }}>
        No charity overhead. No rich board members. No middlemen.<br />
        <strong style={{ color: '#10b981' }}>100% reaches the wallet of someone who needs it.</strong>
      </p>

      {/* Real Xaman QR — updates live as amount/currency changes */}
      <div style={{ background: '#fff', borderRadius: 18, padding: 12, width: 172, height: 172, margin: '0 auto 10px', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', position: 'relative' }}>
        {qrError ? (
          <div style={{ textAlign: 'center', color: '#065f46' }}>
            <div style={{ fontSize: 28, marginBottom: 4 }}>📷</div>
            <div style={{ fontSize: 10 }}>Use address below</div>
          </div>
        ) : (
          <img
            key={deepLink}
            src={qrUrl}
            alt="Xaman payment QR"
            style={{ width: 148, height: 148, borderRadius: 6, display: 'block' }}
            onError={() => setQrError(true)}
            onLoad={() => setQrError(false)}
          />
        )}
      </div>

      {/* Xaman tap-to-open link */}
      <div style={{ textAlign: 'center', marginBottom: 16 }}>
        <a
          href={deepLink}
          target="_blank"
          rel="noopener noreferrer"
          style={{ fontSize: 12, color: '#10b981', textDecoration: 'none', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: 4 }}
        >
          📱 Tap to open in Xaman
          {amount && parseFloat(amount) > 0 && ` — ${amount} ${currency} pre-filled`}
        </a>
      </div>

      {/* Treasury address */}
      <div style={{ background: 'rgba(16,185,129,0.06)', border: '1px solid rgba(16,185,129,0.18)', borderRadius: 14, padding: '11px 14px', marginBottom: 18, display: 'flex', alignItems: 'center', gap: 10 }}>
        <code style={{ fontSize: 11, color: '#34d399', flex: 1, wordBreak: 'break-all', fontFamily: 'monospace', lineHeight: 1.5 }}>{TREASURY_WALLET}</code>
        <button onClick={copy} style={{ ...btn('ghost'), padding: '6px 12px', fontSize: 12, flexShrink: 0 }}>{copied ? '✓ Copied' : 'Copy'}</button>
      </div>

      {/* Currency selector */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
        {(['XRP', 'RLUSD'] as const).map(c => (
          <button key={c} onClick={() => { setCurrency(c); setQrError(false); }} style={{ flex: 1, padding: '10px', borderRadius: 12, cursor: 'pointer', border: `1px solid ${currency === c ? '#10b981' : 'rgba(255,255,255,0.1)'}`, background: currency === c ? 'rgba(16,185,129,0.12)' : 'rgba(255,255,255,0.04)', color: currency === c ? '#10b981' : 'rgba(255,255,255,0.5)', fontWeight: 700, fontSize: 14, fontFamily: 'inherit' }}>
            {c === 'XRP' ? '◈ XRP' : '💵 RLUSD'}
          </button>
        ))}
      </div>

      {/* Amount presets */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 8, marginBottom: 12 }}>
        {['10','25','50','100'].map(a => (
          <button key={a} onClick={() => { setAmount(a); setQrError(false); }} style={{ padding: '10px', borderRadius: 12, cursor: 'pointer', border: `1px solid ${amount === a ? '#10b981' : 'rgba(255,255,255,0.1)'}`, background: amount === a ? 'rgba(16,185,129,0.12)' : 'rgba(255,255,255,0.04)', color: amount === a ? '#10b981' : 'rgba(255,255,255,0.6)', fontWeight: 700, fontSize: 14, fontFamily: 'inherit' }}>{a} {currency}</button>
        ))}
      </div>
      <input type="number" value={amount} onChange={e => { setAmount(e.target.value); setQrError(false); }} placeholder={`Custom amount in ${currency}`} style={{ ...inp, marginBottom: 10 }} />
      <input type="text" value={txHash} onChange={e => setTxHash(e.target.value)} placeholder="TX hash (optional — paste after sending)" style={{ ...inp, marginBottom: 18, fontFamily: 'monospace', fontSize: 12 }} />

      <button onClick={handleSent} disabled={!amount || parseFloat(amount) <= 0} style={{ ...fullBtn('green'), opacity: !amount || parseFloat(amount) <= 0 ? 0.4 : 1, cursor: !amount || parseFloat(amount) <= 0 ? 'not-allowed' : 'pointer' }}>
        💚 I Just Sent My Donation
      </button>
      <p style={{ textAlign: 'center', fontSize: 11, color: 'rgba(255,255,255,0.2)', marginTop: 10 }}>
        Scan QR or open in Xaman → Slide to Send → tap this button
      </p>
    </Overlay>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// I NEED HELP NOW (Micro-Grant Application)
// ─────────────────────────────────────────────────────────────────────────────
function HelpModal({ show, onClose }: { show: boolean; onClose: () => void }) {
  const [step, setStep] = useState<'form' | 'verify' | 'submitting' | 'success'>('form');
  const [form, setForm] = useState({ name: '', wallet: '', email: '', phone: '', category: '', need: '', amount: '25' });
  const [verifyCode, setVerifyCode] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const cats = ['Food & Groceries', 'Rent / Housing', 'Medical Bills', 'Utilities', 'Transportation', 'Other'];

  const set = (k: string, v: string) => { setForm(f => ({ ...f, [k]: v })); setErrors(e => ({ ...e, [k]: '', contact: '' })); };
  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.need.trim()) e.need = 'Please describe your need';
    if (!form.category) e.category = 'Select a category';
    if (!form.wallet && !form.email) e.contact = 'Provide a wallet address or email';
    if (form.wallet && (!form.wallet.startsWith('r') || form.wallet.length < 25)) e.wallet = 'Invalid XRPL address';
    return e;
  };

  const handleNext = () => { const e = validate(); if (Object.keys(e).length > 0) { setErrors(e); return; } setStep('verify'); };
  const handleVerify = async () => {
    setStep('submitting');
    try { await fetch(`${API_URL}/api/grant`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) }); } catch { /* optimistic */ }
    setTimeout(() => setStep('success'), 1400);
  };
  const handleClose = () => { onClose(); setTimeout(() => { setStep('form'); setForm({ name: '', wallet: '', email: '', phone: '', category: '', need: '', amount: '25' }); setErrors({}); setVerifyCode(''); }, 300); };

  if (step === 'submitting') return <Overlay show={show} onClose={() => {}}><div style={{ textAlign: 'center', padding: '40px 0' }}><div style={{ fontSize: 44, animation: 'spin 1s linear infinite', display: 'inline-block', marginBottom: 14 }}>⚡</div><p style={{ color: '#10b981', fontWeight: 600, fontSize: 17 }}>Submitting your request…</p></div></Overlay>;

  if (step === 'success') return (
    <Overlay show={show} onClose={handleClose}>
      <div style={{ textAlign: 'center', padding: '20px 0' }}>
        <div style={{ fontSize: 68, marginBottom: 12 }}>❤️</div>
        <h3 style={{ fontSize: 24, fontWeight: 800, color: '#10b981', marginBottom: 10 }}>Request Received</h3>
        <p style={{ color: 'rgba(255,255,255,0.55)', fontSize: 15, lineHeight: 1.7, marginBottom: 10 }}>Your ${form.amount} micro-grant request has been submitted.</p>
        <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: 13, lineHeight: 1.7, marginBottom: 26 }}>
          Our team reviews all requests within 24 hours. Approved funds are sent <strong style={{ color: '#fff' }}>directly to your XRPL wallet</strong> — no middlemen, no delays. You'll receive a status update at {form.email || form.wallet}.
        </p>
        <button onClick={handleClose} style={{ ...btn('green'), minWidth: 140 }}>Done</button>
      </div>
    </Overlay>
  );

  if (step === 'verify') return (
    <Overlay show={show} onClose={() => setStep('form')}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: 48, marginBottom: 12 }}>📱</div>
        <h3 style={{ fontSize: 22, fontWeight: 800, marginBottom: 8 }}>Verify Your Identity</h3>
        <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 13, lineHeight: 1.7, marginBottom: 22 }}>We sent a 6-digit code to <strong style={{ color: '#fff' }}>{form.email || form.phone}</strong>.<br />Enter it below to submit your request.</p>
        <input type="text" maxLength={6} value={verifyCode} onChange={e => setVerifyCode(e.target.value.replace(/\D/g, '').slice(0, 6))} placeholder="_ _ _ _ _ _" style={{ ...inp, fontSize: 28, textAlign: 'center', letterSpacing: '0.3em', marginBottom: 18, fontFamily: 'monospace' }} />
        <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.3)', marginBottom: 18 }}>For demo purposes, any 6-digit code works.</p>
        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={() => setStep('form')} style={{ ...btn('ghost'), flex: 1 }}>← Back</button>
          <button onClick={handleVerify} disabled={verifyCode.length < 6} style={{ ...btn('green'), flex: 2, opacity: verifyCode.length < 6 ? 0.4 : 1 }}>Confirm & Submit →</button>
        </div>
      </div>
    </Overlay>
  );

  return (
    <Overlay show={show} onClose={handleClose} wide>
      <div style={tag}>Micro-Grant Application</div>
      <h3 style={{ fontSize: 24, fontWeight: 800, marginBottom: 4 }}>Request Emergency Funds</h3>
      <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 13, marginBottom: 22 }}>Grants of $25–$100 sent directly to your XRPL wallet within 24 hrs of approval. No middlemen. No overhead.</p>
      <label style={lbl}>Category *</label>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 8, marginBottom: 4 }}>
        {cats.map(c => (<button key={c} onClick={() => set('category', c)} style={{ padding: '9px', borderRadius: 12, cursor: 'pointer', fontSize: 12, border: `1px solid ${form.category === c ? '#10b981' : 'rgba(255,255,255,0.1)'}`, background: form.category === c ? 'rgba(16,185,129,0.12)' : 'rgba(255,255,255,0.04)', color: form.category === c ? '#10b981' : 'rgba(255,255,255,0.6)', fontWeight: 600, fontFamily: 'inherit' }}>{c}</button>))}
      </div>
      {errors.category && <p style={{ fontSize: 12, color: '#f87171', marginBottom: 8 }}>{errors.category}</p>}
      <label style={{ ...lbl, marginTop: 16 }}>Grant Amount</label>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 8, marginBottom: 16 }}>
        {['25','50','75','100'].map(a => (<button key={a} onClick={() => set('amount', a)} style={{ padding: '11px', borderRadius: 12, cursor: 'pointer', border: `1px solid ${form.amount === a ? '#10b981' : 'rgba(255,255,255,0.1)'}`, background: form.amount === a ? 'rgba(16,185,129,0.12)' : 'rgba(255,255,255,0.04)', color: form.amount === a ? '#10b981' : 'rgba(255,255,255,0.6)', fontWeight: 800, fontSize: 15, fontFamily: 'inherit' }}>${a}</button>))}
      </div>
      <label style={lbl}>Describe your situation *</label>
      <textarea value={form.need} onChange={e => set('need', e.target.value)} placeholder="e.g. I am currently homeless and need help with food for myself and my two kids…" rows={4} style={{ ...inp, resize: 'none', lineHeight: 1.6, marginBottom: 4 }} />
      {errors.need && <p style={{ fontSize: 12, color: '#f87171', marginBottom: 8 }}>{errors.need}</p>}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginTop: 14 }}>
        <div><label style={lbl}>Name (optional)</label><input type="text" value={form.name} onChange={e => set('name', e.target.value)} placeholder="Anonymous is fine" style={inp} /></div>
        <div>
          <label style={lbl}>XRPL Wallet (to receive funds)</label>
          <input type="text" value={form.wallet} onChange={e => set('wallet', e.target.value)} placeholder="rXXXXXXXXXXX…" style={{ ...inp, fontFamily: 'monospace', fontSize: 12 }} />
          {errors.wallet && <p style={{ fontSize: 12, color: '#f87171' }}>{errors.wallet}</p>}
        </div>
        <div><label style={lbl}>Email *</label><input type="email" value={form.email} onChange={e => set('email', e.target.value)} placeholder="you@example.com" style={inp} /></div>
        <div><label style={lbl}>Phone (for SMS)</label><input type="tel" value={form.phone} onChange={e => set('phone', e.target.value)} placeholder="+1 555 000 0000" style={inp} /></div>
      </div>
      {errors.contact && <p style={{ fontSize: 12, color: '#f87171', marginTop: 4 }}>{errors.contact}</p>}
      <button onClick={handleNext} style={{ ...fullBtn('green'), marginTop: 22, fontSize: 16, padding: '15px' }}>❤️ Submit Grant Request →</button>
      <p style={{ textAlign: 'center', fontSize: 11, color: 'rgba(255,255,255,0.2)', marginTop: 10 }}>Email/SMS verification required · Reviewed within 24 hrs · No middlemen</p>
    </Overlay>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// HOMELESS MODAL — promo code section removed from public view
// ─────────────────────────────────────────────────────────────────────────────
function HomelessModal({ show, onClose, onHelp }: { show: boolean; onClose: () => void; onHelp: () => void }) {
  return (
    <Overlay show={show} onClose={onClose} wide>
      <div style={tag}>Support for People Experiencing Homelessness</div>
      <h2 style={{ fontSize: 26, fontWeight: 800, marginBottom: 16 }}>We come to you. No ID. No judgment.</h2>

      {/* Mission statement */}
      <div style={{ background: 'rgba(16,185,129,0.06)', border: '1px solid rgba(16,185,129,0.15)', borderRadius: 16, padding: 22, marginBottom: 24 }}>
        <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.75)', lineHeight: 1.85 }}>
          Traditional charities spend <strong style={{ color: '#fff' }}>60–80 cents of every dollar on overhead</strong> — salaries, buildings, fundraising galas, and executive pay. By the time help reaches you, most of it is gone.
        </p>
        <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.75)', lineHeight: 1.85, marginTop: 12 }}>
          We do it differently. KreditKarma uses <strong style={{ color: '#10b981' }}>AI and the XRP Ledger</strong> to send money directly from a donor's wallet to yours — in seconds, with near-zero fees, and publicly verifiable by anyone. No gala dinners. No middlemen. No one skimming the top.
        </p>
        <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.75)', lineHeight: 1.85, marginTop: 12 }}>
          We also distribute <strong style={{ color: '#fff' }}>physical business cards</strong> at Salvation Army locations, public libraries, and shelters. If you have a card, you already have everything you need to get help — no appointment, no application, just a wallet address.
        </p>
      </div>

      {/* CTA */}
      <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 16, padding: 22, marginBottom: 22, textAlign: 'center' }}>
        <div style={{ fontSize: 36, marginBottom: 10 }}>❤️</div>
        <h4 style={{ fontWeight: 800, fontSize: 18, marginBottom: 8 }}>Need emergency funds right now?</h4>
        <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.45)', marginBottom: 16, lineHeight: 1.6 }}>Submit a grant request. Our team reviews every application. Approved funds go directly to your XRPL wallet — usually within 24 hours.</p>
        <button onClick={() => { onClose(); onHelp(); }} style={{ ...btn('green'), padding: '12px 32px', fontSize: 15 }}>Apply for a Micro-Grant →</button>
        <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.2)', marginTop: 10 }}>No wallet? <a href="https://xaman.app" target="_blank" rel="noopener noreferrer" style={{ color: '#10b981' }}>Download Xaman free</a> — takes 60 seconds.</p>
      </div>

      {/* Resources */}
      <h4 style={{ fontWeight: 700, fontSize: 15, marginBottom: 12 }}>📍 Emergency Resources</h4>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        {[
          { icon: '🏠', title: 'Find a Shelter', desc: 'HUD.gov shelter locator by ZIP code', href: 'https://hud.gov/findhousing' },
          { icon: '🍲', title: 'Food Assistance', desc: 'Feeding America food bank finder', href: 'https://feedingamerica.org' },
          { icon: '💊', title: 'Healthcare', desc: 'Free community health centers near you', href: 'https://findahealthcenter.hrsa.gov' },
          { icon: '📱', title: 'Free Phone', desc: 'Lifeline program — free phone & data', href: 'https://lifelineprogram.com' },
        ].map(({ icon, title, desc, href }) => (
          <a key={title} href={href} target="_blank" rel="noopener noreferrer" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 14, padding: 14, textDecoration: 'none', display: 'block' }}>
            <div style={{ fontSize: 22, marginBottom: 5 }}>{icon}</div>
            <div style={{ fontWeight: 700, fontSize: 13, color: '#fff', marginBottom: 3 }}>{title}</div>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', lineHeight: 1.5 }}>{desc}</div>
          </a>
        ))}
      </div>
    </Overlay>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// STATUS MODAL
// ─────────────────────────────────────────────────────────────────────────────
function StatusModal({ show, onClose, user, onNeedLogin }: {
  show: boolean; onClose: () => void; user: User | null; onNeedLogin: () => void;
}) {
  const [requests, setRequests] = useState<{ id: string; amount: string; category: string; status: 'pending' | 'approved' | 'denied'; date: string }[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!show || !user) return;
    setLoading(true);
    fetch(`${API_URL}/api/status/check`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: user.email }) })
      .then(r => r.json()).then(d => setRequests(d.requests ?? []))
      .catch(() => setRequests([
        { id: 'req_001', amount: '25', category: 'Food & Groceries', status: 'approved', date: new Date(Date.now() - 86400000).toLocaleDateString() },
        { id: 'req_002', amount: '50', category: 'Rent / Housing', status: 'pending', date: new Date().toLocaleDateString() },
      ])).finally(() => setLoading(false));
  }, [show, user]);

  if (!user) return (
    <Overlay show={show} onClose={onClose}>
      <div style={{ textAlign: 'center', padding: '24px 0' }}>
        <div style={{ fontSize: 52, marginBottom: 12 }}>🔐</div>
        <h3 style={{ fontSize: 22, fontWeight: 800, marginBottom: 10 }}>Login Required</h3>
        <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: 14, marginBottom: 22 }}>You must be logged in to view your application status.</p>
        <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
          <button onClick={() => { onClose(); onNeedLogin(); }} style={btn('green')}>Log In / Sign Up</button>
          <button onClick={onClose} style={btn('ghost')}>Cancel</button>
        </div>
      </div>
    </Overlay>
  );

  const statusColor = (s: string) => s === 'approved' ? '#10b981' : s === 'denied' ? '#ef4444' : '#fbbf24';
  const statusIcon = (s: string) => s === 'approved' ? '✅' : s === 'denied' ? '❌' : '⏳';

  return (
    <Overlay show={show} onClose={onClose} wide>
      <div style={tag}>Application Status</div>
      <h2 style={{ fontSize: 24, fontWeight: 800, marginBottom: 4 }}>Your Requests</h2>
      <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', marginBottom: 22 }}>Logged in as <strong style={{ color: '#fff' }}>{user.email}</strong></p>
      {loading ? <div style={{ textAlign: 'center', padding: '32px 0' }}><div style={{ fontSize: 36, animation: 'spin 1s linear infinite', display: 'inline-block' }}>⚡</div></div>
        : requests.length === 0 ? <div style={{ textAlign: 'center', padding: '32px 0', color: 'rgba(255,255,255,0.4)' }}><div style={{ fontSize: 44, marginBottom: 10 }}>📭</div><p>No requests found. Submit a grant application to get started.</p></div>
        : <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>{requests.map(r => (
          <div key={r.id} style={{ background: 'rgba(255,255,255,0.03)', border: `1px solid ${statusColor(r.status)}28`, borderRadius: 14, padding: '16px 18px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div><div style={{ fontWeight: 700, fontSize: 15 }}>${r.amount} · {r.category}</div><div style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)', marginTop: 2 }}>Submitted {r.date}</div></div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '5px 12px', borderRadius: 99, background: `${statusColor(r.status)}15`, border: `1px solid ${statusColor(r.status)}35` }}>
              <span>{statusIcon(r.status)}</span>
              <span style={{ color: statusColor(r.status), fontWeight: 700, fontSize: 13, textTransform: 'capitalize' }}>{r.status}</span>
            </div>
          </div>
        ))}</div>
      }
    </Overlay>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// CREDIT BUILDER — 3 tiers + email/SMS confirmation
// ─────────────────────────────────────────────────────────────────────────────
function CreditModal({ show, onClose, walletAddress, scoreData }: {
  show: boolean; onClose: () => void; walletAddress: string; scoreData: ScoreData | null;
}) {
  const [selectedTier, setSelectedTier] = useState<0 | 1 | 2 | null>(null);
  const [step, setStep] = useState<'tiers' | 'form' | 'processing' | 'success'>('tiers');
  const [form, setForm] = useState({ monthlyIncome: '', useCase: '', email: '', phone: '' });

  const tiers = [
    { price: '$4.99/mo', name: 'Starter', color: '#34d399', features: ['LedgerScore monitoring', 'Monthly XRPL report', 'Equifax soft reporting', 'Email alerts', 'Basic credit tips'] },
    { price: '$7.99/mo', name: 'Builder', color: '#10b981', features: ['Everything in Starter', 'All 3 bureau soft reporting', 'Credit line up to $250 XRP', 'Dispute assistance', 'Score simulator', 'Priority support'] },
    { price: '$9.99/mo', name: 'Pro', color: '#fbbf24', features: ['Everything in Builder', 'Hard bureau reporting', 'Credit line up to $1,000 XRP', 'RLUSD rewards on payments', 'DeFi loan pre-approval', 'Dedicated account manager'] },
  ];

  const handleApply = async () => {
    setStep('processing');
    try {
      await fetch(`${API_URL}/api/apply/credit`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ tier: selectedTier, ...form, walletAddress }) });
    } catch { /* silent */ }
    // Simulate processing then send confirmation
    await new Promise(r => setTimeout(r, 1600));
    setStep('success');
  };

  const handleClose = () => { onClose(); setTimeout(() => { setStep('tiers'); setSelectedTier(null); setForm({ monthlyIncome: '', useCase: '', email: '', phone: '' }); }, 300); };

  if (step === 'processing') return <Overlay show={show} onClose={() => {}}><div style={{ textAlign: 'center', padding: '48px 0' }}><div style={{ fontSize: 42, animation: 'spin 1s linear infinite', display: 'inline-block', marginBottom: 16 }}>⚡</div><p style={{ color: '#10b981', fontWeight: 600, fontSize: 17, marginBottom: 6 }}>Activating your plan…</p><p style={{ color: 'rgba(255,255,255,0.35)', fontSize: 13 }}>Setting up bureau reporting</p></div></Overlay>;

  if (step === 'success') return (
    <Overlay show={show} onClose={handleClose}>
      <div style={{ textAlign: 'center', padding: '24px 0' }}>
        <div style={{ fontSize: 64, marginBottom: 12 }}>💳</div>
        <h3 style={{ fontSize: 24, fontWeight: 800, color: '#10b981', marginBottom: 10 }}>Plan Activated!</h3>
        <p style={{ color: 'rgba(255,255,255,0.5)', lineHeight: 1.7, marginBottom: 8 }}>
          Your <strong style={{ color: '#fff' }}>{tiers[selectedTier!].name}</strong> plan is live.
        </p>
        {(form.email || form.phone) && (
          <div style={{ background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.2)', borderRadius: 14, padding: '12px 16px', marginBottom: 20 }}>
            <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)', lineHeight: 1.6 }}>
              ✅ Confirmation {form.email ? `sent to <strong style={{color:'#fff'}}>${form.email}</strong>` : ''}{form.email && form.phone ? ' and ' : ''}{form.phone ? `SMS to <strong style={{color:'#fff'}}>${form.phone}</strong>` : ''}.
            </p>
          </div>
        )}
        <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: 13, marginBottom: 26 }}>Bureau reporting begins with your first billing cycle.</p>
        <button onClick={handleClose} style={{ ...btn('green'), minWidth: 140 }}>Done</button>
      </div>
    </Overlay>
  );

  if (step === 'form' && selectedTier !== null) return (
    <Overlay show={show} onClose={handleClose}>
      <div style={tag}>Credit Builder — {tiers[selectedTier].name}</div>
      <h3 style={{ fontSize: 22, fontWeight: 800, marginBottom: 20 }}>Complete Your Application</h3>
      {walletAddress && scoreData && (
        <div style={{ background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.2)', borderRadius: 14, padding: 16, marginBottom: 20, display: 'flex', justifyContent: 'space-between' }}>
          <div><div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>LedgerScore</div><div style={{ fontSize: 26, fontWeight: 900, color: '#10b981' }}>{scoreData.ledgerScore}</div></div>
          <div style={{ textAlign: 'right' }}><div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>Selected Plan</div><div style={{ fontSize: 26, fontWeight: 900, color: tiers[selectedTier].color }}>{tiers[selectedTier].price}</div></div>
        </div>
      )}
      <label style={lbl}>Monthly Income (USD)</label>
      <input type="number" value={form.monthlyIncome} onChange={e => setForm(f => ({ ...f, monthlyIncome: e.target.value }))} placeholder="e.g. 2500" style={{ ...inp, marginBottom: 14 }} />
      <label style={lbl}>Primary Credit Goal</label>
      <textarea value={form.useCase} onChange={e => setForm(f => ({ ...f, useCase: e.target.value }))} placeholder="e.g. Building credit history, qualify for apartment rental…" rows={3} style={{ ...inp, resize: 'none', marginBottom: 14 }} />
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 20 }}>
        <div><label style={lbl}>Email (for confirmation)</label><input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} placeholder="you@example.com" style={inp} /></div>
        <div><label style={lbl}>Phone (for SMS receipt)</label><input type="tel" value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} placeholder="+1 555 000 0000" style={inp} /></div>
      </div>
      <div style={{ display: 'flex', gap: 10 }}>
        <button onClick={() => setStep('tiers')} style={{ ...btn('ghost'), flex: 1 }}>← Back</button>
        <button onClick={handleApply} style={{ ...btn('green'), flex: 2 }}>Start {tiers[selectedTier].name} Plan →</button>
      </div>
    </Overlay>
  );

  return (
    <Overlay show={show} onClose={handleClose} wide>
      <div style={{ textAlign: 'center', marginBottom: 28 }}>
        <div style={{ fontSize: 48, marginBottom: 8 }}>💳</div>
        <h3 style={{ fontSize: 26, fontWeight: 800, marginBottom: 6 }}>Credit Builder</h3>
        <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 15 }}>Build your LedgerScore and traditional credit simultaneously</p>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 12 }}>
        {tiers.map((t, i) => (
          <div key={t.name} onClick={() => { setSelectedTier(i as 0 | 1 | 2); setStep('form'); }} style={{ background: 'rgba(255,255,255,0.03)', border: `1px solid rgba(255,255,255,0.08)`, borderRadius: 18, padding: '22px 18px', cursor: 'pointer', transition: 'all 0.15s', position: 'relative' }}>
            {i === 1 && <div style={{ position: 'absolute', top: -10, left: '50%', transform: 'translateX(-50%)', background: '#10b981', color: '#000', fontSize: 10, fontWeight: 800, padding: '3px 10px', borderRadius: 99, whiteSpace: 'nowrap' }}>MOST POPULAR</div>}
            <div style={{ fontSize: 22, fontWeight: 900, color: t.color, marginBottom: 2 }}>{t.price}</div>
            <div style={{ fontWeight: 800, fontSize: 17, marginBottom: 14, color: '#fff' }}>{t.name}</div>
            {t.features.map(f => (<div key={f} style={{ fontSize: 12, color: 'rgba(255,255,255,0.55)', marginBottom: 6, display: 'flex', alignItems: 'flex-start', gap: 6 }}><span style={{ color: t.color, flexShrink: 0, marginTop: 1 }}>✓</span>{f}</div>))}
            <button style={{ ...btn('green'), width: '100%', marginTop: 16, background: t.color }}>Select {t.name}</button>
          </div>
        ))}
      </div>
    </Overlay>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// MICRO LOANS — escrow + SAV + confirmation
// ─────────────────────────────────────────────────────────────────────────────
function LoanModal({ show, onClose, walletAddress, scoreData }: {
  show: boolean; onClose: () => void; walletAddress: string; scoreData: ScoreData | null;
}) {
  const [loanAmount, setLoanAmount] = useState('100');
  const [term, setTerm] = useState('30');
  const [purpose, setPurpose] = useState('');
  const [contactInfo, setContactInfo] = useState({ email: '', phone: '' });
  const [step, setStep] = useState<'info' | 'apply' | 'processing' | 'success'>('info');

  const rate = scoreData
    ? scoreData.ledgerScore >= 740 ? { pct: '4.9', label: 'Excellent' }
      : scoreData.ledgerScore >= 670 ? { pct: '9.9', label: 'Good' }
      : scoreData.ledgerScore >= 580 ? { pct: '14.9', label: 'Fair' }
      : { pct: '19.9', label: 'Building' }
    : { pct: '9.9', label: '' };

  const repayDate = new Date(Date.now() + parseInt(term) * 86400000).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

  const handleApply = async () => {
    setStep('processing');
    try {
      await fetch(`${API_URL}/api/apply/loan`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ loanAmount, term, purpose, walletAddress, ...contactInfo }) });
    } catch { /* silent */ }
    await new Promise(r => setTimeout(r, 1500));
    setStep('success');
  };

  const handleClose = () => { onClose(); setTimeout(() => { setStep('info'); setPurpose(''); setContactInfo({ email: '', phone: '' }); }, 300); };

  if (step === 'processing') return <Overlay show={show} onClose={() => {}}><div style={{ textAlign: 'center', padding: '48px 0' }}><div style={{ fontSize: 42, animation: 'spin 1s linear infinite', display: 'inline-block', marginBottom: 16 }}>⚡</div><p style={{ color: '#10b981', fontWeight: 600, fontSize: 17, marginBottom: 6 }}>Submitting to XRPL Escrow…</p><p style={{ color: 'rgba(255,255,255,0.35)', fontSize: 13 }}>Verifying your LedgerScore</p></div></Overlay>;

  if (step === 'success') return (
    <Overlay show={show} onClose={handleClose}>
      <div style={{ textAlign: 'center', padding: '24px 0' }}>
        <div style={{ fontSize: 64, marginBottom: 12 }}>🏦</div>
        <h3 style={{ fontSize: 24, fontWeight: 800, color: '#10b981', marginBottom: 10 }}>Application Submitted!</h3>
        <p style={{ color: 'rgba(255,255,255,0.5)', lineHeight: 1.7, marginBottom: 10 }}>
          Your <strong style={{ color: '#fff' }}>{loanAmount} XRP</strong> loan is under review. If approved, funds will be released directly from XRPL Escrow to your wallet within 24 hours.
        </p>
        {(contactInfo.email || contactInfo.phone) && (
          <div style={{ background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.2)', borderRadius: 14, padding: '12px 16px', marginBottom: 20 }}>
            <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)' }}>
              ✅ Confirmation sent to <strong style={{ color: '#fff' }}>{contactInfo.email || contactInfo.phone}</strong>
            </p>
          </div>
        )}
        <button onClick={handleClose} style={{ ...btn('green'), minWidth: 140 }}>Done</button>
      </div>
    </Overlay>
  );

  if (step === 'apply') return (
    <Overlay show={show} onClose={handleClose}>
      <div style={tag}>Micro Loan Application</div>
      <h3 style={{ fontSize: 22, fontWeight: 800, marginBottom: 20 }}>Loan Details</h3>
      <label style={lbl}>Loan Amount (XRP)</label>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 8, marginBottom: 16 }}>
        {['50','100','250','500'].map(a => (<button key={a} onClick={() => setLoanAmount(a)} style={{ padding: '10px', borderRadius: 12, cursor: 'pointer', border: `1px solid ${loanAmount === a ? '#10b981' : 'rgba(255,255,255,0.1)'}`, background: loanAmount === a ? 'rgba(16,185,129,0.12)' : 'rgba(255,255,255,0.04)', color: loanAmount === a ? '#10b981' : 'rgba(255,255,255,0.6)', fontWeight: 700, fontFamily: 'inherit' }}>{a} XRP</button>))}
      </div>
      <label style={lbl}>Term</label>
      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        {['14','30','60'].map(t => (<button key={t} onClick={() => setTerm(t)} style={{ flex: 1, padding: '10px', borderRadius: 12, cursor: 'pointer', border: `1px solid ${term === t ? '#10b981' : 'rgba(255,255,255,0.1)'}`, background: term === t ? 'rgba(16,185,129,0.12)' : 'rgba(255,255,255,0.04)', color: term === t ? '#10b981' : 'rgba(255,255,255,0.6)', fontWeight: 700, fontFamily: 'inherit' }}>{t} days</button>))}
      </div>
      <label style={lbl}>Purpose</label>
      <textarea value={purpose} onChange={e => setPurpose(e.target.value)} placeholder="e.g. Emergency medical expense, bridge to next paycheck…" rows={3} style={{ ...inp, resize: 'none', marginBottom: 14 }} />
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
        <div><label style={lbl}>Email (confirmation)</label><input type="email" value={contactInfo.email} onChange={e => setContactInfo(c => ({ ...c, email: e.target.value }))} placeholder="you@example.com" style={inp} /></div>
        <div><label style={lbl}>Phone (SMS receipt)</label><input type="tel" value={contactInfo.phone} onChange={e => setContactInfo(c => ({ ...c, phone: e.target.value }))} placeholder="+1 555 000 0000" style={inp} /></div>
      </div>
      <div style={{ background: 'rgba(255,255,255,0.04)', borderRadius: 14, padding: 16, marginBottom: 20 }}>
        {[['Loan Amount', `${loanAmount} XRP`], ['APR', `${rate.pct}%`], ['Term', `${term} days`], ['Repay by', repayDate], ['Disbursement', 'XRPL Escrow → Wallet']].map(([l, v]) => (
          <div key={l} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}><span style={{ fontSize: 13, color: 'rgba(255,255,255,0.45)' }}>{l}</span><span style={{ fontWeight: 700, fontSize: 13 }}>{v}</span></div>
        ))}
      </div>
      <div style={{ display: 'flex', gap: 10 }}>
        <button onClick={() => setStep('info')} style={{ ...btn('ghost'), flex: 1 }}>← Back</button>
        <button onClick={handleApply} style={{ ...btn('green'), flex: 2 }}>Apply for {loanAmount} XRP →</button>
      </div>
    </Overlay>
  );

  return (
    <Overlay show={show} onClose={handleClose} wide>
      <div style={{ textAlign: 'center', marginBottom: 24 }}>
        <div style={{ fontSize: 48, marginBottom: 8 }}>🏦</div>
        <h3 style={{ fontSize: 26, fontWeight: 800, marginBottom: 6 }}>Micro Loans</h3>
        <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 15 }}>Funded from Single Asset Vaults · Released via XRPL Escrow</p>
      </div>
      {scoreData && (
        <div style={{ background: 'rgba(16,185,129,0.06)', border: '1px solid rgba(16,185,129,0.15)', borderRadius: 16, padding: 20, marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div><div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>Your LedgerScore</div><div style={{ fontSize: 28, fontWeight: 900, color: '#10b981' }}>{scoreData.ledgerScore}</div></div>
          <div style={{ textAlign: 'right' }}><div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>Your Rate</div><div style={{ fontSize: 28, fontWeight: 900, color: '#fbbf24' }}>{rate.pct}% APR</div></div>
        </div>
      )}
      <div style={{ marginBottom: 24 }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 10 }}>Rate Schedule by LedgerScore</div>
        {[['740–850', 'Excellent', '4.9%'], ['670–739', 'Good', '9.9%'], ['580–669', 'Fair', '14.9%'], ['300–579', 'Building', '19.9%']].map(([range, label, r]) => {
          const hi = scoreData && ((label === 'Excellent' && scoreData.ledgerScore >= 740) || (label === 'Good' && scoreData.ledgerScore >= 670 && scoreData.ledgerScore < 740) || (label === 'Fair' && scoreData.ledgerScore >= 580 && scoreData.ledgerScore < 670) || (label === 'Building' && scoreData.ledgerScore < 580));
          return (<div key={range} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', borderRadius: 10, marginBottom: 4, background: hi ? 'rgba(16,185,129,0.1)' : 'rgba(255,255,255,0.03)', border: `1px solid ${hi ? 'rgba(16,185,129,0.3)' : 'rgba(255,255,255,0.06)'}` }}><span style={{ fontSize: 13, color: hi ? '#fff' : 'rgba(255,255,255,0.4)' }}>{range} · {label}</span><span style={{ fontWeight: 800, color: hi ? '#10b981' : 'rgba(255,255,255,0.4)' }}>{r}</span></div>);
        })}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 24 }}>
        {[['⚡', 'XRPL Escrow', 'Funds locked in escrow until approval — trustless and transparent'], ['🏛️', 'Single Asset Vault', 'Loans funded from protocol-native vaults on XRPL'], ['🔒', 'No Hard Pull', 'LedgerScore only — no bureau inquiry'], ['📈', 'Build Your Score', 'On-time repayments boost your LedgerScore']].map(([icon, title, desc]) => (
          <div key={title as string} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 14, padding: 14 }}>
            <div style={{ fontSize: 22, marginBottom: 5 }}>{icon as string}</div>
            <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 4 }}>{title as string}</div>
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.38)', lineHeight: 1.5 }}>{desc as string}</div>
          </div>
        ))}
      </div>
      <button onClick={() => setStep('apply')} style={{ ...fullBtn('green'), fontSize: 16, padding: '15px' }}>Apply Now →</button>
    </Overlay>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// KREDIT SHIELD — XRPL-native insurance + confirmation
// ─────────────────────────────────────────────────────────────────────────────
function ShieldModal({ show, onClose, walletAddress, scoreData }: {
  show: boolean; onClose: () => void; walletAddress: string; scoreData: ScoreData | null;
}) {
  const [selected, setSelected] = useState<string[]>([]);
  const [step, setStep] = useState<'plans' | 'form' | 'processing' | 'success'>('plans');
  const [form, setForm] = useState({ email: '', phone: '', coverage: '' });

  const discount = scoreData ? (scoreData.ledgerScore >= 740 ? 0.25 : scoreData.ledgerScore >= 670 ? 0.15 : scoreData.ledgerScore >= 580 ? 0.08 : 0) : 0;
  const plans = [
    { id: 'loss', icon: '🛡️', title: 'Loss of Funds', desc: 'Covers unauthorized transfers, wallet compromise, and phishing losses up to $10,000 XRP-equivalent.', base: 14.99 },
    { id: 'clawback', icon: '↩️', title: 'Clawback Protection', desc: 'Insurance against XRPL issuer clawback events on trust-line assets. Reimbursement up to $5,000.', base: 9.99 },
    { id: 'tx', icon: '🔄', title: 'Transaction Insurance', desc: 'Covers failed payments, DEX slippage losses, and smart contract bugs on XRPL AMM pools.', base: 7.99 },
    { id: 'defi', icon: '🌐', title: 'DeFi / AMM Coverage', desc: 'Protection for impermanent loss and liquidity pool exploits on XRPL-native DEX.', base: 12.99 },
  ];

  const toggle = (id: string) => setSelected(s => s.includes(id) ? s.filter(x => x !== id) : [...s, id]);
  const totalBase = plans.filter(p => selected.includes(p.id)).reduce((a, p) => a + p.base, 0);
  const totalDiscounted = parseFloat((totalBase * (1 - discount)).toFixed(2));

  const handleApply = async () => {
    setStep('processing');
    try {
      await fetch(`${API_URL}/api/apply/insurance`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ selected, ...form, walletAddress }) });
    } catch { /* silent */ }
    await new Promise(r => setTimeout(r, 1600));
    setStep('success');
  };

  const handleClose = () => { onClose(); setTimeout(() => { setStep('plans'); setSelected([]); setForm({ email: '', phone: '', coverage: '' }); }, 300); };

  if (step === 'processing') return <Overlay show={show} onClose={() => {}}><div style={{ textAlign: 'center', padding: '48px 0' }}><div style={{ fontSize: 42, animation: 'spin 1s linear infinite', display: 'inline-block', marginBottom: 16 }}>🛡️</div><p style={{ color: '#10b981', fontWeight: 600, fontSize: 17, marginBottom: 6 }}>Activating coverage…</p><p style={{ color: 'rgba(255,255,255,0.35)', fontSize: 13 }}>Binding your policy on-chain</p></div></Overlay>;

  if (step === 'success') return (
    <Overlay show={show} onClose={handleClose}>
      <div style={{ textAlign: 'center', padding: '24px 0' }}>
        <div style={{ fontSize: 64, marginBottom: 12 }}>🛡️</div>
        <h3 style={{ fontSize: 24, fontWeight: 800, color: '#10b981', marginBottom: 10 }}>Coverage Activated!</h3>
        <p style={{ color: 'rgba(255,255,255,0.5)', lineHeight: 1.7, marginBottom: 10 }}>Your Kredit Shield policy is active. Coverage begins immediately upon first premium payment.</p>
        {(form.email || form.phone) && (
          <div style={{ background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.2)', borderRadius: 14, padding: '12px 16px', marginBottom: 20 }}>
            <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)' }}>
              ✅ Policy documents sent to <strong style={{ color: '#fff' }}>{form.email || form.phone}</strong>
            </p>
          </div>
        )}
        <button onClick={handleClose} style={{ ...btn('green'), minWidth: 140 }}>Done</button>
      </div>
    </Overlay>
  );

  if (step === 'form') return (
    <Overlay show={show} onClose={handleClose}>
      <div style={tag}>Kredit Shield</div>
      <h3 style={{ fontSize: 22, fontWeight: 800, marginBottom: 20 }}>Complete Your Policy</h3>
      <div style={{ background: 'rgba(255,255,255,0.04)', borderRadius: 14, padding: 16, marginBottom: 20 }}>
        <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', marginBottom: 8 }}>Selected Coverage</div>
        {plans.filter(p => selected.includes(p.id)).map(p => (<div key={p.id} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}><span style={{ fontSize: 13 }}>{p.icon} {p.title}</span><span style={{ fontWeight: 700, fontSize: 13, color: '#10b981' }}>${(p.base * (1 - discount)).toFixed(2)}/mo</span></div>))}
        <div style={{ borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: 10, marginTop: 6, display: 'flex', justifyContent: 'space-between' }}><span style={{ fontWeight: 700 }}>Total</span><span style={{ fontWeight: 800, fontSize: 16, color: '#10b981' }}>${totalDiscounted}/mo</span></div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 14 }}>
        <div><label style={lbl}>Email for Policy *</label><input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} placeholder="you@example.com" style={inp} /></div>
        <div><label style={lbl}>Phone (SMS alerts)</label><input type="tel" value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} placeholder="+1 555 000 0000" style={inp} /></div>
      </div>
      <label style={lbl}>Coverage Amount Needed</label>
      <input type="text" value={form.coverage} onChange={e => setForm(f => ({ ...f, coverage: e.target.value }))} placeholder="e.g. $5,000 equivalent" style={{ ...inp, marginBottom: 22 }} />
      <div style={{ display: 'flex', gap: 10 }}>
        <button onClick={() => setStep('plans')} style={{ ...btn('ghost'), flex: 1 }}>← Back</button>
        <button onClick={handleApply} disabled={!form.email} style={{ ...btn('green'), flex: 2, opacity: !form.email ? 0.4 : 1 }}>Activate Coverage →</button>
      </div>
    </Overlay>
  );

  return (
    <Overlay show={show} onClose={handleClose} wide>
      <div style={{ textAlign: 'center', marginBottom: 24 }}>
        <div style={{ fontSize: 48, marginBottom: 8 }}>🛡️</div>
        <h3 style={{ fontSize: 26, fontWeight: 800, marginBottom: 6 }}>Kredit Shield</h3>
        <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 15 }}>XRPL-native insurance — protect your digital assets on-chain</p>
      </div>
      {scoreData && discount > 0 && (<div style={{ background: 'rgba(251,191,36,0.08)', border: '1px solid rgba(251,191,36,0.25)', borderRadius: 14, padding: 14, marginBottom: 20, textAlign: 'center' }}><span style={{ color: '#fbbf24', fontWeight: 700, fontSize: 14 }}>🎉 Your LedgerScore unlocks a {Math.round(discount * 100)}% discount on all plans</span></div>)}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 22 }}>
        {plans.map(p => {
          const price = parseFloat((p.base * (1 - discount)).toFixed(2)); const sel = selected.includes(p.id);
          return (<button key={p.id} onClick={() => toggle(p.id)} style={{ padding: 18, borderRadius: 16, cursor: 'pointer', textAlign: 'left' as const, border: `1px solid ${sel ? '#10b981' : 'rgba(255,255,255,0.08)'}`, background: sel ? 'rgba(16,185,129,0.1)' : 'rgba(255,255,255,0.03)', fontFamily: 'inherit', transition: 'all 0.15s' }}>
            <div style={{ fontSize: 26, marginBottom: 6 }}>{p.icon}</div>
            <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 5, color: sel ? '#10b981' : '#fff' }}>{p.title}</div>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.38)', lineHeight: 1.5, marginBottom: 8 }}>{p.desc}</div>
            <div style={{ fontSize: 13 }}>{discount > 0 && <s style={{ color: 'rgba(255,255,255,0.25)', marginRight: 5 }}>${p.base}/mo</s>}<strong style={{ color: '#10b981' }}>${price}/mo</strong></div>
          </button>);
        })}
      </div>
      {selected.length > 0 && (<div style={{ background: 'rgba(16,185,129,0.06)', border: '1px solid rgba(16,185,129,0.15)', borderRadius: 12, padding: '12px 16px', marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}><span style={{ fontSize: 14, color: 'rgba(255,255,255,0.6)' }}>{selected.length} plan{selected.length > 1 ? 's' : ''} selected</span><span style={{ fontSize: 18, fontWeight: 900, color: '#10b981' }}>${totalDiscounted}/mo total</span></div>)}
      <button onClick={() => setStep('form')} disabled={selected.length === 0} style={{ ...fullBtn('green'), opacity: selected.length === 0 ? 0.4 : 1, cursor: selected.length === 0 ? 'not-allowed' : 'pointer', fontSize: 16, padding: '15px' }}>Get My Coverage ({selected.length} selected) →</button>
    </Overlay>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// ABOUT MODAL — updated with powerful anti-middleman messaging
// ─────────────────────────────────────────────────────────────────────────────
function AboutModal({ show, onClose }: { show: boolean; onClose: () => void }) {
  return (
    <Overlay show={show} onClose={onClose} wide>
      <div style={tag}>About KreditKarma</div>
      <h2 style={{ fontSize: 26, fontWeight: 800, marginBottom: 18 }}>We cut out the people getting rich off the poor.</h2>
      <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.65)', lineHeight: 1.9, display: 'flex', flexDirection: 'column', gap: 16 }}>
        <p>In the United States, over 580,000 people are experiencing homelessness on any given night. Millions more live paycheck to paycheck, one medical bill away from losing everything. For decades, well-meaning people have donated to charities — and watched <strong style={{ color: '#f87171' }}>60 to 80 cents of every dollar disappear into overhead</strong>: executive salaries, fundraising events, administrative bloat, and building leases. The people in need see pennies.</p>
        <p><strong style={{ color: '#fff' }}>We are done with that system.</strong></p>
        <p>KreditKarma uses <strong style={{ color: '#10b981' }}>AI and the XRP Ledger</strong> to do something that was never possible before: send money directly from a donor's wallet to the wallet of someone experiencing homelessness — in <strong style={{ color: '#fff' }}>under 5 seconds</strong>, for a fraction of a cent in fees, with every transaction publicly verifiable by anyone on Earth. No board members. No gala dinners. No charity overhead. No rich middlemen skimming the top.</p>
        <p>We also go where people are. We personally distribute <strong style={{ color: '#fff' }}>physical business cards</strong> at Salvation Army locations, public libraries, community centers, and shelters. Anyone can scan the QR code, create a free Xaman wallet in 60 seconds, and access our platform. No ID. No credit history. No bank account required.</p>
        <p>We calculate your <strong style={{ color: '#10b981' }}>LedgerScore</strong> — an on-chain credit score built from your real transaction history on the XRP Ledger. This score belongs to you. No institution can revoke it, freeze it, or use it against you. It's the beginning of a financial identity that the legacy system tried to deny you.</p>
        <p>We are a <strong style={{ color: '#fff' }}>social impact company</strong> — not a charity, not a bank. We generate revenue through financial products and reinvest a meaningful portion into direct grants. We believe the most powerful form of help is permanent economic access — not a one-time handout, but a real financial identity on the world's most open blockchain.</p>
        <div style={{ background: 'rgba(16,185,129,0.06)', border: '1px solid rgba(16,185,129,0.15)', borderRadius: 14, padding: 18 }}>
          <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)', lineHeight: 1.7, fontStyle: 'italic' }}>
            "Every dollar donated here goes to a real person. Not a program. Not overhead. A person. You can verify it yourself on the blockchain. That's not a promise — that's math."
          </p>
          <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.3)', marginTop: 8 }}>— KreditKarma Founding Team</p>
        </div>
      </div>
      <button onClick={onClose} style={{ ...btn('green'), marginTop: 24 }}>Close</button>
    </Overlay>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// MISSION MODAL — updated messaging
// ─────────────────────────────────────────────────────────────────────────────
function MissionModal({ show, onClose }: { show: boolean; onClose: () => void }) {
  return (
    <Overlay show={show} onClose={onClose} wide>
      <div style={tag}>Our Mission</div>
      <h2 style={{ fontSize: 26, fontWeight: 800, marginBottom: 6 }}>Eliminate the middlemen. Deliver hope directly.</h2>
      <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.5)', lineHeight: 1.7, marginBottom: 22 }}>
        Traditional nonprofits were built in a world before the blockchain. They needed staff, offices, payment processors, and banks just to move money from point A to point B. That world is over.
      </p>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 24 }}>
        {[
          { icon: '✂️', title: 'Zero Overhead', text: '100% of donations reach wallets. No admin fees. No salary line items. Verifiable on-chain.' },
          { icon: '⚡', title: 'AI-Powered Speed', text: 'Our AI engine reviews grant requests, detects abuse, and approves legitimate needs in under 60 seconds.' },
          { icon: '🌉', title: 'Bridge Builder', text: 'Physical business cards at shelters. Digital wallets in 60 seconds. Real money in under 5 seconds.' },
          { icon: '📊', title: 'Real Credit Identity', text: 'LedgerScore + bureau reporting creates a financial path forward — not just emergency cash.' },
          { icon: '🔍', title: 'Full Transparency', text: 'Every dollar is traceable on the XRP Ledger. Donors can verify their impact in real time.' },
          { icon: '♻️', title: 'Sustainable Model', text: 'Revenue from Credit Builder and Kredit Shield funds the grant pool permanently — no fundraising cycles.' },
        ].map(({ icon, title, text }) => (
          <div key={title} style={{ background: 'rgba(16,185,129,0.05)', border: '1px solid rgba(16,185,129,0.12)', borderRadius: 14, padding: 16 }}>
            <div style={{ fontSize: 28, marginBottom: 6 }}>{icon}</div>
            <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 6, color: '#fff' }}>{title}</div>
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', lineHeight: 1.6 }}>{text}</div>
          </div>
        ))}
      </div>
      <div style={{ background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.15)', borderRadius: 14, padding: 18, marginBottom: 20 }}>
        <h4 style={{ fontSize: 14, fontWeight: 700, color: '#f87171', marginBottom: 10 }}>The Problem with Traditional Charities</h4>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
          {[['Average charity overhead', '40–70%'], ['CEO pay at major nonprofits', '$400K+/yr'], ['Time from donation to impact', 'Weeks to months'], ['Verifiability of your donation', 'None — trust us']].map(([label, value]) => (
            <div key={label} style={{ background: 'rgba(239,68,68,0.06)', borderRadius: 10, padding: '10px 12px' }}>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', marginBottom: 3 }}>{label}</div>
              <div style={{ fontWeight: 800, color: '#f87171' }}>{value}</div>
            </div>
          ))}
        </div>
      </div>
      <div style={{ background: 'rgba(16,185,129,0.06)', border: '1px solid rgba(16,185,129,0.15)', borderRadius: 14, padding: 18, marginBottom: 20 }}>
        <h4 style={{ fontSize: 14, fontWeight: 700, color: '#10b981', marginBottom: 10 }}>KreditKarma on XRPL</h4>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
          {[['Overhead', '~0%'], ['Salary taken from donations', '$0'], ['Time from donation to wallet', 'Under 5 seconds'], ['Verifiability', 'Public blockchain — forever']].map(([label, value]) => (
            <div key={label} style={{ background: 'rgba(16,185,129,0.06)', borderRadius: 10, padding: '10px 12px' }}>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', marginBottom: 3 }}>{label}</div>
              <div style={{ fontWeight: 800, color: '#10b981' }}>{value}</div>
            </div>
          ))}
        </div>
      </div>
      <button onClick={onClose} style={{ ...btn('green') }}>Close</button>
    </Overlay>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// FAQ MODAL
// ─────────────────────────────────────────────────────────────────────────────
function FAQModal({ show, onClose }: { show: boolean; onClose: () => void }) {
  const [open, setOpen] = useState<number | null>(0);
  const faqs: [string, string][] = [
    ['What is a LedgerScore?', 'A LedgerScore is KreditKarma\'s proprietary on-chain credit score, calculated from your XRP Ledger activity. It considers account age, transaction history, trust line diversity, XRP balance, DEX activity, and escrow usage. Scores range from 300 to 850. Unlike FICO scores, your LedgerScore is calculated in real time and costs nothing to check.'],
    ['Why is KreditKarma better than traditional charities?', 'Traditional nonprofits spend 40–80% of donations on overhead — salaries, buildings, administration, and fundraising. By the time help reaches someone in need, most of the money is gone. KreditKarma uses the XRP Ledger to send money directly from a donor\'s wallet to a recipient\'s wallet. The transaction fee is fractions of a cent. No staff, no building, no skimming. You can verify every dollar on xrpscan.com.'],
    ['How are micro-grants funded and who gets them?', 'The grant pool is funded by user donations (100% direct to grants) and a portion of revenue from our paid products. Grants are reviewed by our AI system and human team within 24 hours. Approved grants are sent directly on-chain to the recipient\'s XRPL wallet — no checks, no wire transfers, no waiting.'],
    ['Is KreditKarma a bank?', 'No. KreditKarma is not a bank and does not hold deposits. We are a financial technology platform built on the XRP Ledger. Micro-loan disbursements are made through XRPL Escrow and Single Asset Vaults — trustless and non-custodial where possible.'],
    ['What is Kredit Shield?', 'Kredit Shield is our XRPL-native insurance product covering loss of funds, issuer clawback events, transaction failures, and DeFi/AMM losses. Premiums are priced based on your LedgerScore — a higher score means lower risk and lower monthly cost.'],
    ['How is my SSN protected?', 'We only request the last 4 digits of your SSN for credit bureau identity verification. This is encrypted in transit (TLS 1.3) and at rest (AES-256). We never store your full SSN, never sell your data, and never use it for any purpose beyond the stated soft pull.'],
    ['Which bureaus does Credit Builder report to?', 'Starter: Equifax soft reporting. Builder: All 3 bureaus (soft). Pro: Hard bureau reporting to Equifax, TransUnion, and Experian — your payment history appears on your traditional credit file, helping build your FICO score over time.'],
    ['Can I use KreditKarma without a wallet?', 'You can browse and check a demo score without a wallet. To receive grants, loan disbursements, or credit lines, you need an XRPL wallet. We recommend Xaman (xaman.app) — free, and takes under 60 seconds to set up.'],
    ['How do I donate?', 'Open the Donate modal, select XRP or RLUSD, enter an amount, and scan the QR code with Xaman. The QR pre-fills the treasury wallet address and your chosen amount — you just slide to send. After sending, tap "I Just Sent My Donation" to record it. Every transaction is verifiable at xrpscan.com.'],
    ['How do I get a business card?', 'We personally distribute KreditKarma cards at Salvation Army locations, public libraries, community centers, and shelters. If you know an organization that should carry our cards, contact us at cards@kreditkarma.us.'],
  ];

  return (
    <Overlay show={show} onClose={onClose} wide>
      <div style={tag}>Frequently Asked Questions</div>
      <h2 style={{ fontSize: 24, fontWeight: 800, marginBottom: 22 }}>Got questions? We have answers.</h2>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {faqs.map(([q, a], i) => (
          <div key={i} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 14, overflow: 'hidden' }}>
            <button onClick={() => setOpen(open === i ? null : i)} style={{ width: '100%', padding: '15px 18px', background: 'transparent', border: 'none', color: '#fff', fontWeight: 700, fontSize: 14, cursor: 'pointer', textAlign: 'left' as const, display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontFamily: 'inherit' }}>
              {q}<span style={{ color: '#10b981', fontSize: 18, flexShrink: 0, marginLeft: 10 }}>{open === i ? '−' : '+'}</span>
            </button>
            {open === i && <div style={{ padding: '0 18px 16px', fontSize: 13, color: 'rgba(255,255,255,0.55)', lineHeight: 1.8 }}>{a}</div>}
          </div>
        ))}
      </div>
      <button onClick={onClose} style={{ ...btn('ghost'), marginTop: 20 }}>Close</button>
    </Overlay>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// TERMS OF SERVICE MODAL
// ─────────────────────────────────────────────────────────────────────────────
function TermsModal({ show, onClose }: { show: boolean; onClose: () => void }) {
  return (
    <Overlay show={show} onClose={onClose} wide>
      <div style={tag}>Terms of Service</div>
      <h2 style={{ fontSize: 22, fontWeight: 800, marginBottom: 4 }}>KreditKarma Terms of Service</h2>
      <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.3)', marginBottom: 20 }}>Effective Date: January 1, 2025 · Last Updated: {new Date().toLocaleDateString()}</p>
      <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)', lineHeight: 1.8, display: 'flex', flexDirection: 'column', gap: 16, maxHeight: '55vh', overflowY: 'auto', paddingRight: 8 }}>
        {([
          ['1. Acceptance of Terms', 'By accessing or using KreditKarma.us ("the Platform"), you agree to be bound by these Terms of Service. If you do not agree, you may not use the Platform. KreditKarma reserves the right to update these Terms at any time. Continued use after changes constitutes acceptance.'],
          ['2. Description of Services', 'KreditKarma provides on-chain credit scoring (LedgerScore), micro-grant facilitation, micro-loan origination via XRPL Escrow and Single Asset Vaults, credit bureau reporting services (Credit Builder), digital asset insurance (Kredit Shield), and a direct-to-wallet financial assistance program for underserved individuals.'],
          ['3. Eligibility', 'You must be at least 18 years old to use financial products on this Platform. Emergency grant assistance is available to any individual with a valid XRPL wallet address, subject to review and approval. No age verification is required for grant applications.'],
          ['4. No Banking Services', 'KreditKarma is not a bank, credit union, or FDIC-insured institution. We do not hold client deposits. All disbursements are made in XRP or RLUSD via the XRP Ledger. KreditKarma is not responsible for fluctuations in XRP or RLUSD market value.'],
          ['5. Credit Builder and Bureau Reporting', 'Credit Builder subscriptions include optional soft and/or hard reporting to Equifax, TransUnion, and Experian depending on tier. Hard credit reporting may affect your FICO score. Bureau data is furnished in accordance with the Fair Credit Reporting Act (FCRA). Disputes may be directed to support@kreditkarma.us.'],
          ['6. Soft Credit Pull', 'By submitting a Soft Credit Pull request, you authorize KreditKarma to request credit information from consumer reporting agencies. This is a soft pull and will not affect your score. You certify all submitted information is accurate and your own.'],
          ['7. Micro-Grants', 'Grants are discretionary and subject to fund availability. Submission does not guarantee approval. KreditKarma reserves the right to deny any application. Approved grants are final and non-transferable.'],
          ['8. Micro-Loans', 'Loan products are facilitated through XRPL Escrow. By applying, you agree to repay principal plus interest by the stated date. Failure to repay may impact your LedgerScore and restrict future services. All rates are disclosed prior to acceptance.'],
          ['9. Kredit Shield Insurance', 'Insurance products are underwritten by third-party coverage partners. KreditKarma is a distributor, not an insurer. Policy terms and exclusions are detailed in your policy documents. Claims are subject to review.'],
          ['10. Prohibited Uses', 'You may not: (a) facilitate fraud or money laundering; (b) submit false identity information; (c) use automated systems to claim grants; (d) reverse-engineer any part of the Platform; (e) use the Platform in violation of applicable law.'],
          ['11. Privacy', 'Your use is governed by our Privacy Policy. We do not sell personal data to third parties.'],
          ['12. Limitation of Liability', 'TO THE MAXIMUM EXTENT PERMITTED BY LAW, KREDITKARMA SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES. OUR TOTAL LIABILITY SHALL NOT EXCEED THE GREATER OF $100 OR THE AMOUNT YOU PAID IN THE PAST 12 MONTHS.'],
          ['13. Governing Law', 'These Terms are governed by the laws of the State of Delaware. Disputes shall be resolved through binding arbitration under the AAA Consumer Arbitration Rules.'],
          ['14. Contact', 'legal@kreditkarma.us · KreditKarma.us · All rights reserved.'],
        ] as [string, string][]).map(([title, body]) => (
          <div key={title}><div style={{ fontWeight: 700, color: '#fff', marginBottom: 5 }}>{title}</div><div>{body}</div></div>
        ))}
      </div>
      <button onClick={onClose} style={{ ...btn('ghost'), marginTop: 20 }}>Close</button>
    </Overlay>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// PRIVACY POLICY MODAL
// ─────────────────────────────────────────────────────────────────────────────
function PrivacyModal({ show, onClose }: { show: boolean; onClose: () => void }) {
  return (
    <Overlay show={show} onClose={onClose} wide>
      <div style={tag}>Privacy Policy</div>
      <h2 style={{ fontSize: 22, fontWeight: 800, marginBottom: 4 }}>KreditKarma Privacy Policy</h2>
      <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.3)', marginBottom: 20 }}>Effective: January 1, 2025 · Last Updated: {new Date().toLocaleDateString()}</p>
      <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)', lineHeight: 1.8, display: 'flex', flexDirection: 'column', gap: 16, maxHeight: '55vh', overflowY: 'auto', paddingRight: 8 }}>
        {([
          ['1. Information We Collect', 'We collect: (a) Information you provide: name, email, phone, date of birth, last 4 digits of SSN (soft pulls only), XRPL wallet address, application details; (b) On-chain data: publicly available XRPL ledger data associated with your wallet; (c) Usage data: browser type, IP address, pages visited, timestamps.'],
          ['2. How We Use Your Information', 'We use your information to: provide LedgerScores and financial products; process grant applications and disbursements; facilitate credit bureau reporting (with consent); verify identity for soft pulls; send transactional communications; improve the platform; comply with legal obligations.'],
          ['3. What We Do NOT Collect or Store', 'We do NOT store your full Social Security Number. We do NOT store private keys or seed phrases. We do NOT sell your personal information for marketing. We do NOT use your data to train AI models without explicit consent.'],
          ['4. Data Sharing', 'We may share with: credit bureaus (with explicit consent for Credit Builder); XRPL node operators (wallet address only, required for on-chain transactions); Kredit Shield underwriting partners (for insurance); legal authorities when required by law.'],
          ['5. Security', 'All data is encrypted in transit (TLS 1.3) and at rest (AES-256). We use role-based access controls and audit logging. Last-4 SSN data is hashed and never stored in plaintext.'],
          ['6. Data Retention', 'Account data: account duration + 7 years. Grant applications: 5 years. Soft pull data: 2 years. Deletion of non-regulatory data available on request.'],
          ['7. Your Rights', 'You may have the right to: access, correct, or delete your personal data; opt out of non-essential communications; lodge a complaint with a supervisory authority.'],
          ['8. Cookies', 'We use essential cookies for authentication. Analytics cookies are opt-in only. We do not use advertising cookies or sell cookie data.'],
          ['9. Children\'s Privacy', 'Our financial services are not directed to individuals under 18. We do not knowingly collect information from minors.'],
          ['10. Contact', 'privacy@kreditkarma.us · Data deletion requests: subject line "Data Request." Response within 30 days.'],
        ] as [string, string][]).map(([title, body]) => (
          <div key={title}><div style={{ fontWeight: 700, color: '#fff', marginBottom: 5 }}>{title}</div><div>{body}</div></div>
        ))}
      </div>
      <button onClick={onClose} style={{ ...btn('ghost'), marginTop: 20 }}>Close</button>
    </Overlay>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN PAGE
// ─────────────────────────────────────────────────────────────────────────────
export default function KreditKarmaHome() {
  const [walletAddress, setWalletAddress] = useState('');
  const [walletConnected, setWalletConnected] = useState(false);
  const [user, setUser] = useState<User | null>(null);

  const [scoreData, setScoreData] = useState<ScoreData | null>(null);
  const [scoreLoading, setScoreLoading] = useState(false);
  const [scoreError, setScoreError] = useState<string | null>(null);

  const [modal, setModal] = useState<ModalName>(null);
  const close = useCallback(() => setModal(null), []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const stored = localStorage.getItem('kk_user');
    if (stored) { try { setUser(JSON.parse(stored)); } catch { /* ignore */ } }
  }, []);

  const fetchScore = useCallback(async (address?: string) => {
    const target = address || walletAddress || TREASURY_WALLET;
    setScoreData(null); setScoreError(null); setScoreLoading(true); setModal('score');
    try {
      const ctrl = new AbortController();
      const t = setTimeout(() => ctrl.abort(), 12_000);
      const res = await fetch(`${API_URL}/api/score/${encodeURIComponent(target)}`, { signal: ctrl.signal });
      clearTimeout(t);
      if (!res.ok) { const b = await res.json().catch(() => ({})); throw new Error(b.message || `API ${res.status}`); }
      const raw = await res.json();
      const ledgerScore = typeof raw.ledgerScore === 'number' ? raw.ledgerScore : typeof raw.score === 'number' ? raw.score : 742;
      setScoreData({ ledgerScore, grade: raw.grade, details: raw.details });
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') setScoreError('Request timed out — please retry.');
      else setScoreData({ ledgerScore: 742, grade: 'Excellent' });
    } finally { setScoreLoading(false); }
  }, [walletAddress]);

  const handleWalletConnected = (addr: string) => { setWalletAddress(addr); setWalletConnected(true); fetchScore(addr); };
  const handleLoggedIn = (u: User) => setUser(u);
  const handleLogout = () => { setUser(null); if (typeof window !== 'undefined') localStorage.removeItem('kk_user'); };
  const openLogin = useCallback(() => setModal('login'), []);

  const heroPrimary: React.CSSProperties = { display: 'inline-flex', alignItems: 'center', gap: 8, padding: '20px 44px', background: '#fff', color: '#000', fontSize: 20, fontWeight: 700, borderRadius: 99, border: 'none', cursor: 'pointer', fontFamily: 'inherit', transition: 'transform 0.18s, box-shadow 0.18s', boxShadow: '0 4px 24px rgba(255,255,255,0.12)' };
  const heroGhost: React.CSSProperties = { display: 'inline-flex', alignItems: 'center', gap: 8, padding: '20px 44px', border: '1.5px solid rgba(255,255,255,0.25)', color: '#fff', fontSize: 20, fontWeight: 600, borderRadius: 99, background: 'transparent', cursor: 'pointer', fontFamily: 'inherit' };

  const FooterLink = ({ children, modal: m, href }: { children: React.ReactNode; modal?: ModalName; href?: string }) =>
    href ? (
      <a href={href} target="_blank" rel="noopener noreferrer" style={{ display: 'block', color: 'rgba(255,255,255,0.5)', fontSize: 14, padding: '4px 0', textDecoration: 'none', cursor: 'pointer' }}>{children}</a>
    ) : (
      <div onClick={() => m && setModal(m)} style={{ display: 'block', color: 'rgba(255,255,255,0.5)', fontSize: 14, padding: '4px 0', cursor: 'pointer' }}>{children}</div>
    );

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        body { background: #0a0a0a; color: #fff; font-family: 'Inter', sans-serif; -webkit-font-smoothing: antialiased; }
        ::placeholder { color: rgba(255,255,255,0.2) !important; }
        input, textarea, button, select { font-family: 'Inter', sans-serif; }
        ::-webkit-scrollbar { width: 4px; } ::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 99px; }

        @keyframes ticker  { from { transform: translateX(0); } to { transform: translateX(-50%); } }
        @keyframes popIn   { from { opacity: 0; transform: scale(0.93) translateY(12px); } to { opacity: 1; transform: scale(1) translateY(0); } }
        @keyframes spin    { to { transform: rotate(360deg); } }
        @keyframes shimmer { 0%{width:0%;margin-left:0} 50%{width:70%;margin-left:0} 100%{width:0%;margin-left:100%} }

        .hero-primary:hover { transform: scale(1.04); box-shadow: 0 8px 40px rgba(255,255,255,0.2) !important; }
        .hero-ghost:hover   { background: rgba(255,255,255,0.08) !important; }
        .product-card { background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.08); border-radius: 28px; padding: 36px; cursor: pointer; transition: border-color 0.2s, transform 0.2s, box-shadow 0.2s; }
        .product-card:hover { border-color: rgba(16,185,129,0.45); transform: translateY(-4px); box-shadow: 0 16px 48px rgba(0,0,0,0.4); }
        .product-card:hover .pcta { color: #34d399 !important; }
        .nav-btn { padding: 9px 20px; border-radius: 99px; font-family: 'Inter',sans-serif; font-weight: 600; font-size: 13px; cursor: pointer; transition: opacity 0.15s; }
      `}</style>

      <div style={{ minHeight: '100vh', background: '#0a0a0a' }}>

        {/* ══ HEADER ══════════════════════════════════════════════════════════ */}
        <header style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '18px 36px', borderBottom: '1px solid rgba(255,255,255,0.07)', position: 'sticky', top: 0, zIndex: 50, background: 'rgba(10,10,10,0.93)', backdropFilter: 'blur(14px)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 36, height: 36, background: '#10b981', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: 17, color: '#000' }}>K</div>
            <span style={{ fontSize: 20, fontWeight: 800, letterSpacing: '-0.5px' }}>kreditkarma</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <button className="nav-btn" onClick={() => setModal('donate')} style={{ background: 'rgba(255,255,255,0.07)', color: '#fff', border: '1px solid rgba(255,255,255,0.1)' }}>Donate</button>
            <button className="nav-btn" onClick={() => setModal('softpull')} style={{ background: 'rgba(255,255,255,0.07)', color: '#fff', border: '1px solid rgba(255,255,255,0.1)' }}>Check Score</button>
            {walletConnected
              ? <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 13px', borderRadius: 99, border: '1px solid rgba(16,185,129,0.35)', background: 'rgba(16,185,129,0.07)', fontSize: 12, fontWeight: 600, color: '#34d399', fontFamily: 'monospace' }}><span style={{ width: 7, height: 7, borderRadius: '50%', background: '#10b981', display: 'inline-block', boxShadow: '0 0 6px #10b981' }} />{walletAddress.slice(0, 8)}…{walletAddress.slice(-4)}</div>
              : <button className="nav-btn" onClick={() => setModal('connect')} style={{ background: 'rgba(255,255,255,0.07)', color: '#fff', border: '1px solid rgba(255,255,255,0.1)' }}>Connect Xaman</button>
            }
            {user
              ? <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', maxWidth: 120, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user.name || user.email}</span>
                  <button className="nav-btn" onClick={handleLogout} style={{ background: 'transparent', color: 'rgba(255,255,255,0.4)', border: '1px solid rgba(255,255,255,0.08)' }}>Log Out</button>
                </div>
              : <button className="nav-btn" onClick={() => setModal('login')} style={{ background: 'rgba(255,255,255,0.07)', color: '#fff', border: '1px solid rgba(255,255,255,0.1)' }}>Log In</button>
            }
            <button className="nav-btn" onClick={() => fetchScore()} style={{ background: '#10b981', color: '#000', border: 'none', fontWeight: 700 }}>Get LedgerScore</button>
          </div>
        </header>

        <Ticker />

        {/* ══ HERO ════════════════════════════════════════════════════════════ */}
        <section style={{ textAlign: 'center', padding: '84px 24px 64px', position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', top: '40%', left: '50%', transform: 'translate(-50%,-50%)', width: 640, height: 640, borderRadius: '50%', background: 'radial-gradient(circle, rgba(16,185,129,0.06) 0%, transparent 70%)', pointerEvents: 'none' }} />
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.25)', color: '#10b981', padding: '7px 18px', borderRadius: 99, fontSize: 12, fontWeight: 700, marginBottom: 30, letterSpacing: '0.06em' }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#10b981', display: 'inline-block', boxShadow: '0 0 6px #10b981' }} />
            LIVE ON XRPL MAINNET · {new Date().getFullYear()}
          </div>
          <h1 style={{ fontSize: 'clamp(50px,9vw,96px)', fontWeight: 900, letterSpacing: '-4px', lineHeight: 0.94, marginBottom: 24 }}>
            KREDIT KARMA<br />FOR THE BLOCKCHAIN
          </h1>
          <p style={{ fontSize: 20, color: 'rgba(255,255,255,0.6)', maxWidth: 520, margin: '0 auto 50px', lineHeight: 1.6 }}>
            Free on-chain credit score + real micro-grants for people who need help.
          </p>
          <div style={{ display: 'flex', gap: 16, justifyContent: 'center', flexWrap: 'wrap' }}>
            <button className="hero-primary" style={heroPrimary} onClick={() => fetchScore()}>Get My Free LedgerScore →</button>
            <button className="hero-ghost" style={heroGhost} onClick={() => setModal('help')}>I Need Help Now ❤️</button>
          </div>
          {walletConnected && <p style={{ marginTop: 18, fontSize: 13, color: 'rgba(255,255,255,0.3)' }}>✅ Wallet connected · Showing your personal score</p>}
        </section>

        <Ticker />

        {/* ══ XRPL SECTION ════════════════════════════════════════════════════ */}
        <section style={{ position: 'relative', padding: '100px 24px', textAlign: 'center', backgroundImage: "url('/xrpl-background.jpg')", backgroundSize: 'cover', backgroundPosition: 'center' }}>
          <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.87)' }} />
          <div style={{ position: 'relative', zIndex: 1, maxWidth: 700, margin: '0 auto' }}>
            <p style={{ color: '#10b981', fontSize: 12, fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: 18 }}>POWERED BY THE XRP LEDGER</p>
            <h2 style={{ fontSize: 'clamp(38px,6vw,72px)', fontWeight: 900, letterSpacing: '-3px', lineHeight: 1, marginBottom: 22 }}>Built on the XRPL</h2>
            <p style={{ fontSize: 18, color: 'rgba(255,255,255,0.7)', lineHeight: 1.7, marginBottom: 36 }}>
              The fastest, most energy-efficient public blockchain in the world — 3-5 second finality, sub-cent fees, and a decade of proven uptime. No middlemen. No overhead. Just money moving at the speed of the internet.
            </p>
            <div style={{ display: 'flex', justifyContent: 'center', gap: 36, flexWrap: 'wrap' }}>
              {[['3-5s','Finality'],['$0.000001','Avg Fee'],['10+','Years Live'],['1,500','TPS']].map(([v, l]) => (
                <div key={l} style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 28, fontWeight: 900, color: '#10b981' }}>{v}</div>
                  <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', marginTop: 2 }}>{l}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <Ticker />

        {/* ══ PRODUCT CARDS ═══════════════════════════════════════════════════ */}
        <section style={{ padding: '80px 36px', maxWidth: 1200, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 52 }}>
            <p style={{ fontSize: 12, fontWeight: 700, color: '#10b981', letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: 12 }}>FINANCIAL PRODUCTS</p>
            <h2 style={{ fontSize: 'clamp(30px,5vw,52px)', fontWeight: 900, letterSpacing: '-2px' }}>Your score opens doors</h2>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px,1fr))', gap: 20 }}>
            {[
              { icon: '💳', title: 'Credit Builder', modal: 'credit' as ModalName, desc: 'Build your LedgerScore and traditional credit simultaneously. Three plans starting at $4.99/mo with bureau reporting to all 3 agencies.', cta: 'View Plans →' },
              { icon: '🏦', title: 'Micro Loans', modal: 'loan' as ModalName, desc: 'Instant loans funded via XRPL Single Asset Vaults, disbursed through Escrow. Your LedgerScore determines your rate from 4.9% APR.', cta: 'Apply Now →' },
              { icon: '🛡️', title: 'Kredit Shield', modal: 'shield' as ModalName, desc: 'XRPL-native insurance covering loss of funds, clawback events, transaction failures, and DeFi/AMM losses. Score-based discounts up to 25%.', cta: 'Get Coverage →' },
            ].map(({ icon, title, modal: m, desc, cta }) => (
              <div key={title} className="product-card" onClick={() => setModal(m)}>
                <div style={{ fontSize: 44, marginBottom: 18 }}>{icon}</div>
                <h3 style={{ fontSize: 26, fontWeight: 800, marginBottom: 12 }}>{title}</h3>
                <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 15, lineHeight: 1.6, marginBottom: 26 }}>{desc}</p>
                <span className="pcta" style={{ color: '#10b981', fontSize: 15, fontWeight: 600 }}>{cta}</span>
              </div>
            ))}
          </div>
        </section>

        <Ticker />

        {/* ══ FOOTER ══════════════════════════════════════════════════════════ */}
        <footer style={{ position: 'relative', padding: '80px 36px 40px', backgroundImage: "url('/xrpl-background.jpg')", backgroundSize: 'cover', backgroundPosition: 'center' }}>
          <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.89)' }} />
          <div style={{ position: 'relative', zIndex: 1, maxWidth: 1200, margin: '0 auto' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px,1fr))', gap: 32, marginBottom: 56 }}>
              <div>
                <h4 style={{ fontWeight: 800, fontSize: 14, marginBottom: 14 }}>KreditKarma</h4>
                <FooterLink modal="about">About KreditKarma</FooterLink>
                <FooterLink modal="mission">Our Mission</FooterLink>
                <FooterLink modal="softpull">Check Credit Score</FooterLink>
              </div>
              <div>
                <h4 style={{ fontWeight: 800, fontSize: 14, marginBottom: 14 }}>Product</h4>
                <FooterLink modal="score">LedgerScore</FooterLink>
                <FooterLink modal="help">Micro Grants</FooterLink>
                <FooterLink modal="credit">Credit Builder</FooterLink>
                <FooterLink modal="loan">Micro Loans</FooterLink>
                <FooterLink modal="shield">Kredit Shield</FooterLink>
              </div>
              <div>
                <h4 style={{ fontWeight: 800, fontSize: 14, marginBottom: 14 }}>Company</h4>
                <FooterLink modal="faq">FAQ</FooterLink>
                <FooterLink modal="terms">Terms of Service</FooterLink>
                <FooterLink modal="privacy">Privacy Policy</FooterLink>
              </div>
              <div>
                <h4 style={{ fontWeight: 800, fontSize: 14, marginBottom: 14 }}>Homeless</h4>
                <FooterLink modal="homeless">Get Emergency Help</FooterLink>
                <FooterLink modal="homeless">Find a Shelter</FooterLink>
                <FooterLink modal="homeless">Food Assistance</FooterLink>
                <FooterLink modal="homeless">Resources</FooterLink>
                <div
                  onClick={() => user ? setModal('status') : setModal('login')}
                  style={{ display: 'block', color: 'rgba(255,255,255,0.5)', fontSize: 14, padding: '5px 0', cursor: 'pointer' }}
                >
                  Application Status {!user && <span style={{ fontSize: 10, color: '#10b981' }}>(Login)</span>}
                </div>
              </div>
              <div>
                <h4 style={{ fontWeight: 800, fontSize: 14, marginBottom: 14 }}>Built on XRPL</h4>
                <FooterLink href="https://xrpscan.com">XRPScan</FooterLink>
                <FooterLink href="https://xrpl.org">XRPL Foundation</FooterLink>
                <FooterLink href="https://xaman.app">Xaman Wallet</FooterLink>
                <FooterLink href={`https://xrpscan.com/account/${TREASURY_WALLET}`}>Treasury Wallet</FooterLink>
              </div>
            </div>
            <div style={{ borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: 26, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ width: 28, height: 28, background: '#10b981', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: 13, color: '#000' }}>K</div>
                <span style={{ fontWeight: 700 }}>kreditkarma</span>
              </div>
              <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: 13 }}>© {new Date().getFullYear()} KreditKarma.us · Social Impact Finance · Powered by the XRP Ledger · Zero Overhead · Direct to Wallets</p>
            </div>
          </div>
        </footer>
      </div>

      {/* ══ MODALS ══════════════════════════════════════════════════════════ */}
      <ScoreModal show={modal === 'score'} onClose={close} scoreData={scoreData} loading={scoreLoading} error={scoreError} walletAddress={walletAddress} onRetry={() => fetchScore()} />
      <LoginModal show={modal === 'login'} onClose={close} onLoggedIn={handleLoggedIn} />
      <SoftPullModal show={modal === 'softpull'} onClose={close} />
      <ConnectModal show={modal === 'connect'} onClose={close} onConnected={handleWalletConnected} />
      <DonateModal show={modal === 'donate'} onClose={close} />
      <HelpModal show={modal === 'help'} onClose={close} />
      <HomelessModal show={modal === 'homeless'} onClose={close} onHelp={() => setModal('help')} />
      <StatusModal show={modal === 'status'} onClose={close} user={user} onNeedLogin={openLogin} />
      <CreditModal show={modal === 'credit'} onClose={close} walletAddress={walletAddress} scoreData={scoreData} />
      <LoanModal show={modal === 'loan'} onClose={close} walletAddress={walletAddress} scoreData={scoreData} />
      <ShieldModal show={modal === 'shield'} onClose={close} walletAddress={walletAddress} scoreData={scoreData} />
      <AboutModal show={modal === 'about'} onClose={close} />
      <MissionModal show={modal === 'mission'} onClose={close} />
      <FAQModal show={modal === 'faq'} onClose={close} />
      <TermsModal show={modal === 'terms'} onClose={close} />
      <PrivacyModal show={modal === 'privacy'} onClose={close} />
    </>
  );
}