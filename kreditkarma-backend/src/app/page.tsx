"use client";

import { useState } from "react";

export default function Home() {
  const [address, setAddress] = useState("");
  const [score, setScore] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function lookupScore(e: React.FormEvent) {
    e.preventDefault();
    if (!address) return;
    setLoading(true);
    setError("");
    setScore(null);
    try {
      const res = await fetch(`/api/score/${address}`);
      if (!res.ok) throw new Error("Could not fetch score for this address");
      const data = await res.json();
      setScore(data);
    } catch (err: any) {
      setError(err.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main>
      <section className="hero">
        <div className="container">
          <h1>The XRPL-Native Financial Inclusion Platform</h1>
          <p>
            On-chain credit scoring. Multi-sig micro grants. Credit Builder reporting to all 3 bureaus.
            XRPL Vaults with built-in loss protection. 100% transparent. Built for everyone.
          </p>
          <div className="hero-cta">
            <a href="#score" className="btn btn-primary">Check My LedgerScore</a>
            <a href="/donate" className="btn btn-secondary">Donate to Treasury</a>
          </div>
        </div>
      </section>

      <section className="features">
        <div className="container">
          <h2 className="section-title">Our Products</h2>
          <p className="section-subtitle">Five XRPL-native ways to build, borrow, and give</p>
          <div className="features-grid">
            <div className="card">
              <div className="feature-icon">📊</div>
              <h3 className="feature-title">LedgerScore</h3>
              <p className="feature-desc">
                Your credit score derived 100% from XRPL on-chain activity—account age,
                transaction history, AMM participation, trustline diversity. No SSN. No credit pull.
              </p>
            </div>
            <div className="card">
              <div className="feature-icon">💰</div>
              <h3 className="feature-title">Micro Grants</h3>
              <p className="feature-desc">
                Apply for grants up to $1,000 in RLUSD or XRP for rent, utilities, groceries, or medical.
                AI underwriting in seconds. Multi-sig treasury. Daily caps. Fully on-chain.
              </p>
            </div>
            <div className="card">
              <div className="feature-icon">🏗️</div>
              <h3 className="feature-title">Credit Builder</h3>
              <p className="feature-desc">
                Make monthly on-chain payments that we report to all 3 major credit bureaus.
                Build real-world FICO from XRPL activity, tiered by your LedgerScore.
              </p>
            </div>
            <div className="card">
              <div className="feature-icon">🏦</div>
              <h3 className="feature-title">XRPL Vaults</h3>
              <p className="feature-desc">
                Collateralized loan products using XRPL native vaults. Built-in claw-back and loss
                protection via XRPL amendments. No middlemen, no rehypothecation.
              </p>
            </div>
            <div className="card">
              <div className="feature-icon">🛡️</div>
              <h3 className="feature-title">Community Treasury</h3>
              <p className="feature-desc">
                Mutual aid + loss coverage funded by donations. 2-of-3 multi-signature protected.
                Daily caps prevent misuse. Every transaction visible on-chain forever.
              </p>
            </div>
            <div className="card">
              <div className="feature-icon">⚡</div>
              <h3 className="feature-title">Instant Settlement</h3>
              <p className="feature-desc">
                XRPL transactions settle in 3-5 seconds with fees under a cent.
                Approved grants and loans arrive immediately. No banking delays.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="score-section" id="score">
        <div className="container">
          <h2 className="section-title">Check Your LedgerScore</h2>
          <p className="section-subtitle">Enter your XRPL wallet address for an instant on-chain credit score</p>
          <div className="card score-card">
            <form onSubmit={lookupScore}>
              <div className="form-group">
                <label htmlFor="address">XRPL Wallet Address</label>
                <input
                  id="address"
                  type="text"
                  placeholder="rXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  required
                />
              </div>
              <button type="submit" className="btn btn-primary" disabled={loading} style={{ width: '100%' }}>
                {loading ? "Checking..." : "Get My LedgerScore"}
              </button>
            </form>

            {error && <div style={{ marginTop: 16, color: 'var(--danger)' }}>{error}</div>}

            {score && (
              <div className="score-result">
                <div className="score-number">{score.score || score.ledgerScore || "—"}</div>
                <div className="score-tier">{score.tier || "FAIR"}</div>
                {score.address && (
                  <div style={{ marginTop: 12, fontSize: 12, color: 'var(--text-muted)', wordBreak: 'break-all' }}>
                    {score.address}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </section>

      <section className="cta">
        <div className="container">
          <div className="cta-card">
            <h2>Help Build Financial Inclusion on XRPL</h2>
            <p>Every donation funds grants for people who need them most. 100% on-chain. 100% transparent.</p>
            <a href="/donate" className="btn btn-primary">Donate to the Treasury</a>
          </div>
        </div>
      </section>
    </main>
  );
}