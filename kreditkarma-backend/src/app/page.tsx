'use client';
import React, { useState } from 'react';

const TREASURY = "rs59g3amo5iT6T64Cg96XXMAWuw3WPQcLF";

interface ScoreData {
  score: number;
  tier: string;
  breakdown: string;
}

const PRODUCTS = [
  { id: 'clawback', emoji: '🔒', name: 'Clawback Protection', price: 25, desc: 'Protect your assets from unauthorized clawbacks', color: '#10b981' },
  { id: 'vault', emoji: '🏛️', name: 'Vault Collateral', price: 50, desc: 'Secure collateral with XRPL Escrow', color: '#10b981' },
  { id: 'loss', emoji: '🛡️', name: 'Loss Coverage', price: 35, desc: 'Mutual aid pool for on-chain protection', color: '#10b981' },
  { id: 'credit', emoji: '📈', name: 'Credit Builder', price: 15, desc: 'Monthly on-chain credit building', color: '#10b981', monthly: true },
  { id: 'amm', emoji: '🌊', name: 'DEX Liquidity Guard', price: 40, desc: 'Protect AMM positions', color: '#10b981' },
];

export default function KreditKarmaHome() {
  const [wallet, setWallet] = useState('');
  const [score, setScore] = useState<ScoreData | null>(null);
  const [activeProduct, setActiveProduct] = useState<any>(null);

  const xamanLink = (productName: string, amount: number) => {
    const memo = encodeURIComponent(`KreditKarma ${productName} ${amount} RLUSD`);
    return `https://xumm.app/detect/request?uri=xrp://${TREASURY}?amount=${amount}&dt=1&memo=${memo}`;
  };

  const checkScore = async () => {
    if (!wallet) return alert("Enter wallet address");
    // Simulate score for now
    setScore({ 
      score: 742, 
      tier: "EXCELLENT", 
      breakdown: "Strong on-chain activity detected" 
    });
  };

  return (
    <div className="min-h-screen bg-[#030407] text-white overflow-hidden">
      {/* Test Banner */}
      <div className="bg-[#10b981] text-black text-center py-4 font-bold text-xl">
        🚀 FULL CLAUDE VERSION LIVE - MAY 10
      </div>

      {/* Hero */}
      <div className="pt-20 pb-16 text-center px-6">
        <h1 className="text-6xl md:text-7xl font-bold tracking-tighter">KREDITKARMA</h1>
        <p className="mt-4 text-2xl text-gray-300">On-Chain Credit • XRPL Services • Real Grants</p>
        
        <div className="flex flex-wrap justify-center gap-4 mt-10">
          <button className="bg-[#10b981] hover:bg-white hover:text-black text-black font-bold px-10 py-4 rounded-full text-lg transition-all">Check My LedgerScore</button>
          <button className="border border-white/50 hover:bg-white/10 font-bold px-10 py-4 rounded-full text-lg transition-all">Donate to Treasury</button>
        </div>
      </div>

      {/* LedgerScore */}
      <div className="max-w-3xl mx-auto px-6 pb-20">
        <h2 className="text-4xl font-bold mb-6 text-center">LedgerScore</h2>
        <div className="flex gap-4">
          <input
            type="text"
            placeholder="Enter XRPL Wallet Address"
            value={wallet}
            onChange={(e) => setWallet(e.target.value)}
            className="flex-1 bg-white/5 border border-white/20 rounded-2xl px-6 py-4 text-lg focus:outline-none focus:border-[#10b981]"
          />
          <button onClick={checkScore} className="bg-[#10b981] hover:bg-white hover:text-black font-bold px-10 rounded-2xl text-lg transition-all">Get My Score</button>
        </div>
        {score && (
          <div className="mt-8 p-8 bg-white/5 rounded-3xl border border-[#10b981]/30 text-center">
            <div className="text-7xl font-bold text-[#10b981]">{score.score}</div>
            <div className="text-2xl mt-2">{score.tier}</div>
            <p className="mt-4 text-gray-400">{score.breakdown}</p>
          </div>
        )}
      </div>

      {/* Services */}
      <div className="max-w-6xl mx-auto px-6 pb-24">
        <h2 className="text-5xl font-bold text-center mb-12">XRPL Amendment Services</h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {PRODUCTS.map((p) => (
            <div key={p.id} className="bg-white/5 border border-white/10 hover:border-[#10b981] hover:scale-[1.03] transition-all rounded-3xl p-8 group">
              <div className="text-5xl mb-6">{p.emoji}</div>
              <h3 className="text-3xl font-bold">{p.name}</h3>
              <p className="text-5xl font-bold text-[#10b981] mt-4">${p.price} RLUSD{p.monthly && "/mo"}</p>
              <p className="mt-4 text-gray-400">{p.desc}</p>
              <a
                href={xamanLink(p.name, p.price)}
                target="_blank"
                className="block mt-8 bg-[#10b981] hover:bg-white hover:text-black text-center font-bold py-5 rounded-2xl text-lg transition-all"
              >
                Purchase Now
              </a>
            </div>
          ))}
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-white/10 py-12 text-center text-sm text-gray-500">
        © 2026 KreditKarma.us • Social Impact Finance on the XRP Ledger<br />
        Not a bank • Not an insurer • 100% on-chain<br />
        Treasury: <a href={`https://xrpscan.com/account/${TREASURY}`} target="_blank" className="text-[#10b981]">{TREASURY}</a>
      </footer>
    </div>
  );
}