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
  description:
    'Free LedgerScores powered by the XRP Ledger. Real micro-grants sent directly to wallets. ' +
    'Zero overhead. No middlemen. XRPL Amendment Services for on-chain financial operations.',
  keywords:
    'XRPL, XRP Ledger, credit score, LedgerScore, micro-grants, blockchain finance, ' +
    'Xaman, RLUSD, DeFi, clawback protection, vault collateral',
  openGraph: {
    title: 'KreditKarma — Credit Scores for the Blockchain',
    description:
      'Free on-chain credit scores + real grants direct to wallets. Zero overhead.',
    url: 'https://kreditkarma-obi2.vercel.app',
    siteName: 'KreditKarma',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'KreditKarma — Credit Scores for the Blockchain',
    description: 'Free on-chain credit scores + real grants direct to wallets.',
  },
  robots: { index: true, follow: true },
};

/* ─────────────────────────────────────────────────────────────────────────────
   Ticker data
   Swap "value" fields with a live /api/stats call whenever you want.
───────────────────────────────────────────────────────────────────────────── */
const TICKER: { val: string; label: string }[] = [
  { val: '42,891',  label: 'LedgerScores Generated'  },
  { val: '$1.2M',   label: 'Grants Funded'            },
  { val: '8,742',   label: 'People Helped'             },
  { val: '94',      label: 'Avg LedgerScore'           },
  { val: '3,104',   label: 'Amendment Services'        },
  { val: '0%',      label: 'Overhead'                  },
  { val: 'Live',    label: 'Treasury on XRPL'          },
  { val: '<5s',     label: 'Grant to Wallet'           },
];

/* ─────────────────────────────────────────────────────────────────────────────
   Footer link map
───────────────────────────────────────────────────────────────────────────── */
const FOOTER = [
  {
    h: 'KreditKarma',
    links: [
      { t: 'About Us',        href: '/#about'   },
      { t: 'Our Mission',     href: '/#mission' },
      { t: 'How It Works',    href: '/#how'     },
      { t: 'Admin Panel',     href: '/admin'    },
    ],
  },
  {
    h: 'Products',
    links: [
      { t: 'LedgerScore',              href: '/#score'    },
      { t: 'Micro Grants',             href: '/#grants'   },
      { t: 'Clawback Protection',      href: '/donate#services' },
      { t: 'Vault Collateral Service', href: '/donate#services' },
      { t: 'Loss Coverage Protocol',   href: '/donate#services' },
      { t: 'DeFi / AMM Package',       href: '/donate#services' },
    ],
  },
  {
    h: 'Donate',
    links: [
      { t: 'Send XRP',             href: '/donate'                                                               },
      { t: 'Send RLUSD',           href: '/donate'                                                               },
      { t: 'Treasury on XRPScan',  href: 'https://xrpscan.com/account/rs59g3amo5iT6T64Cg96XXMAWuw3WPQcLF', x: true },
      { t: 'Verify Transactions',  href: 'https://xrpscan.com/account/rs59g3amo5iT6T64Cg96XXMAWuw3WPQcLF', x: true },
    ],
  },
  {
    h: 'Help',
    links: [
      { t: 'Apply for a Grant',  href: '/#grants'   },
      { t: 'Homeless Resources', href: '/#homeless' },
      { t: 'Shelter Outreach',   href: '/#outreach' },
      { t: 'Application Status', href: '/#status'   },
      { t: 'Contact Us',         href: 'mailto:hello@kreditkarma.us' },
    ],
  },
  {
    h: 'Legal',
    links: [
      { t: 'FAQ',              href: '/#faq'     },
      { t: 'Terms of Service', href: '/#terms'   },
      { t: 'Privacy Policy',   href: '/#privacy' },
      { t: 'cards@kreditkarma.us', href: 'mailto:cards@kreditkarma.us' },
    ],
  },
  {
    h: 'Built on XRPL',
    links: [
      { t: 'XRPL Foundation',  href: 'https://xrpl.org',        x: true },
      { t: 'Xaman Wallet',     href: 'https://xaman.app',       x: true },
      { t: 'XRPScan Explorer', href: 'https://xrpscan.com',     x: true },
      { t: 'RLUSD Info',       href: 'https://ripple.com/rlusd',x: true },
    ],
  },
];

const TREASURY = 'rs59g3amo5iT6T64Cg96XXMAWuw3WPQcLF';

/* ─────────────────────────────────────────────────────────────────────────────
   External link icon (inline SVG so no import needed)
───────────────────────────────────────────────────────────────────────────── */
const ExtIcon = () => (
  <svg width="9" height="9" viewBox="0 0 10 10" fill="none" style={{ opacity: 0.4, flexShrink: 0 }}>
    <path d="M1 9L9 1M9 1H3M9 1V7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
  </svg>
);

/* ─────────────────────────────────────────────────────────────────────────────
   ROOT LAYOUT
───────────────────────────────────────────────────────────────────────────── */
export default function RootLayout({ children }: { children: React.ReactNode }) {
  // Triple the ticker items so the seamless loop never shows a gap
  const tickerItems = [...TICKER, ...TICKER, ...TICKER];

  return (
    <html lang="en">
      <body>

        {/* ── TICKER ──────────────────────────────────────────────────────── */}
        <div className="ticker-wrap" role="marquee" aria-label="Live platform statistics">
          <div className="ticker-inner">
            {tickerItems.map((item, i) => (
              <span key={i} className="ticker-item">
                <span className="dot" aria-hidden="true" />
                <span className="val">{item.val}</span>
                <span>{item.label}</span>
              </span>
            ))}
          </div>
        </div>

        {/* ── PAGE ────────────────────────────────────────────────────────── */}
        <main>{children}</main>

        {/* ── FOOTER ──────────────────────────────────────────────────────── */}
        <footer className="footer-bg">
          <div style={{
            maxWidth: 1240, margin: '0 auto',
            padding: '72px 32px 48px',
          }}>

            {/* Brand row */}
            <div style={{ marginBottom: 52 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
                <div style={{
                  width: 38, height: 38,
                  background: 'linear-gradient(135deg,#10b981,#059669)',
                  borderRadius: 10,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontWeight: 900, fontSize: 17, color: '#000', flexShrink: 0,
                }}>K</div>
                <span style={{ fontSize: 20, fontWeight: 800, letterSpacing: '-0.5px', color: '#fff' }}>
                  kreditkarma
                </span>
                <span className="service-tag" style={{ marginLeft: 6 }}>
                  <span className="live-dot" style={{ width: 5, height: 5 }} />
                  XRPL Mainnet
                </span>
              </div>

              <p style={{
                maxWidth: 400, fontSize: 13,
                color: 'rgba(255,255,255,.38)', lineHeight: 1.75,
              }}>
                Free on-chain credit scores. Real micro-grants sent directly to wallets.
                Zero overhead. No middlemen. Every dollar publicly verifiable on the XRP Ledger.
              </p>

              {/* Trust stats */}
              <div style={{ display: 'flex', gap: 12, marginTop: 20, flexWrap: 'wrap' }}>
                {[
                  { n: '0%',   d: 'Overhead'    },
                  { n: '<5s',  d: 'To Wallet'   },
                  { n: '100%', d: 'Transparent' },
                  { n: '∞',    d: 'On-Chain'    },
                ].map(({ n, d }) => (
                  <div key={d} style={{
                    background: 'rgba(16,185,129,.07)',
                    border: '1px solid rgba(16,185,129,.18)',
                    borderRadius: 10, padding: '8px 14px', textAlign: 'center',
                  }}>
                    <div style={{ fontSize: 17, fontWeight: 900, color: '#10b981', lineHeight: 1 }}>{n}</div>
                    <div style={{ fontSize: 10, color: 'rgba(255,255,255,.32)', marginTop: 3, letterSpacing: '0.07em', textTransform: 'uppercase' }}>{d}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Link columns */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
              gap: '36px 24px',
              marginBottom: 52,
            }}>
              {FOOTER.map(group => (
                <div key={group.h}>
                  <h4 style={{
                    fontSize: 10, fontWeight: 700,
                    color: 'rgba(255,255,255,.28)',
                    textTransform: 'uppercase', letterSpacing: '0.13em',
                    marginBottom: 14,
                    fontFamily: 'var(--mono)',
                  }}>
                    {group.h}
                  </h4>
                  <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 9 }}>
                    {group.links.map(link => (
                      <li key={link.t}>
                        <a
                          href={link.href}
                          target={(link as { x?: boolean }).x ? '_blank' : undefined}
                          rel={(link as { x?: boolean }).x ? 'noopener noreferrer' : undefined}
                          style={{
                            fontSize: 13, color: 'rgba(255,255,255,.42)',
                            textDecoration: 'none', transition: 'color .15s',
                            display: 'inline-flex', alignItems: 'center', gap: 5,
                          }}
                          onMouseEnter={e => ((e.currentTarget as HTMLAnchorElement).style.color = '#fff')}
                          onMouseLeave={e => ((e.currentTarget as HTMLAnchorElement).style.color = 'rgba(255,255,255,.42)')}
                        >
                          {link.t}
                          {(link as { x?: boolean }).x && <ExtIcon />}
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>

            {/* Bottom bar */}
            <div style={{
              borderTop: '1px solid rgba(255,255,255,.06)',
              paddingTop: 22,
              display: 'flex', justifyContent: 'space-between',
              alignItems: 'center', flexWrap: 'wrap', gap: 14,
            }}>
              <p style={{ fontSize: 12, color: 'rgba(255,255,255,.2)' }}>
                © {new Date().getFullYear()} KreditKarma.us · Social Impact Finance · Powered by the XRP Ledger
              </p>
              <div style={{ display: 'flex', alignItems: 'center', gap: 20, flexWrap: 'wrap' }}>
                <span style={{ fontSize: 11, color: 'rgba(255,255,255,.16)' }}>
                  Not a bank · Not a broker · Not an insurer
                </span>
                <a
                  href={`https://xrpscan.com/account/${TREASURY}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    fontSize: 11, color: '#10b981', textDecoration: 'none',
                    display: 'inline-flex', alignItems: 'center', gap: 6,
                    fontFamily: 'var(--mono)',
                  }}
                >
                  <span className="live-dot" style={{ width: 5, height: 5 }} />
                  {TREASURY.slice(0, 10)}…{TREASURY.slice(-6)} — Treasury Live
                </a>
              </div>
            </div>
          </div>
        </footer>

      </body>
    </html>
  );
}