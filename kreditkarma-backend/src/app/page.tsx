'use client';
import React, { useState } from 'react';
import confetti from 'canvas-confetti';

const TREASURY = "rs59g3amo5iT6T64Cg96XXMAWuw3WPQcLF";

export default function KreditKarmaHome() {
  const [wallet, setWallet] = useState("");
  const [scoreData, setScoreData] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const checkLedgerScore = async () => {
    if (!wallet) return alert("Enter a wallet address");
    setLoading(true);
    try {
      const res = await fetch(`/api/score/${wallet}`);
      const data = await res.json();
      setScoreData(data);
      confetti({ particleCount: 100, spread: 70 });
    } catch (e) {
      alert("Error fetching score");
    }
    setLoading(false);
  };

  const xamanDeepLink = (amount: string, memo: string = "KreditKarma Treasury") => {
    const encodedMemo = encodeURIComponent(memo);
    return `https://xumm.app/detect/request?uri=xrp://${TREASURY}?amount=${amount}&dt=1&memo=${encodedMemo}`;
  };

  return (
    <div className="min-h-screen text-white">
      {/* Hero */}
      <section className="relative h-screen flex items-center justify-center text-center px-6">
        <div className="absolute inset-0 bg-black/60" />
        <div className="relative z-10 max-w-4xl mx-auto">
          <h1 className="text-6xl md:text-7xl font-bold mb-6 tracking-tighter">
            KREDITKARMA
          </h1>
          <p className="text-2xl md:text-3xl mb-8 text-green-400">
            On-Chain Credit • XRPL Services • Real Grants
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button 
              onClick={() => document.getElementById('score')?.scrollIntoView({ behavior: 'smooth' })}
              className="btn-green text-xl px-10 py-4"
            >
              Check My LedgerScore
            </button>
            <a href="/donate" className="border border-white/60 hover:bg-white/10 text-xl px-10 py-4 rounded-full transition">
              Donate to Treasury
            </a>
          </div>
        </div>
      </section>

      {/* Live Ticker already in layout */}

      {/* LedgerScore Section */}
      <section id="score" className="py-20 bg-black/40">
        <div className="max-w-4xl mx-auto px-6">
          <h2 className="text-5xl font-bold text-center mb-12">LedgerScore</h2>
          <div className="card p-8 max-w-md mx-auto">
            <input
              type="text"
              placeholder="Enter XRPL Wallet Address"
              value={wallet}
              onChange={(e) => setWallet(e.target.value)}
              className="w-full bg-black/50 border border-white/20 rounded-2xl px-6 py-4 text-lg mb-6"
            />
            <button 
              onClick={checkLedgerScore}
              disabled={loading}
              className="btn-green w-full py-4 text-xl"
            >
              {loading ? "Checking on XRPL..." : "Get My Score"}
            </button>

            {scoreData && (
              <div className="mt-8 text-center">
                <div className="text-7xl font-bold text-green-400">{scoreData.ledgerScore}</div>
                <div className="text-2xl mt-2">{scoreData.grade}</div>
                <p className="text-sm text-white/60 mt-4">Real-time on XRPL Testnet</p>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Products / Services */}
      <section className="py-20">
        <div className="max-w-6xl mx-auto px-6">
          <h2 className="text-5xl font-bold text-center mb-16">XRPL Amendment Services</h2>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { name: "Clawback Protection", price: "25 RLUSD", desc: "Protect against unauthorized sends" },
              { name: "Vault Collateral", price: "50 RLUSD", desc: "Secure lending & borrowing" },
              { name: "Loss Coverage", price: "35 RLUSD", desc: "On-chain insurance alternative" },
            ].map((p, i) => (
              <div key={i} className="card p-8 hover:scale-105 transition">
                <h3 className="text-2xl font-bold mb-3">{p.name}</h3>
                <p className="text-green-400 text-3xl font-bold mb-6">{p.price}</p>
                <p className="text-white/70 mb-8">{p.desc}</p>
                <a href={`/donate?service=${p.name}`} className="btn-green block text-center py-4">
                  Purchase Now
                </a>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Donate Quick Link */}
      <div className="text-center py-12">
        <a href="/donate" className="inline-block btn-green text-2xl px-16 py-6">
          Support the Treasury → Fill with XRP / RLUSD
        </a>
      </div>
    </div>
  );
}