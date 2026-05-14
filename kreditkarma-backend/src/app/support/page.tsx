export default function SupportPage() {
  return (
    <div style={{ minHeight:'100vh', background:'#030310', color:'#eeeef5', fontFamily:"'Syne',sans-serif", padding:'0 0 80px' }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800;900&family=IBM+Plex+Mono:wght@400;600&display=swap');*{box-sizing:border-box;margin:0;padding:0}::-webkit-scrollbar{width:4px}::-webkit-scrollbar-thumb{background:rgba(255,255,255,.1);border-radius:99px}a{transition:color .15s}`}</style>

      {/* Nav */}
      <nav style={{ background:'rgba(3,4,14,.9)', backdropFilter:'blur(20px)', borderBottom:'1px solid rgba(16,185,129,.18)', padding:'0 24px', height:64, display:'flex', alignItems:'center', justifyContent:'space-between', position:'sticky', top:0, zIndex:100 }}>
        <a href="/" style={{ display:'flex', alignItems:'center', gap:10, textDecoration:'none', color:'#fff' }}>
          <div style={{ width:32, height:32, background:'linear-gradient(135deg,#10b981,#059669)', borderRadius:8, display:'flex', alignItems:'center', justifyContent:'center', fontWeight:900, fontSize:15, color:'#000' }}>K</div>
          <span style={{ fontWeight:900, fontSize:17, letterSpacing:'-.5px' }}>kreditkarma</span>
        </a>
        <a href="/" style={{ fontSize:13, color:'#10b981', textDecoration:'none', fontWeight:600 }}>← Back to Home</a>
      </nav>

      <div style={{ maxWidth:820, margin:'0 auto', padding:'52px 24px 0' }}>
        <div style={{ fontSize:11, fontWeight:700, color:'#10b981', letterSpacing:'.14em', textTransform:'uppercase', marginBottom:10 }}>Help Center</div>
        <h1 style={{ fontSize:'clamp(28px,5vw,44px)', fontWeight:900, letterSpacing:'-2px', marginBottom:16 }}>Support</h1>
        <p style={{ fontSize:15, color:'rgba(255,255,255,.5)', marginBottom:52, lineHeight:1.7 }}>We're here to help. Find answers below or reach out directly.</p>

        {/* Contact cards */}
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(240px,1fr))', gap:16, marginBottom:56 }}>
          {[
            { emoji:'📧', title:'General Support', email:'support@kreditkarma.us', desc:'Questions about your account, LedgerScore, or any service.' },
            { emoji:'⚖️', title:'Legal & Compliance', email:'legal@kreditkarma.us', desc:'Terms of service, compliance inquiries, XRPL service disclosures.' },
            { emoji:'🔒', title:'Privacy & Data', email:'privacy@kreditkarma.us', desc:'Data requests, privacy questions, opt-out of bureau furnishing.' },
            { emoji:'📊', title:'Credit Bureau Disputes', email:'disputes@kreditkarma.us', desc:'Dispute inaccurate information furnished to Equifax, TransUnion, or Experian.' },
            { emoji:'🤝', title:'Institutional Partnerships', email:'partners@kreditkarma.us', desc:'Institutional access, API partnerships, grant program partnerships.' },
          ].map(c => (
            <div key={c.title} style={{ background:'rgba(16,185,129,.05)', border:'1px solid rgba(16,185,129,.18)', borderRadius:18, padding:'22px 20px' }}>
              <div style={{ fontSize:28, marginBottom:12 }}>{c.emoji}</div>
              <div style={{ fontWeight:800, fontSize:15, marginBottom:6 }}>{c.title}</div>
              <p style={{ fontSize:12, color:'rgba(255,255,255,.4)', lineHeight:1.65, marginBottom:14 }}>{c.desc}</p>
              <a href={`mailto:${c.email}`} style={{ fontSize:13, color:'#10b981', fontWeight:700, textDecoration:'none', fontFamily:"'IBM Plex Mono',monospace" }}>{c.email}</a>
            </div>
          ))}
        </div>

        {/* Response times */}
        <div style={{ background:'rgba(255,255,255,.03)', border:'1px solid rgba(255,255,255,.07)', borderRadius:16, padding:'24px 28px', marginBottom:52 }}>
          <div style={{ fontSize:11, fontWeight:700, color:'#10b981', letterSpacing:'.12em', textTransform:'uppercase', marginBottom:16 }}>Response Times</div>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(180px,1fr))', gap:12 }}>
            {[['General Support','Within 24 hours'],['Legal Inquiries','Within 3 business days'],['Privacy & Data Requests','Within 30 days (required by law)'],['Bureau Disputes','Within 30 days (FCRA required)'],['Grant Applications','AI reviews within 24 hours']].map(([t,d]) => (
              <div key={t} style={{ padding:'12px 0', borderBottom:'1px solid rgba(255,255,255,.05)' }}>
                <div style={{ fontSize:12, fontWeight:700, color:'rgba(255,255,255,.7)', marginBottom:3 }}>{t}</div>
                <div style={{ fontSize:11, color:'#10b981', fontWeight:600 }}>{d}</div>
              </div>
            ))}
          </div>
        </div>

        {/* FAQ */}
        <div style={{ fontSize:11, fontWeight:700, color:'#10b981', letterSpacing:'.14em', textTransform:'uppercase', marginBottom:24 }}>Common Questions</div>
        <div style={{ display:'flex', flexDirection:'column', gap:12, marginBottom:52 }}>
          {[
            ['How does payment work?', 'All payments are made through the Xaman wallet on the XRP Ledger. After signing in Xaman with one swipe, our AI verifies your transaction on XRPL mainnet automatically — no TX hash copying required. Service activates within seconds.'],
            ['What is LedgerScore?', 'LedgerScore is a real credit score (300–850) scanned live from your XRP Ledger wallet. It analyzes 8 signals: account age, transaction history, trust lines, DEX activity, AMM positions, escrow history, NFT holdings, and multi-signature setup. No SSN required.'],
            ['How do I connect my Xaman wallet?', 'Tap "Connect Wallet" on the homepage → scan the QR code in Xaman → approve. No transaction is sent. No funds leave your wallet. Your wallet address is stored locally in your browser only.'],
            ['My payment went through but service didn\'t activate — what do I do?', 'Email support@kreditkarma.us with your TX hash (found in Xaman transaction history). We\'ll manually verify and activate your service within 24 hours.'],
            ['How do I cancel Credit Builder?', 'Email support@kreditkarma.us with subject "Cancel Credit Builder." Your subscription will be cancelled at end of the current billing cycle. Payments already made are non-refundable due to the irrevocable nature of XRPL transactions.'],
            ['Is KreditKarma a bank?', 'No. KreditKarma.us is a financial technology platform on the XRP Ledger. We are not a bank, broker-dealer, investment advisor, insurer, or FDIC-insured institution.'],
            ['I need emergency help — how do I apply for a grant?', 'Click "Apply for Grant" on the homepage. Fill out the form with your XRPL wallet address and describe your need. AI reviews within 24 hours. Approved funds go directly to your wallet — no bank account needed.'],
          ].map(([q, a]) => (
            <div key={q} style={{ background:'rgba(255,255,255,.03)', border:'1px solid rgba(255,255,255,.07)', borderRadius:14, padding:'18px 20px' }}>
              <div style={{ fontWeight:700, fontSize:14, marginBottom:8 }}>{q}</div>
              <div style={{ fontSize:13, color:'rgba(255,255,255,.52)', lineHeight:1.75 }}>{a}</div>
            </div>
          ))}
        </div>

        {/* Need Xaman */}
        <div style={{ background:'linear-gradient(135deg,rgba(16,185,129,.1),rgba(6,6,22,.8))', border:'1px solid rgba(16,185,129,.25)', borderRadius:18, padding:'28px 24px', marginBottom:40, textAlign:'center' as const }}>
          <div style={{ fontSize:32, marginBottom:12 }}>📲</div>
          <h3 style={{ fontSize:20, fontWeight:900, marginBottom:8 }}>Need the Xaman Wallet?</h3>
          <p style={{ fontSize:13, color:'rgba(255,255,255,.5)', marginBottom:18, lineHeight:1.65 }}>All KreditKarma services require the Xaman wallet. It's free on iOS and Android.</p>
          <a href="https://xaman.app/" target="_blank" rel="noopener noreferrer" style={{ display:'inline-flex', alignItems:'center', gap:8, background:'#10b981', color:'#000', fontWeight:800, fontSize:14, padding:'12px 28px', borderRadius:99, textDecoration:'none' }}>Download Xaman — Free →</a>
        </div>

        <div style={{ paddingTop:24, borderTop:'1px solid rgba(255,255,255,.07)', display:'flex', gap:16, flexWrap:'wrap' }}>
          <a href="/terms" style={{ fontSize:13, color:'rgba(255,255,255,.4)', textDecoration:'none' }}>Terms of Service</a>
          <a href="/privacy" style={{ fontSize:13, color:'rgba(255,255,255,.4)', textDecoration:'none' }}>Privacy Policy</a>
          <a href="/" style={{ fontSize:13, color:'#10b981', textDecoration:'none', fontWeight:600 }}>← Back to Home</a>
        </div>
      </div>
    </div>
  );
}
