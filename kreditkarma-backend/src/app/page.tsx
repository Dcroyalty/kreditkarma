'use client';

import React, { useState, useEffect, useCallback } from 'react';

// ─────────────────────────────────────────────────────────────────────────────
// CONFIG
// ─────────────────────────────────────────────────────────────────────────────
const API_URL = (typeof process !== 'undefined' && process.env?.NEXT_PUBLIC_API_URL) || '';
const TREASURY = 'rs59g3amo5iT6T64Cg96XXMAWuw3WPQcLF';
const XAMAN_DOWNLOAD = 'https://xaman.app/';

// ─────────────────────────────────────────────────────────────────────────────
// TICKER MESSAGES
// ─────────────────────────────────────────────────────────────────────────────
const TICKER_MESSAGES = [
  'No Banks', 'No Brokers', 'Spend Smarter', 'A Credit Score That Actually Helps People',
  'You DONATE → They Submit HELP FORM → AI Uses Treasury', 'ALL DONATIONS RECEIVED Go To SEND "HELP IS ON THE WAY"',
  'XRPL Direct-to-Wallet', 'NO NGO · NO Money Going Missing', 'People Who Need Help Just Ask',
  'AI Helps Every Submission Down To The Last Penny',
];

// ─────────────────────────────────────────────────────────────────────────────
// XRPL HELPERS
// ─────────────────────────────────────────────────────────────────────────────
type Currency = 'RLUSD' | 'XRP';

function xamanLink(address: string, amount: number, currency: Currency): string {
  if (currency === 'XRP' && amount > 0) return `xrpl:${address}?amount=${Math.floor(amount * 1_000_000)}`;
  return `https://xumm.app/detect/request?uri=xrp://${address}?amount=${amount}&dt=1`;
}

function qrSrc(data: string, size = 210): string {
  return `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodeURIComponent(data)}&color=0d9488&bgcolor=030407&qzone=2&format=svg`;
}

// ─────────────────────────────────────────────────────────────────────────────
// TICKER COMPONENT
// ─────────────────────────────────────────────────────────────────────────────
function Ticker({ position = 'top' }: { position?: 'top' | 'bottom' }) {
  const repeated = [...TICKER_MESSAGES, ...TICKER_MESSAGES];
  return (
    <div style={{
      position: 'relative', overflow: 'hidden', width: '100%',
      background: 'linear-gradient(90deg, rgba(16,185,129,.10), rgba(139,92,246,.07), rgba(16,185,129,.10))',
      borderTop: position === 'bottom' ? '1px solid rgba(16,185,129,.22)' : 'none',
      borderBottom: position === 'top' ? '1px solid rgba(16,185,129,.22)' : 'none',
      backdropFilter: 'blur(10px)', zIndex: 50,
    }}>
      <div style={{
        display: 'inline-flex', whiteSpace: 'nowrap', padding: '10px 0',
        animation: 'tickerScroll 60s linear infinite', willChange: 'transform',
      }}>
        {repeated.map((msg, i) => (
          <span key={`${msg}-${i}`} style={{
            display: 'inline-flex', alignItems: 'center', gap: 12,
            padding: '0 22px', fontSize: 12, fontWeight: 700,
            letterSpacing: '.06em', color: '#fff',
            fontFamily: "'IBM Plex Mono', monospace", textTransform: 'uppercase',
          }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#10b981', boxShadow: '0 0 10px #10b981', animation: 'pulse 1.6s infinite' }} />
            <span className="ticker-strobe">{msg}</span>
          </span>
        ))}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// PRODUCTS (your full list from Claude)
// ─────────────────────────────────────────────────────────────────────────────
const PRODUCTS = [ /* paste your full PRODUCTS array here from Claude */ ] as const;

type Product = typeof PRODUCTS[number];

// ─────────────────────────────────────────────────────────────────────────────
// MAIN COMPONENT
// ─────────────────────────────────────────────────────────────────────────────
export default function KreditKarmaHome() {
  const [walletAddress, setWalletAddress] = useState('');
  const [walletInput, setWalletInput] = useState('');
  const [scoreData, setScoreData] = useState<any>(null);
  const [scoreLoading, setScoreLoading] = useState(false);
  const [scoreError, setScoreError] = useState<string | null>(null);
  const [activeProduct, setActiveProduct] = useState<Product | null>(null);
  const [showDonate, setShowDonate] = useState(false);
  const [showGrant, setShowGrant] = useState(false);
  // ... add other modals as needed from your Claude code

  const fetchScore = useCallback(async (address?: string) => {
    const target = address || walletAddress || walletInput || TREASURY;
    setScoreData(null);
    setScoreError(null);
    setScoreLoading(true);
    // Simulate score for now
    setTimeout(() => {
      setScoreData({ ledgerScore: 742, tier: 'EXCELLENT', breakdown: 'Strong on-chain activity' });
      setScoreLoading(false);
    }, 800);
  }, [walletAddress, walletInput]);

  return (
    <>
      <style>{`
        @keyframes tickerScroll { from { transform: translateX(0); } to { transform: translateX(-50%); } }
        @keyframes pulse { 0%,100% { opacity:1; } 50% { opacity:0.6; } }
        .ticker-strobe { animation: pulse 2s infinite; }
      `}</style>

      {/* Seamless Background */}
      <div style={{ position: 'fixed', inset: 0, zIndex: -1, backgroundImage: "url('/xrpl-background.jpg')", backgroundSize: 'cover', backgroundPosition: 'center', backgroundAttachment: 'fixed' }} />

      <div style={{ minHeight: '100vh', fontFamily: "'Syne', sans-serif", color: '#eeeef5' }}>

        {/* NAV (keep your existing nav) */}

        {/* TICKER UNDER HEADER */}
        <Ticker position="top" />

        {/* HERO — OPTION #1 */}
        <div className="pt-24 pb-20 text-center px-6 relative">
          <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-md border border-white/20 rounded-full px-5 py-1.5 mb-6 text-sm">
            ON-CHAIN • TRANSPARENT • XRPL
          </div>

          <h1 className="text-6xl md:text-7xl font-bold tracking-tighter leading-none">
            On-Chain Credit • Credit Builder • Real XRPL Services
          </h1>

          <p className="mt-6 text-2xl md:text-3xl text-gray-200 max-w-3xl mx-auto">
            Fund real grants • Give directly • Instant help on the XRPL
          </p>

          <p className="mt-4 text-lg text-[#10b981] font-medium">
            No banks. No brokers. 100% transparent treasury.
          </p>

          <div className="mt-8 inline-flex items-center gap-3 bg-[#10b981]/10 border border-[#10b981]/30 rounded-3xl px-6 py-3 text-sm font-semibold text-[#10b981]">
            <span className="w-3 h-3 bg-[#10b981] rounded-full animate-pulse"></span>
            XAMAN WALLET REQUIRED — <a href="https://xaman.app/" target="_blank" rel="noopener noreferrer" className="underline">Download Free</a>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center mt-12">
            <button onClick={() => fetchScore()} className="bg-[#10b981] hover:bg-white hover:text-black text-black font-bold px-10 py-5 rounded-2xl text-xl transition-all">
              Get My Free LedgerScore
            </button>
            <button onClick={() => { const el = document.getElementById('products'); el?.scrollIntoView({ behavior: 'smooth' }); }} className="border border-white/50 hover:bg-white/10 font-bold px-10 py-5 rounded-2xl text-xl transition-all">
              Browse XRPL Services
            </button>
          </div>
        </div>

        {/* REST OF YOUR PAGE (products, grants, etc.) — keep the rest of Claude's code here */}

        {/* TICKER OVER FOOTER */}
        <Ticker position="bottom" />

        {/* FOOTER (keep your existing footer) */}
      </div>

      {/* MODALS (keep your existing modals) */}
    </>
  );
}