#!/usr/bin/env node
// scripts/test-ledgerscore.js
// Run: node scripts/test-ledgerscore.js [optional-address]
// Tests the LedgerScore calculation against a real XRPL address

require("dotenv").config();

// We need ts-node or compiled JS — use the compiled version
// For quick testing, we inline the logic here

const { Client } = require("xrpl");

const TEST_ADDRESSES = [
  "rHb9CJAWyB4rj91VRWn96DkukG4bwdtyTh", // Genesis account (very high score)
  process.argv[2], // optional CLI argument
].filter(Boolean);

async function quickScore(client, address) {
  console.log(`\n${"─".repeat(60)}`);
  console.log(`  Scoring: ${address}`);
  console.log("─".repeat(60));

  // Get account info
  let accountData;
  try {
    const res = await client.request({
      command: "account_info",
      account: address,
      ledger_index: "validated",
    });
    accountData = res.result.account_data;
  } catch (e) {
    console.log("  ❌ Account not found on ledger");
    return;
  }

  const balanceXRP = Number(accountData.Balance) / 1_000_000;
  console.log(`  Balance    : ${balanceXRP.toFixed(4)} XRP`);
  console.log(`  Sequence   : ${accountData.Sequence}`);
  console.log(`  OwnerCount : ${accountData.OwnerCount}`);

  // Get TX count (limited to 50 for speed)
  const txRes = await client.request({
    command: "account_tx",
    account: address,
    limit: 50,
    ledger_index_min: -1,
    ledger_index_max: -1,
  });
  const txCount = txRes.result.transactions.length;
  console.log(`  TX History : ${txCount}+ transactions`);

  // Trust lines
  const tlRes = await client.request({
    command: "account_lines",
    account: address,
    ledger_index: "validated",
  });
  console.log(`  TrustLines : ${tlRes.result.lines.length}`);

  // Quick deterministic score (simplified for script)
  let score = 300;

  // Balance (up to 130 pts)
  score += Math.min(130, (balanceXRP / 1000) * 130);

  // TX count (up to 100 pts)
  score += Math.min(100, (txCount / 500) * 100);

  // Trust lines (up to 80 pts)
  score += Math.min(80, tlRes.result.lines.length * 15);

  // Sequence (up to 80 pts)
  score += Math.min(80, (accountData.Sequence / 2000) * 80);

  // Owner count health
  if (accountData.OwnerCount <= 5) score += 60;
  else if (accountData.OwnerCount <= 20) score += 30;

  score = Math.min(850, Math.round(score));

  let tier;
  if (score < 580) tier = "POOR";
  else if (score < 670) tier = "FAIR";
  else if (score < 740) tier = "GOOD";
  else if (score < 800) tier = "VERY_GOOD";
  else tier = "EXCELLENT";

  console.log(`\n  ╔════════════════════════╗`);
  console.log(`  ║  LedgerScore: ${score}/850   ║`);
  console.log(`  ║  Tier: ${tier.padEnd(16)}║`);
  console.log(`  ╚════════════════════════╝`);
}

async function main() {
  const nodeUrl = process.env.XRPL_NODE_URL ?? "wss://s.altnet.rippletest.net:51233";
  console.log(`\n[LedgerScore Test] Connecting to ${nodeUrl}...`);

  const client = new Client(nodeUrl);
  await client.connect();
  console.log("[LedgerScore Test] Connected!\n");

  for (const addr of TEST_ADDRESSES) {
    await quickScore(client, addr);
  }

  await client.disconnect();
  console.log("\n[LedgerScore Test] Done.\n");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
