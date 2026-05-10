import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'KreditKarma — XRPL Credit & Financial Freedom',
  description: 'On-chain LedgerScore • XRPL Amendment Services • Community Grants',
  icons: { icon: '/favicon.ico' },
};

const TREASURY = "rs59g3amo5iT6T64Cg96XXMAWuw3WPQcLF";

const TICKER = [
  { val: "42,891", label: "LedgerScores Generated" },
  { val: "$1.2M", label: "Grants Funded" },
  { val: "8,742", label: "Wallets Helped" },
  { val: "100%", label: "On-Chain Transparent" },
];

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        {children}

        {/* Live Ticker */}
        <div className="ticker-wrap py-3">
          <div className="ticker text-sm font-mono flex items-center gap-12">
            {[...TICKER, ...TICKER].map((item, i) => (
              <div key={i} className="flex items-center gap-2">
                <span className="text-green-400 font-bold">{item.val}</span>
                <span className="text-white/60">{item.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <footer className="bg-black/80 border-t border-white/10 py-12 text-sm">
          <div className="max-w-6xl mx-auto px-6 text-center">
            <p>© 2026 KreditKarma.us • Social Impact Finance on the XRP Ledger</p>
            <p className="text-white/40 mt-2">Not a bank • Not an insurer • 100% on-chain</p>
            <a href={`https://xrpscan.com/account/${TREASURY}`} target="_blank" className="text-green-400 hover:underline mt-4 inline-block">
              Treasury: {TREASURY.slice(0,8)}...{TREASURY.slice(-6)}
            </a>
          </div>
        </footer>
      </body>
    </html>
  );
}