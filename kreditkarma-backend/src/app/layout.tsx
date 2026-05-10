import type { Metadata, Viewport } from 'next';
import './globals.css';

/* ─────────────────────────────────────────────────────────────────────────────
   SEO / Meta
───────────────────────────────────────────────────────────────────────────── */
export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#10b981',
};

export const metadata: Metadata = {
  title: 'KreditKarma — On-Chain Credit Scores & Direct Micro-Grants on XRPL',
  description: 'Free LedgerScores powered by the XRP Ledger. Real micro-grants sent directly to wallets. Zero overhead. No middlemen.',
  keywords: ['XRPL', 'XRP Ledger', 'LedgerScore', 'micro-grants', 'Xaman', 'RLUSD'],
  openGraph: {
    title: 'KreditKarma — XRPL Financial Inclusion',
    description: 'On-chain credit scoring + direct micro-grants on the XRP Ledger',
    url: 'https://kreditkarma.us',
    siteName: 'KreditKarma',
    type: 'website',
  },
};

/* ─────────────────────────────────────────────────────────────────────────────
   Ticker data
───────────────────────────────────────────────────────────────────────────── */
const TICKER = [
  { val: '42,891', label: 'LedgerScores Generated' },
  { val: '$1.2M', label: 'Grants Funded' },
  { val: '8,742', label: 'People Helped' },
  { val: '94', label: 'Avg LedgerScore' },
  { val: '3,104', label: 'Amendment Services' },
  { val: '0%', label: 'Overhead' },
  { val: 'Live', label: 'Treasury on XRPL' },
  { val: '<5s', label: 'Grant to Wallet' },
];

/* ─────────────────────────────────────────────────────────────────────────────
   Footer links
───────────────────────────────────────────────────────────────────────────── */
const FOOTER = [
  { h: 'KreditKarma', links: [
    { t: 'About Us', href: '/#about' },
    { t: 'Our Mission', href: '/#mission' },
    { t: 'How It Works', href: '/#how' },
    { t: 'Admin Panel', href: '/admin' },
  ]},
  { h: 'Products', links: [
    { t: 'LedgerScore', href: '/#score' },
    { t: 'Micro Grants', href: '/#grants' },
    { t: 'Clawback Protection', href: '/donate#services' },
    { t: 'Vault Collateral Service', href: '/donate#services' },
  ]},
  { h: 'Donate', links: [
    { t: 'Send XRP / RLUSD', href: '/donate' },
    { t: 'Treasury on XRPScan', href: 'https://xrpscan.com/account/rs59g3amo5iT6T64Cg96XXMAWuw3WPQcLF', external: true },
  ]},
  { h: 'Help', links: [
    { t: 'Apply for a Grant', href: '/#grants' },
    { t: 'Contact Us', href: 'mailto:hello@kreditkarma.us' },
  ]},
];

const TREASURY = 'rs59g3amo5iT6T64Cg96XXMAWuw3WPQcLF';

/* ─────────────────────────────────────────────────────────────────────────────
   External link icon
───────────────────────────────────────────────────────────────────────────── */
const ExtIcon = () => (
  <svg width="9" height="9" viewBox="0 0 10 10" fill="none" style={{ opacity: 0.5 }}>
    <path d="M1 9L9 1M9 1H3M9 1V7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
  </svg>
);

/* ─────────────────────────────────────────────────────────────────────────────
   ROOT LAYOUT
───────────────────────────────────────────────────────────────────────────── */
export default function RootLayout({ children }: { children: React.ReactNode }) {
  const tickerItems = [...TICKER, ...TICKER, ...TICKER];

  return (
    <html lang="en">
      <body>
        {/* LIVE TICKER */}
        <div className="ticker-wrap">
          <div className="ticker-inner">
            {tickerItems.map((item, i) => (
              <span key={i} className="ticker-item">
                <span className="dot" />
                <span className="val">{item.val}</span>
                <span>{item.label}</span>
              </span>
            ))}
          </div>
        </div>

        {/* MAIN CONTENT */}
        <main>{children}</main>

        {/* PROFESSIONAL FOOTER */}
        <footer className="footer-bg">
          <div style={{ maxWidth: 1240, margin: '0 auto', padding: '72px 32px 48px' }}>
            {/* Brand + Trust */}
            <div style={{ marginBottom: 52 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
                <div style={{ width: 38, height: 38, background: 'linear-gradient(135deg,#10b981,#059669)', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: 18, color: '#000' }}>
                  K
                </div>
                <span style={{ fontSize: 22, fontWeight: 800 }}>kreditkarma</span>
              </div>
              <p style={{ maxWidth: 420, fontSize: 14, color: 'rgba(255,255,255,0.55)', lineHeight: 1.7 }}>
                Free on-chain credit scores. Real micro-grants sent directly to wallets.<br />
                Zero overhead. 100% transparent. Built on the XRP Ledger.
              </p>
            </div>

            {/* Footer Links */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '40px 24px', marginBottom: 60 }}>
              {FOOTER.map((group) => (
                <div key={group.h}>
                  <h4 style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 16 }}>
                    {group.h}
                  </h4>
                  <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {group.links.map((link) => (
                      <li key={link.t}>
                        <a
                          href={link.href}
                          target={link.external ? '_blank' : undefined}
                          rel={link.external ? 'noopener noreferrer' : undefined}
                          style={{ color: 'rgba(255,255,255,0.55)', textDecoration: 'none', fontSize: 13 }}
                        >
                          {link.t} {link.external && <ExtIcon />}
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>

            {/* Bottom Bar */}
            <div style={{ borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: 24, display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16, fontSize: 12, color: 'rgba(255,255,255,0.3)' }}>
              <p>© {new Date().getFullYear()} KreditKarma.us • Social Impact Finance on XRPL</p>
              <a href={`https://xrpscan.com/account/${TREASURY}`} target="_blank" rel="noopener noreferrer" style={{ color: '#10b981' }}>
                Treasury: {TREASURY.slice(0, 8)}...{TREASURY.slice(-6)}
              </a>
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}