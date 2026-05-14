export default function TermsPage() {
  const H = { color:'#10b981', fontWeight:800 as const, fontSize:13, textTransform:'uppercase' as const, letterSpacing:'.04em', marginTop:28, marginBottom:8, display:'block' as const };
  const P = { fontSize:14, color:'rgba(255,255,255,.62)', lineHeight:1.85 as const, marginBottom:10 };
  return (
    <div style={{ minHeight:'100vh', background:'#030310', color:'#eeeef5', fontFamily:"'Syne',sans-serif", padding:'0 0 80px' }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800;900&display=swap');*{box-sizing:border-box;margin:0;padding:0}::-webkit-scrollbar{width:4px}::-webkit-scrollbar-thumb{background:rgba(255,255,255,.1);border-radius:99px}`}</style>

      {/* Nav */}
      <nav style={{ background:'rgba(3,4,14,.9)', backdropFilter:'blur(20px)', borderBottom:'1px solid rgba(16,185,129,.18)', padding:'0 24px', height:64, display:'flex', alignItems:'center', justifyContent:'space-between', position:'sticky', top:0, zIndex:100 }}>
        <a href="/" style={{ display:'flex', alignItems:'center', gap:10, textDecoration:'none', color:'#fff' }}>
          <div style={{ width:32, height:32, background:'linear-gradient(135deg,#10b981,#059669)', borderRadius:8, display:'flex', alignItems:'center', justifyContent:'center', fontWeight:900, fontSize:15, color:'#000' }}>K</div>
          <span style={{ fontWeight:900, fontSize:17, letterSpacing:'-.5px' }}>kreditkarma</span>
        </a>
        <a href="/" style={{ fontSize:13, color:'#10b981', textDecoration:'none', fontWeight:600 }}>← Back to Home</a>
      </nav>

      <div style={{ maxWidth:780, margin:'0 auto', padding:'52px 24px 0' }}>
        <div style={{ fontSize:11, fontWeight:700, color:'#10b981', letterSpacing:'.14em', textTransform:'uppercase', marginBottom:10 }}>Legal</div>
        <h1 style={{ fontSize:'clamp(28px,5vw,44px)', fontWeight:900, letterSpacing:'-2px', marginBottom:8 }}>Terms of Service</h1>
        <p style={{ fontSize:12, color:'rgba(255,255,255,.28)', marginBottom:40, fontFamily:"'IBM Plex Mono',monospace" }}>
          KreditKarma.us · Effective January 1, 2025 · Last updated {new Date().toLocaleDateString('en-US',{month:'long',day:'numeric',year:'numeric'})}
        </p>

        <div style={{ background:'rgba(16,185,129,.06)', border:'1px solid rgba(16,185,129,.18)', borderRadius:16, padding:'20px 24px', marginBottom:36 }}>
          <p style={{ fontSize:13, color:'rgba(255,255,255,.55)', lineHeight:1.8 }}>By accessing or using KreditKarma.us, you agree to be bound by these Terms of Service in full. If you do not agree, do not use the platform.</p>
        </div>

        <span style={H}>1. Who We Are</span>
        <p style={P}>KreditKarma.us is a financial technology platform built on the XRP Ledger. We provide LedgerScore™, XRPL Amendment Services, Credit Builder, and a community grant system. We are not a bank, broker-dealer, investment advisor, mortgage lender, insurer, or FDIC-insured institution. Nothing on this platform constitutes financial, legal, or investment advice.</p>

        <span style={H}>2. Eligibility</span>
        <p style={P}>You must be at least 18 years old and legally capable of entering binding contracts in your jurisdiction. Our services are not available in OFAC-sanctioned regions or where prohibited by applicable law. By using KreditKarma.us, you represent that you meet these requirements.</p>

        <span style={H}>3. XRPL Services & AI Payment Verification</span>
        <p style={P}>Our services are on-chain operational tools delivered via the XRP Ledger. Payments are made through the Xaman wallet. Our AI verifies transactions on XRPL mainnet automatically after signing. All XRPL transactions are final and irrevocable by the nature of the protocol. Services are not insurance contracts, securities, derivatives, or financial instruments of any kind.</p>

        <span style={H}>4. LedgerScore™</span>
        <p style={P}>LedgerScore™ is a proprietary on-chain credit assessment derived from public XRP Ledger wallet data. It is not a FICO score, consumer credit report, or any rating issued by a Nationally Recognized Statistical Rating Organization (NRSRO). We make no warranty that LedgerScore reflects creditworthiness as defined by any lender, institution, or credit bureau.</p>

        <span style={H}>5. Credit Builder</span>
        <p style={P}>Credit Builder is a monthly subscription service that records on-chain payments and provides optional credit bureau reporting. Bureau furnishing requires your explicit written FCRA consent. Hard bureau reporting may affect your traditional FICO score positively or negatively. Subscriptions renew monthly and cancel at end of the current billing cycle. All payments are made on-chain and are non-refundable due to the irrevocable nature of XRPL transactions.</p>

        <span style={H}>6. Community Grant Program</span>
        <p style={P}>Donations to the KreditKarma treasury are voluntary and irrevocable. Grant applications are subject to discretionary AI review and approval. Submission of an application does not guarantee disbursement. Grants range from $25 to $100 subject to treasury availability. KreditKarma reserves the right to deny any application for any reason, including suspected fraud.</p>

        <span style={H}>7. Your Wallet — Your Responsibility</span>
        <p style={P}>You are solely responsible for your XRPL wallet, private keys, and seed phrases. KreditKarma never has access to your private keys. Lost private keys result in permanent, unrecoverable loss of funds. We will never ask for your seed phrase or private key. Any communication requesting your seed phrase is fraudulent.</p>

        <span style={H}>8. Prohibited Uses</span>
        <p style={P}>You may not use KreditKarma.us for: money laundering, fraud, terrorist financing, sanctions evasion, submission of false grant applications, artificial manipulation of LedgerScore data, reverse engineering of our systems, unauthorized automated scraping, or any use that violates applicable law.</p>

        <span style={H}>9. Disclaimers & Limitation of Liability</span>
        <p style={P}>THE PLATFORM IS PROVIDED "AS IS" WITHOUT WARRANTIES OF ANY KIND. TO THE MAXIMUM EXTENT PERMITTED BY LAW, KREDITKARMA&apos;S LIABILITY IS CAPPED AT THE GREATER OF $100 OR THE TOTAL FEES YOU PAID IN THE PRIOR 12 MONTHS. WE ARE NOT LIABLE FOR INDIRECT, CONSEQUENTIAL, PUNITIVE, OR INCIDENTAL DAMAGES OF ANY KIND.</p>

        <span style={H}>10. Governing Law & Disputes</span>
        <p style={P}>These Terms are governed by the laws of the State of Delaware. All disputes shall be resolved through binding AAA Consumer Arbitration on an individual basis. Class action and jury trial rights are waived. Small claims court actions under applicable thresholds are exempt.</p>

        <span style={H}>11. Changes to Terms</span>
        <p style={P}>We may update these Terms at any time. Continued use of the platform after changes constitutes acceptance. Material changes will be communicated via email to registered users.</p>

        <span style={H}>12. Contact</span>
        <p style={P}>Legal inquiries: <a href="mailto:legal@kreditkarma.us" style={{ color:'#10b981' }}>legal@kreditkarma.us</a><br />General support: <a href="mailto:support@kreditkarma.us" style={{ color:'#10b981' }}>support@kreditkarma.us</a></p>

        <div style={{ marginTop:48, paddingTop:24, borderTop:'1px solid rgba(255,255,255,.07)', display:'flex', gap:16, flexWrap:'wrap' }}>
          <a href="/privacy" style={{ fontSize:13, color:'#10b981', textDecoration:'none', fontWeight:600 }}>Privacy Policy →</a>
          <a href="/support" style={{ fontSize:13, color:'rgba(255,255,255,.4)', textDecoration:'none' }}>Support →</a>
          <a href="/" style={{ fontSize:13, color:'rgba(255,255,255,.4)', textDecoration:'none' }}>← Home</a>
        </div>
      </div>
    </div>
  );
}
