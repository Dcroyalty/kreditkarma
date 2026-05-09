# KreditKarma.us — Backend

> Real XRPL credit scoring + non-profit micro-grants on-chain

---

## Architecture Overview

```
kreditkarma-backend/
├── src/
│   ├── lib/
│   │   ├── xrpl-client.ts      ← XRPL connection + account snapshot builder
│   │   ├── ledger-score.ts     ← Deterministic LedgerScore formula (300–850)
│   │   ├── ai-underwriting.ts  ← Claude AI grant evaluation engine
│   │   ├── treasury.ts         ← Multi-sig treasury, XRP + RLUSD payments
│   │   ├── db.ts               ← Prisma client singleton
│   │   └── api-client.ts       ← Frontend integration (copy to frontend)
│   └── app/api/
│       ├── score/[address]/    ← GET LedgerScore for any XRPL address
│       ├── account/[address]/  ← GET account balance + trust lines
│       ├── grants/
│       │   ├── submit/         ← POST grant application → AI eval → payout
│       │   └── [id]/           ← GET grant status
│       ├── donate/             ← GET treasury address, POST record donation
│       ├── treasury/stats/     ← GET public stats (homepage counters)
│       └── admin/              ← GET/POST admin dashboard (secret protected)
├── prisma/
│   └── schema.prisma           ← SQLite DB: grants, scores, donations
└── scripts/
    ├── generate-treasury.js    ← Generate multi-sig wallets
    ├── setup-multisig.js       ← Configure multi-sig on treasury
    └── test-ledgerscore.js     ← Test scoring against real XRPL addresses
```

---

## Quick Start

### 1. Install dependencies

```bash
cd kreditkarma-backend
npm install
```

### 2. Generate treasury wallets

```bash
node scripts/generate-treasury.js
```

Copy the output into `.env` (use `.env.example` as template).

### 3. Configure environment

```bash
cp .env.example .env
# Edit .env with your values
```

### 4. Initialize database

```bash
npm run db:generate
npm run db:migrate
```

### 5. Fund treasury on testnet

Visit: https://faucet.altnet.rippletest.net/accounts  
Paste your `TREASURY_ADDRESS` to receive 1000 testnet XRP.

### 6. Set up multi-sig + RLUSD trust line

```bash
node scripts/setup-multisig.js
```

### 7. Start the backend

```bash
npm run dev
# Runs on http://localhost:3001
```

### 8. Test LedgerScore

```bash
node scripts/test-ledgerscore.js rHb9CJAWyB4rj91VRWn96DkukG4bwdtyTh
# Or test your own testnet address:
node scripts/test-ledgerscore.js YOUR_TESTNET_ADDRESS
```

---

## API Reference

### GET `/api/score/:address`

Returns LedgerScore (300–850) with full breakdown.

```bash
curl http://localhost:3001/api/score/rHb9CJAWyB4rj91VRWn96DkukG4bwdtyTh
```

**Response:**
```json
{
  "score": 742,
  "tier": "VERY_GOOD",
  "breakdown": {
    "accountAge": { "raw": 95, "weighted": 23.75, "label": "Account Age & History" },
    "txVolumeVariety": { "raw": 80, "weighted": 20, "label": "Transaction Volume & Variety" },
    ...
  },
  "positives": ["Strong transaction history", "AMM LP participant"],
  "tips": ["Set up RLUSD trust line for +70 points"]
}
```

---

### POST `/api/grants/submit`

Submit micro grant application. AI evaluates in ~5 seconds. If approved, payout is automatic.

```bash
curl -X POST http://localhost:3001/api/grants/submit \
  -H "Content-Type: application/json" \
  -d '{
    "walletAddress": "rYOUR_ADDRESS",
    "category": "UTILITIES",
    "amountRequested": 25,
    "currency": "RLUSD",
    "description": "My electricity bill is overdue by 3 days, I have two kids and need help keeping the lights on. The bill is $67 but I only need $25 to avoid shutoff.",
    "urgency": "HIGH"
  }'
```

**Response (approved):**
```json
{
  "grantId": "clx...",
  "status": "PAID",
  "message": "🎉 Approved! 25 RLUSD sent to your wallet.",
  "approvedAmount": 25,
  "txHash": "A1B2C3D4...",
  "aiScore": 87,
  "processingTimeMs": 4231
}
```

---

### GET `/api/treasury/stats`

Public stats for the homepage counters.

```bash
curl http://localhost:3001/api/treasury/stats
```

---

### GET `/api/admin` (protected)

```bash
curl http://localhost:3001/api/admin \
  -H "x-admin-secret: your-admin-secret"
```

### POST `/api/admin` — Manual approve & pay

```bash
curl -X POST http://localhost:3001/api/admin \
  -H "Content-Type: application/json" \
  -H "x-admin-secret: your-admin-secret" \
  -d '{ "action": "approve_and_pay", "grantId": "clx..." }'
```

---

## Connecting to the Existing Frontend

1. Copy `src/lib/api-client.ts` to your frontend's `lib/` directory.

2. Add to your frontend `.env`:
   ```
   NEXT_PUBLIC_API_URL=http://localhost:3001
   ```

3. Replace frontend mock calls with the real API client:

```typescript
// Before (mock):
const score = Math.floor(Math.random() * 550) + 300;

// After (real):
import { getLedgerScore } from "@/lib/api-client";
const scoreData = await getLedgerScore(walletAddress);
const score = scoreData.score;
```

4. Wire up the grant form:
```typescript
import { submitGrant } from "@/lib/api-client";

const result = await submitGrant({
  walletAddress: connectedWallet,
  category: formData.category,
  amountRequested: formData.amount,
  currency: "RLUSD",
  description: formData.description,
  urgency: formData.urgency,
});
```

---

## LedgerScore Formula

| Component | Weight | Max Contribution | Key Signals |
|-----------|--------|-----------------|-------------|
| Account Age & History | 25% | 212 pts | Account age, lifetime tx count |
| Transaction Volume & Variety | 25% | 212 pts | 30d volume, unique counterparties |
| AMM / DeFi Participation | 20% | 170 pts | LP positions, AMM activity |
| Trust Lines & RLUSD | 15% | 127 pts | RLUSD balance, active trust lines |
| Account Health & Security | 15% | 127 pts | XRP balance, multi-sig, owner count |

Score range: **300 (floor) → 850 (ceiling)**  
Recalculated fresh from chain every 10 minutes, cached in SQLite.

---

## Treasury Multi-Sig

Uses XRPL native `SignerListSet` for 2-of-3 multisig.  
All payouts are signed by 2 independent keys before broadcasting.

```
Treasury Account (holds funds)
    ↓ (controlled by)
SignerList: [Signer1, Signer2, Signer3]
Quorum: 2  ← any 2 must sign to execute payment
```

Keys are never combined server-side — Signer 3 can be held offline as backup.

---

## Production Checklist

- [ ] Switch `XRPL_NODE_URL` to mainnet: `wss://xrplcluster.com`
- [ ] Use real RLUSD issuer address from Ripple
- [ ] Store seeds in AWS Secrets Manager / Vault (never in .env in prod)
- [ ] Replace SQLite with Postgres: `DATABASE_URL=postgresql://...`
- [ ] Add Redis for rate limiting (replace in-memory Map)
- [ ] Set up treasury monitoring + alerting (low balance notifications)
- [ ] Enable 2FA on all admin access
- [ ] Run multi-sig setup ceremony with 3 independent key holders
- [ ] Add Sentry for error monitoring
- [ ] Deploy behind Cloudflare with DDoS protection
