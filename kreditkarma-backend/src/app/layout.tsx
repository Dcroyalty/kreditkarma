import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "KreditKarma — XRPL Credit Scoring, Grants & Credit Builder",
  description: "On-chain credit scoring on XRPL. Micro grants. Credit Builder reporting to 3 bureaus. XRPL Vaults with loss protection. Built for financial inclusion.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <header className="header">
          <div className="container header-inner">
            <a href="/" className="logo">Kredit<span>Karma</span></a>
            <nav className="nav">
              <a href="/#score">Get Score</a>
              <a href="/donate">Donate</a>
              <a href="/admin">Admin</a>
            </nav>
          </div>
        </header>
        {children}
        <footer className="footer">
          <div className="container">
            <p>© 2026 KreditKarma · Built on the XRP Ledger · Powered by AI Underwriting</p>
            <p style={{marginTop: 8}}>
              <a href="/donate">Donate</a> · <a href="mailto:hello@kreditkarma.us">Contact</a>
            </p>
          </div>
        </footer>
      </body>
    </html>
  );
}