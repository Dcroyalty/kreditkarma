// scripts/setup-trustlines.js
const xrpl = require('xrpl');
require('dotenv').config();

async function setupTrustlines() {
  console.log("🔧 Setting up RLUSD Trust Line for Treasury...");

  const client = new xrpl.Client(process.env.XRPL_NODE_URL);
  await client.connect();

  const wallet = xrpl.Wallet.fromSeed(process.env.TREASURY_SIGNER_1_SEED);

  const trustSetTx = {
    TransactionType: "TrustSet",
    Account: wallet.address,
    LimitAmount: {
      currency: process.env.RLUSD_CURRENCY,
      issuer: process.env.RLUSD_ISSUER,
      value: "1000000"  // large limit
    }
  };

  const prepared = await client.autofill(trustSetTx);
  const signed = wallet.sign(prepared);
  const result = await client.submitAndWait(signed.tx_blob);

  console.log("✅ Trust Line Setup Result:", result.result.meta.TransactionResult);
  console.log("Treasury can now receive RLUSD!");

  await client.disconnect();
}

setupTrustlines().catch(console.error);