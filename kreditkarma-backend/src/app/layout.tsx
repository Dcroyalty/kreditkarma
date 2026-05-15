import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'KreditKarma — XRPL Credit & Financial Freedom',
  description: 'On-chain LedgerScore • XRPL Amendment Services • Community Grants',
  icons: { icon: '/favicon.ico' },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        {children}
      </body>
    </html>
  );
}
