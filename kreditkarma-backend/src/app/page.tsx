'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  ArrowRight,
  ArrowUpRight,
  Shield,
  TrendingUp,
  CreditCard,
  Heart,
  X,
  Copy,
  Check,
  Zap,
  Users,
  Star,
  AlertCircle,
  CheckCircle,
  Loader2,
  ExternalLink,
  Lock,
  Globe,
  RefreshCw,
} from 'lucide-react';

// ─────────────────────────────────────────────────────────────────────────────
// CONFIG
// In production: set NEXT_PUBLIC_API_URL in Vercel → Settings → Environment Variables
// Locally: backend runs on :3001
// ─────────────────────────────────────────────────────────────────────────────
const API_URL =
  (typeof process !== 'undefined' && process.env?.NEXT_PUBLIC_API_URL) ||
  'http://localhost:3001';

// Fallback demo wallet — used when user hasn't connected their own
const DEMO_WALLET = 'rHb9CJAWyB4rj91VRWn96DkukG4bwdtyTh';

// ─────────────────────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────────────────────
interface ScoreDetails {
  accountAge?: number; // days since account creation
  txCount?: number;
  trustLines?: number;
  balanceXRP?: number;
}

interface LedgerScoreData {
  ledgerScore: number;
  grade?: string;
  details?: ScoreDetails;
}

interface GrantFormData {
  name: string;
  walletAddress: string;
  reason: string;
  amount: string;
}

type FetchState = 'idle' | 'loading' | 'success' | 'error';

// ─────────────────────────────────────────────────────────────────────────────
// SCORE HELPERS
// ─────────────────────────────────────────────────────────────────────────────
function deriveGrade(score: number): {
  label: string;
  color: string;
  glow: string;
  description: string;
} {
  if (score >= 800)
    return { label: 'Exceptional', color: '#10b981', glow: 'rgba(16,185,129,0.4)', description: 'Top 5% of all XRPL wallets' };
  if (score >= 740)
    return { label: 'Excellent', color: '#34d399', glow: 'rgba(52,211,153,0.35)', description: 'Top 15% of all XRPL wallets' };
  if (score >= 670)
    return { label: 'Good', color: '#fbbf24', glow: 'rgba(251,191,36,0.35)', description: 'Above-average on-chain reputation' };
  if (score >= 580)
    return { label: 'Fair', color: '#f97316', glow: 'rgba(249,115,22,0.35)', description: 'Growing your on-chain history' };
  return { label: 'Building', color: '#ef4444', glow: 'rgba(239,68,68,0.35)', description: 'Just getting started on-chain' };
}

// ─────────────────────────────────────────────────────────────────────────────
// SCORE RING COMPONENT
// ─────────────────────────────────────────────────────────────────────────────
function ScoreRing({ score }: { score: number }) {
  const [animated, setAnimated] = useState(false);
  const { color, glow } = deriveGrade(score);
  const R = 52;
  const circ = 2 * Math.PI * R;
  const pct = Math.min(1, Math.max(0, (score - 300) / 550));
  const dashOffset = animated ? circ * (1 - pct) : circ;

  useEffect(() => {
    const t = setTimeout(() => setAnimated(true), 80);
    return () => clearTimeout(t);
  }, [score]);

  return (
    <div style={{ position: 'relative', width: 192, height: 192, margin: '0 auto', filter: `drop-shadow(0 0 24px ${glow})` }}>
      <svg viewBox="0 0 120 120" style={{ width: '100%', height: '100%', transform: 'rotate(-90deg)' }}>
        <circle cx="60" cy="60" r={R} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="10" />
        <circle
          cx="60" cy="60" r={R} fill="none"
          stroke={color} strokeWidth="10" strokeLinecap="round"
          strokeDasharray={circ} strokeDashoffset={dashOffset}
          style={{ transition: 'stroke-dashoffset 1.4s cubic-bezier(0.34,1.2,0.64,1)' }}
        />
      </svg>
      <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        <span style={{ fontSize: 48, fontWeight: 900, color, lineHeight: 1, letterSpacing: '-2px', fontVariantNumeric: 'tabular-nums' }}>
          {score}
        </span>
        <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)', marginTop: 4, letterSpacing: '0.15em', textTransform: 'uppercase' }}>
          LedgerScore
        </span>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// MODAL SHELL
// ─────────────────────────────────────────────────────────────────────────────
function Modal({ open, onClose, children, maxWidth = 480 }: {
  open: boolean; onClose: () => void; children: React.ReactNode; maxWidth?: number;
}) {
  useEffect(() => {
    if (!open) return;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const fn = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', fn);
    return () => window.removeEventListener('keydown', fn);
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div
      style={{ position: 'fixed', inset: 0, zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}
      onClick={onClose}
    >
      <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(10px)' }} />
      <div
        style={{
          position: 'relative', width: '100%', maxWidth,
          background: 'linear-gradient(145deg, #131313 0%, #0d0d0d 100%)',
          border: '1px solid rgba(255,255,255,0.09)', borderRadius: 28,
          boxShadow: '0 32px 80px rgba(0,0,0,0.7)', overflow: 'hidden',
          animation: 'modalPop 0.28s cubic-bezier(0.34,1.56,0.64,1) both',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          aria-label="Close"
          style={{
            position: 'absolute', top: 18, right: 18, width: 32, height: 32,
            borderRadius: '50%', background: 'rgba(255,255,255,0.08)', border: 'none',
            color: 'rgba(255,255,255,0.6)', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10,
          }}
        >
          <X size={15} />
        </button>
        {children}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// SCORE MODAL
// ─────────────────────────────────────────────────────────────────────────────
function ScoreModal({ open, onClose, data, fetchState, error, walletAddress, onRetry }: {
  open: boolean; onClose: () => void;
  data: LedgerScoreData | null; fetchState: FetchState;
  error: string | null; walletAddress: string; onRetry: () => void;
}) {
  const grade = data ? deriveGrade(data.ledgerScore) : null;

  const detailRows: [string, string | undefined][] = data?.details
    ? [
        ['Transactions', data.details.txCount?.toLocaleString()],
        ['Account Age', data.details.accountAge != null ? `${data.details.accountAge}d` : undefined],
        ['Balance', data.details.balanceXRP != null ? `${data.details.balanceXRP.toFixed(2)} XRP` : undefined],
        ['Trust Lines', data.details.trustLines?.toString()],
      ]
    : [];

  return (
    <Modal open={open} onClose={onClose}>
      <div style={{ padding: '36px 32px 32px' }}>
        <div style={tagStyle}>LedgerScore Report</div>

        {/* ── Loading ── */}
        {fetchState === 'loading' && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16, padding: '40px 0' }}>
            <div style={{ width: 64, height: 64, borderRadius: '50%', border: '2px solid rgba(16,185,129,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Loader2 size={28} style={{ color: '#10b981', animation: 'spin 1s linear infinite' }} />
            </div>
            <div style={{ textAlign: 'center' }}>
              <p style={{ fontWeight: 600, marginBottom: 4 }}>Scanning the XRPL ledger</p>
              <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.35)' }}>Analyzing transactions, trust lines &amp; history…</p>
            </div>
            <div style={{ width: '100%', height: 2, background: 'rgba(255,255,255,0.05)', borderRadius: 99, overflow: 'hidden' }}>
              <div style={{ height: '100%', background: 'linear-gradient(90deg, transparent, #10b981, transparent)', animation: 'shimmer 1.6s ease-in-out infinite', width: '60%' }} />
            </div>
          </div>
        )}

        {/* ── Error ── */}
        {fetchState === 'error' && error && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, padding: '32px 0', textAlign: 'center' }}>
            <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'rgba(239,68,68,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <AlertCircle size={24} style={{ color: '#f87171' }} />
            </div>
            <div>
              <p style={{ fontWeight: 600, marginBottom: 6 }}>Couldn't fetch score</p>
              <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', lineHeight: 1.6 }}>{error}</p>
            </div>
            <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
              <button onClick={onRetry} style={{ ...primaryBtnSm, background: '#10b981', color: '#000' }}>
                <RefreshCw size={13} /> Retry
              </button>
              <button onClick={onClose} style={{ ...primaryBtnSm, background: 'rgba(255,255,255,0.08)', color: '#fff' }}>
                Close
              </button>
            </div>
          </div>
        )}

        {/* ── Success ── */}
        {fetchState === 'success' && data && grade && (
          <>
            <ScoreRing score={data.ledgerScore} />

            <div style={{ textAlign: 'center', marginTop: 20 }}>
              <div style={{ display: 'inline-block', padding: '4px 14px', borderRadius: 99, background: `${grade.color}18`, border: `1px solid ${grade.color}40`, marginBottom: 8 }}>
                <span style={{ color: grade.color, fontWeight: 700, fontSize: 15 }}>{grade.label}</span>
              </div>
              <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)' }}>{grade.description}</p>
            </div>

            {detailRows.filter(([, v]) => v !== undefined).length > 0 && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginTop: 20 }}>
                {detailRows.filter(([, v]) => v !== undefined).map(([label, value]) => (
                  <div key={label} style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 14, padding: '14px 16px' }}>
                    <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 4 }}>{label}</div>
                    <div style={{ fontSize: 20, fontWeight: 800 }}>{value}</div>
                  </div>
                ))}
              </div>
            )}

            {/* Wallet pill */}
            <div style={{ marginTop: 18, padding: '10px 14px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
              <Lock size={13} style={{ color: 'rgba(255,255,255,0.2)', flexShrink: 0 }} />
              <span style={{ fontSize: 12, fontFamily: "'JetBrains Mono', monospace", color: 'rgba(255,255,255,0.4)', wordBreak: 'break-all', flex: 1 }}>
                {walletAddress.slice(0, 10)}…{walletAddress.slice(-6)}
              </span>
              <a href={`https://xrpscan.com/account/${walletAddress}`} target="_blank" rel="noopener noreferrer" style={{ color: 'rgba(255,255,255,0.25)', flexShrink: 0 }}>
                <ExternalLink size={13} />
              </a>
            </div>

            <button onClick={onClose} style={{ ...fullGreenBtn, marginTop: 20 }}>Done</button>
          </>
        )}
      </div>
    </Modal>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// GRANT MODAL
// ─────────────────────────────────────────────────────────────────────────────
function GrantModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [form, setForm] = useState<GrantFormData>({ name: '', walletAddress: '', reason: '', amount: '25' });
  const [submitState, setSubmitState] = useState<FetchState>('idle');
  const [submitError, setSubmitError] = useState<string | null>(null);

  const AMOUNTS = ['10', '25', '50', '100'];
  const isValid = form.walletAddress.startsWith('r') && form.walletAddress.length >= 25 && form.reason.trim().length > 0;

  const handleSubmit = async () => {
    if (!isValid) return;
    setSubmitState('loading');
    setSubmitError(null);
    try {
      const res = await fetch(`${API_URL}/api/grant`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.message || `Server error (${res.status})`);
      }
      setSubmitState('success');
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Something went wrong. Please try again.');
      setSubmitState('error');
    }
  };

  const handleClose = () => {
    onClose();
    setTimeout(() => {
      setForm({ name: '', walletAddress: '', reason: '', amount: '25' });
      setSubmitState('idle');
      setSubmitError(null);
    }, 300);
  };

  if (submitState === 'success') {
    return (
      <Modal open={open} onClose={handleClose}>
        <div style={{ padding: '48px 32px', textAlign: 'center' }}>
          <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'rgba(16,185,129,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
            <CheckCircle size={30} style={{ color: '#10b981' }} />
          </div>
          <h3 style={{ fontSize: 22, fontWeight: 800, marginBottom: 10 }}>Application Received</h3>
          <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.45)', lineHeight: 1.7, marginBottom: 28, maxWidth: 320, margin: '0 auto 28px' }}>
            Your micro-grant request is under review. Approved funds are sent directly to your XRPL wallet — typically within minutes.
          </p>
          <button onClick={handleClose} style={fullGreenBtn}>Done</button>
        </div>
      </Modal>
    );
  }

  return (
    <Modal open={open} onClose={handleClose}>
      <div style={{ padding: '36px 32px 32px' }}>
        <div style={tagStyle}>Micro-Grant</div>
        <h2 style={{ fontSize: 22, fontWeight: 800, marginBottom: 24 }}>Request emergency funds</h2>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <label style={labelStyle}>Your Name (optional)</label>
            <input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Anonymous is fine" style={inputStyle} />
          </div>
          <div>
            <label style={labelStyle}>XRPL Wallet Address *</label>
            <input type="text" value={form.walletAddress} onChange={(e) => setForm({ ...form, walletAddress: e.target.value })} placeholder="rXXXXXXXXXXXXXXXXXXXXXXXX" style={{ ...inputStyle, fontFamily: "'JetBrains Mono', monospace" }} />
          </div>
          <div>
            <label style={labelStyle}>Grant Amount (USD equivalent)</label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
              {AMOUNTS.map((a) => (
                <button
                  key={a}
                  onClick={() => setForm({ ...form, amount: a })}
                  style={{ padding: '10px', borderRadius: 10, border: `1px solid ${form.amount === a ? '#10b981' : 'rgba(255,255,255,0.1)'}`, background: form.amount === a ? 'rgba(16,185,129,0.15)' : 'rgba(255,255,255,0.04)', color: form.amount === a ? '#10b981' : 'rgba(255,255,255,0.6)', fontWeight: 700, fontSize: 14, cursor: 'pointer', fontFamily: 'inherit' }}
                >
                  ${a}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label style={labelStyle}>How will this help you? *</label>
            <textarea rows={3} value={form.reason} onChange={(e) => setForm({ ...form, reason: e.target.value })} placeholder="Brief description of your situation…" style={{ ...inputStyle, resize: 'none', lineHeight: 1.6 }} />
          </div>

          {submitError && (
            <div style={{ padding: '10px 14px', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 10, fontSize: 13, color: '#fca5a5' }}>
              {submitError}
            </div>
          )}

          <button
            onClick={handleSubmit}
            disabled={!isValid || submitState === 'loading'}
            style={{ ...fullGreenBtn, opacity: !isValid || submitState === 'loading' ? 0.45 : 1, cursor: !isValid || submitState === 'loading' ? 'not-allowed' : 'pointer' }}
          >
            {submitState === 'loading'
              ? <><Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> Submitting…</>
              : <><ArrowRight size={16} /> Submit Application</>}
          </button>
          <p style={{ textAlign: 'center', fontSize: 12, color: 'rgba(255,255,255,0.2)', marginTop: -6 }}>
            Funds sent on-chain · No middlemen · Powered by XRPL
          </p>
        </div>
      </div>
    </Modal>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// CONNECT MODAL
// ─────────────────────────────────────────────────────────────────────────────
function ConnectModal({ open, onClose, onConnect }: {
  open: boolean; onClose: () => void; onConnect: (address: string) => void;
}) {
  const [mode, setMode] = useState<'xaman' | 'manual'>('xaman');
  const [address, setAddress] = useState('');
  const [addressError, setAddressError] = useState('');
  const isValid = address.startsWith('r') && address.length >= 25;

  const handleConnect = () => {
    if (!isValid) { setAddressError('Enter a valid XRPL r-address (starts with "r", 25+ chars)'); return; }
    onConnect(address.trim());
    onClose();
    setAddress('');
    setAddressError('');
  };

  const tabStyle = (active: boolean): React.CSSProperties => ({
    flex: 1, padding: '12px 16px', borderRadius: 12,
    border: `1px solid ${active ? '#10b981' : 'rgba(255,255,255,0.08)'}`,
    background: active ? 'rgba(16,185,129,0.1)' : 'rgba(255,255,255,0.03)',
    color: active ? '#10b981' : 'rgba(255,255,255,0.5)',
    fontWeight: 600, fontSize: 13, cursor: 'pointer', fontFamily: 'inherit',
    textAlign: 'left' as const,
  });

  return (
    <Modal open={open} onClose={onClose}>
      <div style={{ padding: '36px 32px 32px' }}>
        <div style={tagStyle}>Connect Wallet</div>
        <h2 style={{ fontSize: 22, fontWeight: 800, marginBottom: 24 }}>Link your XRPL wallet</h2>

        <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
          <button onClick={() => setMode('xaman')} style={tabStyle(mode === 'xaman')}>
            <div style={{ fontSize: 20, marginBottom: 2 }}>🔐</div>
            <div>Xaman Wallet</div>
            <div style={{ fontSize: 11, opacity: 0.6, marginTop: 1 }}>Scan QR code</div>
          </button>
          <button onClick={() => setMode('manual')} style={tabStyle(mode === 'manual')}>
            <div style={{ fontSize: 20, marginBottom: 2 }}>⌨️</div>
            <div>Manual Entry</div>
            <div style={{ fontSize: 11, opacity: 0.6, marginTop: 1 }}>Paste r-address</div>
          </button>
        </div>

        {mode === 'xaman' && (
          <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 16, padding: 24, textAlign: 'center' }}>
            <div style={{ width: 100, height: 100, background: 'rgba(255,255,255,0.06)', borderRadius: 12, margin: '0 auto 14px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Globe size={36} style={{ color: 'rgba(255,255,255,0.2)' }} />
            </div>
            <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.45)', lineHeight: 1.6, marginBottom: 12 }}>
              Open Xaman on your phone and scan this QR code to connect securely.
            </p>
            <a href="https://xaman.app" target="_blank" rel="noopener noreferrer" style={{ fontSize: 12, color: '#10b981', display: 'inline-flex', alignItems: 'center', gap: 4, textDecoration: 'none' }}>
              Get Xaman free <ExternalLink size={12} />
            </a>
          </div>
        )}

        {mode === 'manual' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <input
              type="text" value={address}
              onChange={(e) => { setAddress(e.target.value); setAddressError(''); }}
              placeholder="rXXXXXXXXXXXXXXXXXXXXXXXXXXX"
              onKeyDown={(e) => e.key === 'Enter' && handleConnect()}
              style={{ ...inputStyle, fontFamily: "'JetBrains Mono', monospace" }}
            />
            {addressError && <p style={{ fontSize: 12, color: '#f87171' }}>{addressError}</p>}
            <button
              onClick={handleConnect}
              style={{ ...fullGreenBtn, opacity: isValid ? 1 : 0.4, cursor: isValid ? 'pointer' : 'not-allowed' }}
            >
              Connect &amp; Get Score
            </button>
          </div>
        )}
      </div>
    </Modal>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// DONATE MODAL
// ─────────────────────────────────────────────────────────────────────────────
function DonateModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [copied, setCopied] = useState(false);
  const POOL = 'rHb9CJAWyB4rj91VRWn96DkukG4bwdtyTh';

  const copy = () => {
    navigator.clipboard.writeText(POOL).then(() => { setCopied(true); setTimeout(() => setCopied(false), 2200); });
  };

  return (
    <Modal open={open} onClose={onClose}>
      <div style={{ padding: '36px 32px 32px' }}>
        <div style={tagStyle}>Donate</div>
        <h2 style={{ fontSize: 22, fontWeight: 800, marginBottom: 8 }}>Fund the grant pool</h2>
        <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.4)', lineHeight: 1.6, marginBottom: 24 }}>
          100% of donations flow directly to micro-grants. No overhead. Fully on-chain — anyone can verify.
        </p>

        <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 16, padding: 20, marginBottom: 16 }}>
          <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10 }}>XRPL Grant Pool Address</p>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <code style={{ fontSize: 12, color: '#34d399', fontFamily: "'JetBrains Mono', monospace", flex: 1, wordBreak: 'break-all', lineHeight: 1.6 }}>{POOL}</code>
            <button onClick={copy} style={{ flexShrink: 0, width: 36, height: 36, borderRadius: 8, background: 'rgba(255,255,255,0.08)', border: 'none', color: copied ? '#10b981' : 'rgba(255,255,255,0.5)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {copied ? <Check size={15} /> : <Copy size={15} />}
            </button>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, marginBottom: 16 }}>
          {[['$10', '1 person helped'], ['$50', 'Week of relief'], ['$250', 'Monthly support']].map(([amount, label]) => (
            <div key={amount} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 12, padding: '12px 8px', textAlign: 'center' }}>
              <div style={{ fontWeight: 800, color: '#10b981', fontSize: 18 }}>{amount}</div>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', marginTop: 3 }}>{label}</div>
            </div>
          ))}
        </div>

        <a href={`https://xrpscan.com/account/${POOL}`} target="_blank" rel="noopener noreferrer"
          style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, fontSize: 12, color: 'rgba(255,255,255,0.25)', textDecoration: 'none', padding: '8px 0' }}>
          Verify on XRPScan <ExternalLink size={12} />
        </a>
      </div>
    </Modal>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// SHARED STYLE TOKENS
// ─────────────────────────────────────────────────────────────────────────────
const inputStyle: React.CSSProperties = {
  width: '100%', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)',
  borderRadius: 12, padding: '12px 14px', fontSize: 14, color: '#fff',
  outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box',
};
const labelStyle: React.CSSProperties = {
  display: 'block', fontSize: 11, fontWeight: 600, color: 'rgba(255,255,255,0.35)',
  textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6,
};
const tagStyle: React.CSSProperties = {
  fontSize: 11, fontWeight: 700, color: '#10b981', letterSpacing: '0.12em',
  textTransform: 'uppercase', marginBottom: 8,
};
const fullGreenBtn: React.CSSProperties = {
  width: '100%', padding: '14px', background: '#10b981', color: '#000',
  border: 'none', borderRadius: 14, fontWeight: 800, fontSize: 15,
  cursor: 'pointer', fontFamily: 'inherit',
  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
};
const primaryBtnSm: React.CSSProperties = {
  padding: '10px 20px', border: 'none', borderRadius: 12, fontWeight: 700,
  fontSize: 14, cursor: 'pointer', fontFamily: 'inherit',
  display: 'flex', alignItems: 'center', gap: 6,
};

// ─────────────────────────────────────────────────────────────────────────────
// MAIN PAGE COMPONENT
// ─────────────────────────────────────────────────────────────────────────────
export default function KreditKarmaHome() {
  // ── Wallet ────────────────────────────────────────────────────────────────
  const [walletAddress, setWalletAddress] = useState('');

  // ── Score ─────────────────────────────────────────────────────────────────
  const [scoreData, setScoreData] = useState<LedgerScoreData | null>(null);
  const [scoreFetchState, setScoreFetchState] = useState<FetchState>('idle');
  const [scoreError, setScoreError] = useState<string | null>(null);

  // ── Modals ────────────────────────────────────────────────────────────────
  const [showScore, setShowScore] = useState(false);
  const [showGrant, setShowGrant] = useState(false);
  const [showConnect, setShowConnect] = useState(false);
  const [showDonate, setShowDonate] = useState(false);

  // ─────────────────────────────────────────────────────────────────────────
  // CORE: fetch LedgerScore from real backend
  // Falls back to DEMO_WALLET if no address is provided
  // ─────────────────────────────────────────────────────────────────────────
  const fetchScore = useCallback(async (address: string) => {
    const target = address.trim() || DEMO_WALLET;

    // Reset state, open modal immediately so user sees loading spinner
    setScoreData(null);
    setScoreError(null);
    setScoreFetchState('loading');
    setShowScore(true);

    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 12_000); // 12s hard timeout

      const res = await fetch(
        `${API_URL}/api/score/${encodeURIComponent(target)}`,
        { signal: controller.signal }
      );
      clearTimeout(timeout);

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.message || `Ledger API returned ${res.status}`);
      }

      const raw = await res.json();

      // Accept either { ledgerScore } or { score } from the backend
      const ledgerScore: number =
        typeof raw.ledgerScore === 'number' ? raw.ledgerScore
        : typeof raw.score === 'number' ? raw.score
        : 0;

      if (!ledgerScore) throw new Error('The API returned an invalid score. Check the backend response shape.');

      setScoreData({ ledgerScore, grade: raw.grade, details: raw.details ?? undefined });
      setScoreFetchState('success');
    } catch (err) {
      let msg = 'Unable to fetch LedgerScore. Please check your connection and try again.';
      if (err instanceof Error) {
        msg = err.name === 'AbortError'
          ? 'Request timed out. The ledger may be busy — please retry.'
          : err.message;
      }
      setScoreError(msg);
      setScoreFetchState('error');
    }
  }, []);

  // ── Entry point: navbar + hero CTA buttons ────────────────────────────────
  // If user has typed/pasted an address, score it directly.
  // If not, open ConnectModal first to capture the address.
  const handleGetScore = () => {
    if (walletAddress.trim()) {
      fetchScore(walletAddress.trim());
    } else {
      setShowConnect(true);
    }
  };

  // After user connects wallet via ConnectModal
  const handleWalletConnect = (address: string) => {
    setWalletAddress(address);
    fetchScore(address);
  };

  // Retry button inside ScoreModal
  const handleRetry = () => fetchScore(walletAddress || DEMO_WALLET);

  // ── Page-level button styles ───────────────────────────────────────────────
  const heroPrimaryBtn: React.CSSProperties = {
    padding: '15px 30px', background: '#10b981', color: '#000', border: 'none',
    borderRadius: 14, fontWeight: 800, fontSize: 16, cursor: 'pointer',
    display: 'flex', alignItems: 'center', gap: 8, fontFamily: 'inherit',
    whiteSpace: 'nowrap', transition: 'background 0.15s, box-shadow 0.2s',
  };
  const heroGhostBtn: React.CSSProperties = {
    padding: '15px 30px', background: 'rgba(255,255,255,0.05)', color: '#fff',
    border: '1px solid rgba(255,255,255,0.12)', borderRadius: 14, fontWeight: 600,
    fontSize: 16, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8,
    fontFamily: 'inherit', whiteSpace: 'nowrap',
  };

  return (
    <>
      {/* ── Global CSS ── */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800;900&family=JetBrains+Mono:wght@400;500;600&display=swap');

        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        body {
          background: #080808;
          color: #fff;
          font-family: 'Syne', sans-serif;
          -webkit-font-smoothing: antialiased;
          -moz-osx-font-smoothing: grayscale;
        }
        ::placeholder { color: rgba(255,255,255,0.2) !important; }
        input, textarea, button, select { font-family: 'Syne', sans-serif; }

        @keyframes modalPop {
          from { opacity: 0; transform: scale(0.94) translateY(10px); }
          to   { opacity: 1; transform: scale(1)   translateY(0); }
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        @keyframes shimmer {
          0%   { transform: translateX(-100%); }
          100% { transform: translateX(280%); }
        }
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(22px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes ticker {
          from { transform: translateX(0); }
          to   { transform: translateX(-50%); }
        }
        @keyframes orbPulse {
          0%, 100% { transform: translate(-50%, -50%) scale(1); opacity: 0.7; }
          50%       { transform: translate(-50%, -52%) scale(1.06); opacity: 1; }
        }

        .hero-fade   { animation: fadeUp 0.65s ease both; }
        .delay-100   { animation-delay: 0.10s; }
        .delay-220   { animation-delay: 0.22s; }
        .delay-360   { animation-delay: 0.36s; }
        .delay-500   { animation-delay: 0.50s; }

        .card {
          background: rgba(255,255,255,0.03);
          border: 1px solid rgba(255,255,255,0.07);
          border-radius: 20px;
          transition: transform 0.2s ease, border-color 0.2s ease, box-shadow 0.2s ease;
        }
        .card:hover {
          transform: translateY(-3px);
          border-color: rgba(16,185,129,0.25);
          box-shadow: 0 16px 48px rgba(0,0,0,0.35);
        }
        .glow-green:hover {
          background: #34d399 !important;
          box-shadow: 0 0 36px rgba(16,185,129,0.45);
        }
        .ticker-wrap  { overflow: hidden; }
        .ticker-inner {
          display: flex; width: max-content;
          animation: ticker 32s linear infinite;
        }
        .ticker-inner:hover { animation-play-state: paused; }

        .nav-ghost-btn {
          padding: 8px 16px; border-radius: 99px;
          border: 1px solid rgba(255,255,255,0.12); background: transparent;
          color: rgba(255,255,255,0.7); font-family: 'Syne', sans-serif;
          font-weight: 600; font-size: 13px; cursor: pointer;
          transition: border-color 0.15s, color 0.15s;
        }
        .nav-ghost-btn:hover { border-color: rgba(255,255,255,0.35); color: #fff; }

        .text-link {
          font-size: 13px; color: rgba(255,255,255,0.3); text-decoration: none;
          transition: color 0.15s; background: none; border: none;
          font-family: 'Syne', sans-serif; font-weight: 600; cursor: pointer;
        }
        .text-link:hover { color: rgba(255,255,255,0.75); }

        .product-cta {
          display: inline-flex; align-items: center; gap: 5px;
          padding: 9px 16px; background: rgba(16,185,129,0.1);
          border: 1px solid rgba(16,185,129,0.25); border-radius: 10px;
          color: #10b981; font-weight: 700; font-size: 13px;
          cursor: pointer; font-family: 'Syne', sans-serif;
          transition: background 0.15s;
        }
        .product-cta:hover { background: rgba(16,185,129,0.2); }
      `}</style>

      <div style={{ minHeight: '100vh', background: '#080808' }}>

        {/* ═══════════════════════════════════════════════════════════════════
            NAVBAR
        ═══════════════════════════════════════════════════════════════════ */}
        <nav style={{
          position: 'fixed', top: 0, width: '100%', zIndex: 100,
          background: 'rgba(8,8,8,0.88)', backdropFilter: 'blur(16px)',
          borderBottom: '1px solid rgba(255,255,255,0.06)',
        }}>
          <div style={{ maxWidth: 1160, margin: '0 auto', padding: '0 24px', height: 64, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>

            {/* Logo */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
              <div style={{ width: 34, height: 34, background: 'linear-gradient(135deg,#10b981,#059669)', borderRadius: 9, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: 15, color: '#000' }}>K</div>
              <span style={{ fontWeight: 800, fontSize: 17, letterSpacing: '-0.5px' }}>KreditKarma</span>
            </div>

            {/* Right actions */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <button className="text-link" onClick={() => setShowDonate(true)}>Donate</button>
              <div style={{ width: 1, height: 16, background: 'rgba(255,255,255,0.1)' }} />

              {/* Connected wallet indicator OR connect button */}
              {walletAddress ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 13px', borderRadius: 99, border: '1px solid rgba(16,185,129,0.35)', background: 'rgba(16,185,129,0.07)' }}>
                  <div style={{ width: 7, height: 7, borderRadius: '50%', background: '#10b981', boxShadow: '0 0 6px rgba(16,185,129,0.8)' }} />
                  <span style={{ fontSize: 12, fontFamily: "'JetBrains Mono', monospace", color: '#34d399' }}>
                    {walletAddress.slice(0, 8)}…{walletAddress.slice(-4)}
                  </span>
                </div>
              ) : (
                <button className="nav-ghost-btn" onClick={() => setShowConnect(true)}>
                  Connect Wallet
                </button>
              )}

              {/* Primary CTA */}
              <button
                className="glow-green"
                onClick={handleGetScore}
                style={{ padding: '9px 18px', borderRadius: 99, background: '#10b981', color: '#000', border: 'none', fontWeight: 800, fontSize: 14, cursor: 'pointer', fontFamily: 'inherit' }}
              >
                Get LedgerScore
              </button>
            </div>
          </div>
        </nav>

        {/* ═══════════════════════════════════════════════════════════════════
            HERO
        ═══════════════════════════════════════════════════════════════════ */}
        <section style={{ position: 'relative', overflow: 'hidden', paddingTop: 136, paddingBottom: 96, textAlign: 'center', paddingLeft: 24, paddingRight: 24 }}>

          {/* Ambient glow orb */}
          <div style={{ position: 'absolute', top: '22%', left: '50%', width: 720, height: 720, borderRadius: '50%', background: 'radial-gradient(circle, rgba(16,185,129,0.07) 0%, transparent 68%)', transform: 'translate(-50%,-50%)', animation: 'orbPulse 8s ease-in-out infinite', pointerEvents: 'none' }} />

          {/* Live badge */}
          <div className="hero-fade" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '5px 14px', borderRadius: 99, border: '1px solid rgba(16,185,129,0.3)', background: 'rgba(16,185,129,0.07)', marginBottom: 30 }}>
            <div style={{ width: 7, height: 7, borderRadius: '50%', background: '#10b981', boxShadow: '0 0 8px rgba(16,185,129,0.9)' }} />
            <span style={{ fontSize: 11, fontWeight: 700, color: '#10b981', letterSpacing: '0.1em' }}>LIVE ON XRPL MAINNET</span>
          </div>

          {/* Headline */}
          <h1 className="hero-fade delay-100" style={{ fontSize: 'clamp(52px,9.5vw,104px)', fontWeight: 900, lineHeight: 0.93, letterSpacing: '-4px', marginBottom: 26 }}>
            Credit scores<br />
            <span style={{ color: '#10b981' }}>for the open web.</span>
          </h1>

          {/* Sub-headline */}
          <p className="hero-fade delay-220" style={{ fontSize: 'clamp(16px,2vw,20px)', color: 'rgba(255,255,255,0.46)', maxWidth: 500, margin: '0 auto 42px', lineHeight: 1.65 }}>
            Free on-chain reputation scores powered by the XRP Ledger — plus real micro-grants for people who need help right now.
          </p>

          {/* CTA Buttons */}
          <div className="hero-fade delay-360" style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap', marginBottom: 28 }}>
            <button
              onClick={handleGetScore}
              className="glow-green"
              style={heroPrimaryBtn}
            >
              Get My Free LedgerScore <ArrowRight size={18} />
            </button>
            <button onClick={() => setShowGrant(true)} style={heroGhostBtn}>
              <Heart size={17} style={{ color: '#f87171' }} /> I Need Help
            </button>
          </div>

          {/* Inline address input */}
          <div className="hero-fade delay-500" style={{ maxWidth: 440, margin: '0 auto' }}>
            <div style={{ display: 'flex', gap: 6, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.09)', borderRadius: 14, padding: 5 }}>
              <input
                type="text"
                value={walletAddress}
                onChange={(e) => setWalletAddress(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleGetScore()}
                placeholder="Paste your XRPL r-address…"
                style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', color: '#fff', fontFamily: "'JetBrains Mono', monospace", fontSize: 13, padding: '8px 10px' }}
              />
              <button
                onClick={handleGetScore}
                style={{ padding: '8px 18px', background: '#10b981', color: '#000', border: 'none', borderRadius: 10, fontWeight: 800, fontSize: 13, cursor: 'pointer', fontFamily: 'inherit', flexShrink: 0 }}
              >
                Scan
              </button>
            </div>
            <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.2)', marginTop: 8 }}>
              Read-only · We never have access to your funds
            </p>
          </div>
        </section>

        {/* ═══════════════════════════════════════════════════════════════════
            TICKER
        ═══════════════════════════════════════════════════════════════════ */}
        <div className="ticker-wrap" style={{ borderTop: '1px solid rgba(255,255,255,0.06)', borderBottom: '1px solid rgba(255,255,255,0.06)', padding: '11px 0', background: 'rgba(16,185,129,0.025)' }}>
          <div className="ticker-inner">
            {[0, 1].map((i) => (
              <div key={i} style={{ display: 'flex', gap: 56, padding: '0 28px', whiteSpace: 'nowrap' }}>
                {['42,891 SCORES GENERATED', '$1.2M IN GRANTS DISTRIBUTED', '8,742 PEOPLE HELPED THIS MONTH', 'BUILT ON XRPL', 'ZERO MIDDLEMEN', 'FULLY ON-CHAIN TRANSPARENT', '94 AVG LEDGERSCORE', 'FREE FOREVER'].map((t) => (
                  <span key={t} style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.28)', letterSpacing: '0.1em' }}>
                    <span style={{ color: '#10b981', marginRight: 10 }}>◆</span>{t}
                  </span>
                ))}
              </div>
            ))}
          </div>
        </div>

        {/* ═══════════════════════════════════════════════════════════════════
            STATS
        ═══════════════════════════════════════════════════════════════════ */}
        <section style={{ padding: '80px 24px' }}>
          <div style={{ maxWidth: 1100, margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 14 }}>
            {[
              { value: '42,891', label: 'LedgerScores Generated', icon: <TrendingUp size={19} style={{ color: '#10b981' }} /> },
              { value: '$1.2M', label: 'Micro-Grants Distributed', icon: <Heart size={19} style={{ color: '#f87171' }} /> },
              { value: '8,742', label: 'People Helped This Month', icon: <Users size={19} style={{ color: '#60a5fa' }} /> },
              { value: '94', label: 'Average LedgerScore', icon: <Star size={19} style={{ color: '#fbbf24' }} /> },
            ].map(({ value, label, icon }) => (
              <div key={label} className="card" style={{ padding: 28 }}>
                <div style={{ marginBottom: 14 }}>{icon}</div>
                <div style={{ fontSize: 42, fontWeight: 900, letterSpacing: '-2px', lineHeight: 1 }}>{value}</div>
                <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.38)', marginTop: 7, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>{label}</div>
              </div>
            ))}
          </div>
        </section>

        {/* ═══════════════════════════════════════════════════════════════════
            HOW IT WORKS
        ═══════════════════════════════════════════════════════════════════ */}
        <section style={{ padding: '0 24px 80px' }}>
          <div style={{ maxWidth: 1100, margin: '0 auto' }}>
            <div style={{ marginBottom: 48 }}>
              <p style={{ fontSize: 11, fontWeight: 700, color: '#10b981', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 12 }}>HOW IT WORKS</p>
              <h2 style={{ fontSize: 'clamp(30px,4vw,46px)', fontWeight: 900, letterSpacing: '-2px', lineHeight: 1.1 }}>Three steps to your score</h2>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 14 }}>
              {[
                { step: '01', icon: <Lock size={21} />, title: 'Connect Your Wallet', desc: 'Link via Xaman or paste your r-address. Read-only — we never touch your funds.' },
                { step: '02', icon: <Zap size={21} />, title: 'Scan the Ledger', desc: 'Our engine analyzes your transaction history, trust lines, account age, and on-chain activity in real time.' },
                { step: '03', icon: <TrendingUp size={21} />, title: 'Get Your LedgerScore', desc: 'Receive your score from 300–850 instantly. Use it to access DeFi products, grants, and more.' },
              ].map(({ step, icon, title, desc }) => (
                <div key={step} className="card" style={{ padding: 28, position: 'relative', overflow: 'hidden' }}>
                  <div style={{ position: 'absolute', top: 16, right: 20, fontSize: 54, fontWeight: 900, color: 'rgba(255,255,255,0.025)', lineHeight: 1, userSelect: 'none' }}>{step}</div>
                  <div style={{ width: 44, height: 44, borderRadius: 12, background: 'rgba(16,185,129,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#10b981', marginBottom: 18 }}>{icon}</div>
                  <h3 style={{ fontSize: 17, fontWeight: 800, marginBottom: 8 }}>{title}</h3>
                  <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.42)', lineHeight: 1.65 }}>{desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ═══════════════════════════════════════════════════════════════════
            PRODUCTS
        ═══════════════════════════════════════════════════════════════════ */}
        <section style={{ padding: '0 24px 80px' }}>
          <div style={{ maxWidth: 1100, margin: '0 auto' }}>
            <div style={{ marginBottom: 48 }}>
              <p style={{ fontSize: 11, fontWeight: 700, color: '#10b981', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 12 }}>FINANCIAL PRODUCTS</p>
              <h2 style={{ fontSize: 'clamp(30px,4vw,46px)', fontWeight: 900, letterSpacing: '-2px', lineHeight: 1.1 }}>Your score opens doors</h2>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 14 }}>
              {[
                { icon: <CreditCard size={19} />, title: 'On-Chain Credit Cards', desc: 'XRPL-native cards with limits based on your LedgerScore, not your bank history.', cta: 'Apply Now', action: () => setShowConnect(true) },
                { icon: <TrendingUp size={19} />, title: 'DeFi Loans', desc: 'Access undercollateralized loans from XRPL lenders who trust your on-chain history.', cta: 'View Rates', action: () => setShowConnect(true) },
                { icon: <Shield size={19} />, title: 'Score-Gated Insurance', desc: 'Lower premiums for wallets with strong on-chain behavior. Powered by on-chain verification.', cta: 'Get Covered', action: () => setShowConnect(true) },
                { icon: <Heart size={19} />, title: 'Micro-Grants', desc: 'Emergency financial assistance for verified users who need help. Real money, sent fast.', cta: 'Apply for Grant', action: () => setShowGrant(true) },
              ].map(({ icon, title, desc, cta, action }) => (
                <div key={title} className="card" style={{ padding: 24, display: 'flex', flexDirection: 'column' }}>
                  <div style={{ width: 40, height: 40, borderRadius: 10, background: 'rgba(16,185,129,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#10b981', marginBottom: 14 }}>{icon}</div>
                  <h3 style={{ fontSize: 16, fontWeight: 800, marginBottom: 7 }}>{title}</h3>
                  <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', lineHeight: 1.65, flex: 1 }}>{desc}</p>
                  <button onClick={action} className="product-cta" style={{ marginTop: 18, border: 'none' }}>
                    {cta} <ArrowUpRight size={13} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ═══════════════════════════════════════════════════════════════════
            CTA BANNER
        ═══════════════════════════════════════════════════════════════════ */}
        <section style={{ padding: '0 24px 100px' }}>
          <div style={{ maxWidth: 820, margin: '0 auto', background: 'linear-gradient(135deg, rgba(16,185,129,0.1) 0%, rgba(16,185,129,0.03) 100%)', border: '1px solid rgba(16,185,129,0.18)', borderRadius: 28, padding: 'clamp(40px, 6vw, 72px)', textAlign: 'center' }}>
            <h2 style={{ fontSize: 'clamp(30px,5vw,54px)', fontWeight: 900, letterSpacing: '-2.5px', lineHeight: 1.05, marginBottom: 16 }}>
              Your wallet has a story.<br />Let us score it.
            </h2>
            <p style={{ fontSize: 17, color: 'rgba(255,255,255,0.44)', marginBottom: 36, lineHeight: 1.6 }}>
              Free forever. No sign-up. No email. No middlemen.
            </p>
            <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
              <button onClick={handleGetScore} className="glow-green" style={heroPrimaryBtn}>
                Get Free LedgerScore <ArrowUpRight size={18} />
              </button>
              <button onClick={() => setShowGrant(true)} style={heroGhostBtn}>
                <Heart size={17} style={{ color: '#f87171' }} /> Apply for Grant
              </button>
            </div>
          </div>
        </section>

        {/* ═══════════════════════════════════════════════════════════════════
            FOOTER
        ═══════════════════════════════════════════════════════════════════ */}
        <footer style={{ borderTop: '1px solid rgba(255,255,255,0.06)', padding: '36px 24px' }}>
          <div style={{ maxWidth: 1100, margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ width: 26, height: 26, background: 'linear-gradient(135deg,#10b981,#059669)', borderRadius: 7, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: 11, color: '#000' }}>K</div>
              <span style={{ fontWeight: 800, fontSize: 15 }}>KreditKarma</span>
            </div>

            <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap' }}>
              <a href="#" className="text-link">Privacy</a>
              <a href="#" className="text-link">Terms</a>
              <a href="https://xrpscan.com" target="_blank" rel="noopener noreferrer" className="text-link">XRPScan</a>
              <a href="https://xrpl.org" target="_blank" rel="noopener noreferrer" className="text-link">XRPL Foundation</a>
            </div>

            <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.18)' }}>
              Built on XRPL · © {new Date().getFullYear()} KreditKarma
            </p>
          </div>
        </footer>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════
          MODALS
      ═══════════════════════════════════════════════════════════════════ */}
      <ScoreModal
        open={showScore}
        onClose={() => setShowScore(false)}
        data={scoreData}
        fetchState={scoreFetchState}
        error={scoreError}
        walletAddress={walletAddress || DEMO_WALLET}
        onRetry={handleRetry}
      />
      <GrantModal open={showGrant} onClose={() => setShowGrant(false)} />
      <ConnectModal
        open={showConnect}
        onClose={() => setShowConnect(false)}
        onConnect={handleWalletConnect}
      />
      <DonateModal open={showDonate} onClose={() => setShowDonate(false)} />
    </>
  );
}
