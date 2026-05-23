import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'XRPLHub — XRPL Services, Community Grants & XRPLScore',
  description: 'AI-powered XRPL amendment services · Community grants wallet-to-wallet · XRPLScore on-chain scoring. Powered by Xaman.',
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
