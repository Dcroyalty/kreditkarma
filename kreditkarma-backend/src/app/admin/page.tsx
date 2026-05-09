"use client";

import { useState } from "react";

export default function AdminPage() {
  const [authed, setAuthed] = useState(false);
  const [secret, setSecret] = useState("");
  const [stats, setStats] = useState<any>(null);
  const [grants, setGrants] = useState<any[]>([]);
  const [error, setError] = useState("");

  async function login(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    try {
      const res = await fetch("/api/admin", {
        headers: { "x-admin-secret": secret },
      });
      if (!res.ok) throw new Error("Invalid admin secret");
      const data = await res.json();
      setStats(data.stats || data);
      setGrants(data.grants || []);
      setAuthed(true);
    } catch (err: any) {
      setError(err.message);
    }
  }

  if (!authed) {
    return (
      <main>
        <section className="hero" style={{ paddingTop: 120 }}>
          <div className="container">
            <h1 style={{ fontSize: 36 }}>Admin Login</h1>
            <div className="card" style={{ maxWidth: 480, margin: "32px auto" }}>
              <form onSubmit={login}>
                <div className="form-group">
                  <label>Admin Secret</label>
                  <input
                    type="password"
                    value={secret}
                    onChange={(e) => setSecret(e.target.value)}
                    placeholder="Enter admin secret"
                    required
                  />
                </div>
                <button type="submit" className="btn btn-primary" style={{ width: "100%" }}>Login</button>
                {error && <div style={{ color: 'var(--danger)', marginTop: 16 }}>{error}</div>}
              </form>
            </div>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main>
      <section className="hero" style={{ paddingTop: 80, paddingBottom: 32 }}>
        <div className="container">
          <h1 style={{ fontSize: 36, marginBottom: 8 }}>Admin Dashboard</h1>
          <p style={{ color: 'var(--text-muted)' }}>Treasury & Grant Management</p>
        </div>
      </section>

      <div className="container">
        <div className="stats-grid">
          <div className="stat">
            <div className="stat-value">${stats?.totalDonated ?? 0}</div>
            <div className="stat-label">Total Donated</div>
          </div>
          <div className="stat">
            <div className="stat-value">${stats?.totalGranted ?? 0}</div>
            <div className="stat-label">Grants Paid</div>
          </div>
          <div className="stat">
            <div className="stat-value">{stats?.pendingGrants ?? 0}</div>
            <div className="stat-label">Pending Review</div>
          </div>
          <div className="stat">
            <div className="stat-value">${stats?.dailyRemaining ?? 1000}</div>
            <div className="stat-label">Daily Cap Left</div>
          </div>
        </div>

        <div className="card" style={{ marginTop: 32 }}>
          <h2 style={{ marginBottom: 16 }}>Recent Grant Requests</h2>
          {grants.length === 0 ? (
            <p style={{ color: 'var(--text-muted)' }}>No grant requests yet.</p>
          ) : (
            <table className="table">
              <thead>
                <tr>
                  <th>Wallet</th>
                  <th>Amount</th>
                  <th>Category</th>
                  <th>Status</th>
                  <th>Created</th>
                </tr>
              </thead>
              <tbody>
                {grants.map((g: any) => (
                  <tr key={g.id}>
                    <td style={{fontFamily: 'monospace', fontSize: 12}}>{g.walletAddress?.slice(0,12)}...</td>
                    <td>${g.amountRequested} {g.currency}</td>
                    <td>{g.category}</td>
                    <td>
                      <span className={`badge ${g.status === 'PAID' ? 'badge-success' : g.status === 'PENDING' ? 'badge-warning' : 'badge-danger'}`}>
                        {g.status}
                      </span>
                    </td>
                    <td>{new Date(g.createdAt).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </main>
  );
}