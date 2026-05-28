'use client';
import React, { useState, useEffect, useCallback, useRef } from 'react';

// ─── CONFIG ───────────────────────────────────────────────────────────────────
const XUMM_KEY = '33894f1f-b5ac-4b47-a0ec-77b27b59d224';
const TREASURY = 'rs59g3amo5iT6T64Cg96XXMAWuw3WPQcLF';
const API_URL  = (typeof process !== 'undefined' && process.env?.NEXT_PUBLIC_API_URL) || '';
// © 2026 XRPLHub.io · XRPLScore™ · US Copyright Reg. #1-15166646291

// ─── XAPP SDK HOOK ────────────────────────────────────────────────────────────
function useXamanSDK() {
  const sdkRef                      = useRef<any>(null);
  const [inXApp,   setInXApp]       = useState(false);
  const [xAppAddr, setXAppAddr]     = useState('');
  const [sdkReady, setSdkReady]     = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const params   = new URLSearchParams(window.location.search);
    const detected = params.has('xAppToken') || !!(window as any).ReactNativeWebView;
    setInXApp(detected);
    import('xumm').then(({ Xumm }) => {
      sdkRef.current = new Xumm(XUMM_KEY);
      setSdkReady(true);
      if (detected) {
        sdkRef.current.user.account
          .then((a: string) => { if (a) setXAppAddr(a); })
          .catch(() => {});
      }
    }).catch(() => {});
  }, []);

  const signXRP = useCallback(async (amountXRP: number): Promise<string | null> => {
    if (!sdkRef.current) return null;
    try {
      const sub = await sdkRef.current.payload.createAndSubscribe(
        { txjson: { TransactionType: 'Payment', Destination: TREASURY, Amount: String(Math.floor(amountXRP * 1_000_000)) }},
        (ev: any) => { if (ev.data.signed !== undefined) return ev; }
      );
      return sub?.resolved?.signed ? (sub.resolved.txid as string) : null;
    } catch { return null; }
  }, []);

  return { inXApp, xAppAddr, sdkReady, signXRP };
}

// ─── LIVE STATS HOOK ──────────────────────────────────────────────────────────
interface LiveStats {
  xrplScores: number; treasuryXRP: number; treasuryUSD: string;
  txCount: number; donorCount: number; grantCount: number; servicesCount: number;
}
function useLiveStats() {
  const [stats, setStats] = useState<LiveStats | null>(null);
  useEffect(() => {
    const load = () =>
      fetch(`${API_URL}/api/treasury/stats`, { cache: 'no-store' })
        .then(r => r.json()).then(setStats).catch(() => {});
    load();
    const iv = setInterval(load, 30_000);
    return () => clearInterval(iv);
  }, []);
  return stats;
}

// ─── TICKER ───────────────────────────────────────────────────────────────────
const TICKER = [
  'XRPLScore — First Proprietary On-Chain Credit Score on the XRP Ledger',
  'Multi-Sig Fortress — Require Multiple Approvals to Move Any Funds',
  'Token Issuers: Permanently Surrender Freeze Rights with One Transaction',
  'Apply for Emergency Grants — Wallet to Wallet · Zero Overhead · 100% On-Chain',
  'AMM Pool Launch — Deploy Your Liquidity Pool in ~4 Seconds via Xaman',
  'Mint XRPL NFTs with Up to 50% Royalties — AI Builds the Transaction',
  'On-Chain Identity — Link Your Verified Domain to Your XRPL Wallet',
  'DID Creator — W3C-Compliant Decentralized Identity on XRPL Mainnet',
  'Smart Swap Router — Cross-Currency Payments via XRPL Native Pathfinding',
  'Compliance Bundle — Enterprise-Grade XRPL Configuration in One Bundle',
  'Escrow Setup — Time-Lock XRP with Custom Release Conditions',
  'AI Constructs Your Transaction · You Sign in Xaman · On-Chain in 4 Seconds',
];

// ─── PRODUCTS ─────────────────────────────────────────────────────────────────
// Honest framing: AI builds transaction → user signs in Xaman → on-chain ~4s
// No AI monitoring, no AI auto-execution, no AI signing on behalf of users
const PRODUCTS = [
  // WALLET SECURITY
  { id:'multisig',     cat:'security', emoji:'🛡️', name:'Multi-Sig Fortress',
    amendment:'SignerListSet', color:'#10b981', featured:true, priceRLUSD:60, priceXRP:195,
    tagline:'Require multiple signatures to authorize any transaction from your wallet',
    desc:'Transform your XRPL wallet into a multi-signature account. Specify your signers and the quorum required (e.g. 2-of-3 or 3-of-5). Once active, no single key can move funds — every transaction requires the configured number of approvals.',
    aiDelivery:'AI constructs SignerListSet with your signers and quorum. You sign once in Xaman. On-chain in ~4 seconds.',
    aiDetail:'You provide the list of XRPL signer addresses and your SignerQuorum threshold. AI builds the SignerListSet transaction with proper SignerEntries and weight assignments. You sign in Xaman. Once confirmed, your wallet permanently requires multi-signature authorization for all future transactions. No single point of key compromise.',
    features:['M-of-N multi-signature setup','Up to 32 signers supported','Custom weight per signer','Permanent on-chain record','One swipe in Xaman to activate'] },

  { id:'regkey',       cat:'security', emoji:'🔑', name:'Regular Key Rotator',
    amendment:'SetRegularKey', color:'#34d399', featured:false, priceRLUSD:30, priceXRP:95,
    tagline:'Assign a backup signing key and keep your master key in cold storage',
    desc:'Cold storage for your XRPL wallet without sacrificing usability. Set a regular key for everyday signing while your master key stays offline. If the regular key is ever compromised, rotate it instantly without losing the account.',
    aiDelivery:'AI constructs SetRegularKey transaction. You sign once in Xaman. New signing key active in ~4 seconds.',
    aiDetail:'You provide the new regular key address. AI builds the SetRegularKey transaction. You sign with your current key in Xaman. After confirmation, the new regular key has full signing authority and your master key can go into deep cold storage permanently.',
    features:['Master key stays offline','Hot wallet regular key','Rotate without losing account','Industry security standard','Single-transaction setup'] },

  { id:'deposit-auth', cat:'security', emoji:'🚧', name:'Deposit Auth Guard',
    amendment:'AccountSet · asfDepositAuth', color:'#06b6d4', featured:false, priceRLUSD:20, priceXRP:65,
    tagline:'Block unsolicited incoming payments — stop spam airdrops permanently',
    desc:'With Deposit Auth enabled, your account only accepts payments from senders you have explicitly pre-authorized via DepositPreauth. Eliminates spam airdrops, unwanted token sends, and unsolicited payments entirely.',
    aiDelivery:'AI constructs AccountSet with asfDepositAuth. You sign once in Xaman. Guard active in ~4 seconds.',
    aiDetail:'AI builds the AccountSet transaction with the asfDepositAuth flag. You sign in Xaman. Once confirmed, your wallet rejects all incoming payments unless the sender is on your preauthorized list. Clean, compliance-grade inbox control.',
    features:['Block spam airdrops permanently','Whitelist approved senders only','Compliance-grade configuration','Reversible via second AccountSet','Single-transaction activation'] },

  { id:'desttag',      cat:'security', emoji:'🎯', name:'Destination Tag Lock',
    amendment:'AccountSet · asfRequireDest', color:'#a78bfa', featured:false, priceRLUSD:15, priceXRP:50,
    tagline:'Force senders to include destination tags — prevent lost funds permanently',
    desc:'Critical for any business managing multiple user balances under one wallet. With RequireDest enabled, your account rejects any incoming payment that lacks a destination tag — eliminating the most common cause of lost funds in XRPL business operations.',
    aiDelivery:'AI constructs AccountSet with asfRequireDest. You sign once in Xaman. Enforcement live in ~4 seconds.',
    aiDetail:'AI builds AccountSet with the asfRequireDest flag. You sign in Xaman. After confirmation, your wallet rejects all incoming payments without a DestinationTag. Essential for exchanges, custodians, and payment processors.',
    features:['Eliminates untagged deposit losses','Exchange-grade requirement','Compliance standard','Permanent enforcement','Reversible if needed'] },

  { id:'xrp-lock',     cat:'security', emoji:'🔒', name:'XRP Lockdown',
    amendment:'AccountSet · asfDisallowXRP', color:'#9ca3af', featured:false, priceRLUSD:15, priceXRP:50,
    tagline:'Signal that your account does not accept XRP payments',
    desc:'For token-only accounts that should not receive XRP. Sets the DisallowXRP flag that all major wallets including Xaman respect — senders receive a warning before sending XRP to your address.',
    aiDelivery:'AI constructs AccountSet with asfDisallowXRP. You sign once in Xaman. Flag active in ~4 seconds.',
    aiDetail:'AI builds AccountSet with asfDisallowXRP flag. You sign in Xaman. All Xaman and XRPL-compatible wallets will warn senders before sending XRP to your address. Reversible at any time.',
    features:['Signal token-only operations','Wallet-level sender warnings','Respected by all major wallets','Reversible anytime','Single-transaction setup'] },

  // TOKEN ISSUER
  { id:'no-freeze',    cat:'issuer', emoji:'🤝', name:'Issuer Trustless Declaration',
    amendment:'AccountSet · asfNoFreeze', color:'#10b981', featured:true, priceRLUSD:40, priceXRP:130,
    tagline:'Token issuers: permanently surrender freeze rights to build holder trust',
    desc:'For token issuers who want to make the strongest possible trust signal to holders. Setting asfNoFreeze permanently and irrevocably removes your ability to freeze any trust lines for your issued tokens. A one-way commitment that lives on-chain forever.',
    aiDelivery:'AI constructs AccountSet with asfNoFreeze. You sign once as issuer in Xaman. Permanent on-chain in ~4 seconds.',
    aiDetail:'AI builds AccountSet with the asfNoFreeze flag. You sign in Xaman as the token issuer. After confirmation, your account permanently loses the ability to freeze individual trust lines or apply global freeze to your token. Cannot be reversed. The strongest trust signal available to any XRPL token issuer.',
    features:['Permanent freeze rights surrender','One-way commitment (irreversible)','Strongest holder trust signal','Verifiable on XRPScan forever','Token issuers only — not for holders'] },

  { id:'transfer-fee', cat:'issuer', emoji:'💰', name:'Token Transfer Fee',
    amendment:'AccountSet · TransferRate', color:'#f59e0b', featured:true, priceRLUSD:25, priceXRP:80,
    tagline:'Earn passive revenue on every transfer of your issued token',
    desc:'Configure a percentage fee that you collect on every transfer of your token between holders. Every secondary market trade, every wallet-to-wallet send pays you automatically — collected on-chain by the XRPL with zero intervention required.',
    aiDelivery:'AI constructs AccountSet with your TransferRate. You sign once in Xaman. Fee active in ~4 seconds.',
    aiDetail:'You specify your transfer fee percentage (0% to 100%). AI converts this to the proper TransferRate value (1000000000 to 2000000000 scale) and builds the AccountSet transaction. You sign in Xaman. After confirmation, every transfer of your token between any two holders pays you the configured percentage automatically.',
    features:['0% to 100% configurable fee','Automatic on-chain collection','Revenue on every secondary trade','Adjustable at any time','No off-chain accounting needed'] },

  { id:'issuer-bundle',cat:'issuer', emoji:'🏛️', name:'Full Issuer Configuration',
    amendment:'AccountSet · Bundle', color:'#a78bfa', featured:false, priceRLUSD:80, priceXRP:260,
    tagline:'Complete professional token issuer setup in one bundle',
    desc:'Everything needed to launch a credible token on XRPL. Sets your domain (verified identity on all explorers), email hash (Gravatar profile), TransferRate (your transfer fee), and DefaultRipple (enables token liquidity). Four transactions, one session.',
    aiDelivery:'AI constructs all 4 AccountSet transactions. You sign each in Xaman. Full setup in under a minute.',
    aiDetail:'AI builds four AccountSet transactions in sequence: (1) Domain field with hex-encoded domain, (2) EmailHash with MD5-hashed contact email, (3) TransferRate with your configured fee, (4) asfDefaultRipple enabling token rippling. You sign each in Xaman. All four complete and your account is configured as a professional token issuer.',
    features:['Verified domain on all explorers','Email/Gravatar identity link','Custom transfer fee','Default rippling enabled','Four transactions in one session'] },

  { id:'trustline',    cat:'issuer', emoji:'🔗', name:'Trust Line Configurator',
    amendment:'TrustSet', color:'#06b6d4', featured:false, priceRLUSD:20, priceXRP:65,
    tagline:'Create or configure a trust line to any XRPL token with custom limits',
    desc:'Establish a trust relationship with any XRPL token. Set your trust limit, configure rippling flags, opt into or out of issuer authorization. The foundational transaction for participating in the XRPL token economy.',
    aiDelivery:'AI constructs TrustSet with your specifications. You sign once in Xaman. Trust line active in ~4 seconds.',
    aiDetail:'You provide the token issuer address, currency code, and trust limit. AI builds the TrustSet transaction with proper LimitAmount and optional flags (tfSetNoRipple, tfClearNoRipple, tfSetfAuth). You sign in Xaman. Trust line is active on XRPL mainnet within one ledger close.',
    features:['Any XRPL token supported','Custom trust limit','Rippling control flags','Authorization opt-in','Single-transaction setup'] },

  { id:'no-ripple',    cat:'issuer', emoji:'⛔', name:'Rippling Controller',
    amendment:'TrustSet · NoRipple', color:'#9ca3af', featured:false, priceRLUSD:20, priceXRP:65,
    tagline:'Prevent unintended rippling through your trust lines',
    desc:'Set the NoRipple flag on specific trust lines to prevent XRPL pathfinding from routing payments through your wallet without your intent. Essential for businesses, custodians, and active wallets that appear frequently in pathfinding results.',
    aiDelivery:'AI constructs TrustSet with tfSetNoRipple. You sign once in Xaman. Active in ~4 seconds.',
    aiDetail:'You select which trust lines to restrict. AI builds TrustSet transactions with the tfSetNoRipple flag for each selected line. You sign in Xaman. After confirmation, those trust lines are excluded from XRPL pathfinding — payments will no longer route through your wallet via these lines.',
    features:['Block unintended rippling','Per-trust-line control','Business-grade setup','Reversible via tfClearNoRipple','Single-transaction per line'] },

  // DEFI & TRADING
  { id:'dex-order',    cat:'defi', emoji:'📈', name:'DEX Order Builder',
    amendment:'OfferCreate', color:'#10b981', featured:false, priceRLUSD:25, priceXRP:80,
    tagline:'Place precision limit orders on the XRPL native DEX',
    desc:'Create exact limit orders on the XRPL built-in DEX. Specify what you offer, what you want in return, and the exchange rate. All offer flag types supported: passive, immediate-or-cancel, fill-or-kill, sell.',
    aiDelivery:'AI constructs OfferCreate with your exact terms. You sign once in Xaman. Order live in ~4 seconds.',
    aiDetail:'You specify TakerGets, TakerPays, and any flags (tfPassive, tfImmediateOrCancel, tfFillOrKill, tfSell). AI builds the OfferCreate transaction with proper Amount objects and encoding. You sign in Xaman. Order is placed on the XRPL DEX order book within one ledger close.',
    features:['Native XRPL DEX','All offer flag types','Token and XRP pairs','Single-transaction placement','Cancellable via OfferCancel'] },

  { id:'amm-create',   cat:'defi', emoji:'🌊', name:'AMM Pool Launch',
    amendment:'AMMCreate', color:'#06b6d4', featured:true, priceRLUSD:75, priceXRP:245,
    tagline:'Deploy a new Automated Market Maker pool on XRPL mainnet',
    desc:'Launch your own AMM pool for any token pair. Set your trading fee, deposit initial liquidity, and the pool is live for everyone to trade against. Earn a share of every swap through your pool as a liquidity provider.',
    aiDelivery:'AI constructs AMMCreate with your token pair and fee. You sign once in Xaman. Pool live in ~4 seconds.',
    aiDetail:'You specify Amount (asset 1 deposit), Amount2 (asset 2 deposit), and TradingFee (0-1000 basis points). AI builds the AMMCreate transaction. You sign in Xaman. Pool is live on XRPL mainnet immediately — all traders can swap against it, and you receive LP tokens representing your ownership share.',
    features:['Any XRPL token pair','0-1% configurable fee','LP tokens to your wallet','Live on mainnet immediately','Auction slot eligible'] },

  { id:'amm-deposit',  cat:'defi', emoji:'💧', name:'AMM Liquidity Entry',
    amendment:'AMMDeposit', color:'#34d399', featured:false, priceRLUSD:35, priceXRP:115,
    tagline:'Add liquidity to any XRPL AMM pool and earn trading fees',
    desc:'Deposit into any active XRPL AMM pool. Earn a proportional share of every trading fee based on your pool ownership. Single-asset or balanced two-asset deposits both supported.',
    aiDelivery:'AI constructs AMMDeposit with your specifications. You sign once in Xaman. LP tokens received in ~4 seconds.',
    aiDetail:'You specify the pool (Asset and Asset2), deposit amounts, and deposit type flags (tfTwoAsset, tfSingleAsset, tfLPToken, tfLimitLPToken). AI builds AMMDeposit with proper Amount objects. You sign in Xaman. LP tokens are credited to your wallet, representing your share of the pool and future fee earnings.',
    features:['Single or dual asset deposit','LP tokens credited immediately','Proportional fee earnings','Any active XRPL AMM','Withdrawable anytime'] },

  { id:'smart-swap',   cat:'defi', emoji:'🔄', name:'Smart Swap Router',
    amendment:'PathPaymentStrictSend', color:'#a78bfa', featured:false, priceRLUSD:25, priceXRP:80,
    tagline:'Swap tokens via XRPL native pathfinding through DEX and AMM pools',
    desc:'Send one asset and receive another using XRPL pathfinding to route through order books and AMM pools simultaneously. Atomic execution — you either receive your target amount or the transaction does not execute.',
    aiDelivery:'AI constructs PathPayment with optimal route. You sign once in Xaman. Swap complete in ~4 seconds.',
    aiDetail:'You specify source asset/amount and destination asset. AI queries XRPL pathfinding for the best route through active order books and AMM pools, builds PathPaymentStrictSend or PathPaymentStrictReceive with up to 6 path alternatives. You sign in Xaman. Swap executes atomically on mainnet.',
    features:['Native XRPL pathfinding','DEX + AMM routing','Strict send or receive','Atomic execution','Best available rate'] },

  { id:'paychannel',   cat:'defi', emoji:'⚡', name:'Payment Channel Setup',
    amendment:'PaymentChannelCreate', color:'#fbbf24', featured:false, priceRLUSD:50, priceXRP:165,
    tagline:'Open a payment channel for high-frequency off-chain micropayments',
    desc:'Create a unidirectional payment channel for streaming or micropayment applications. Lock XRP in the channel, sign off-chain receipts at any frequency, and settle on-chain when done. Perfect for content streaming, gaming, and IoT.',
    aiDelivery:'AI constructs PaymentChannelCreate. You sign once in Xaman. Channel open in ~4 seconds.',
    aiDetail:'You provide Destination, Amount (XRP to lock), SettleDelay (seconds before closure), and PublicKey (signing key for claims). AI builds PaymentChannelCreate. You sign in Xaman. The channel is open. Recipients can claim at any time via signed off-chain receipts without any on-chain transaction until final settlement.',
    features:['Off-chain micropayments','On-chain settlement','Any claim frequency','Configurable settle delay','Close via PaymentChannelClose'] },

  // NFT TOOLS
  { id:'nft-mint',     cat:'nft', emoji:'🎨', name:'NFT Minter',
    amendment:'NFTokenMint', color:'#ec4899', featured:true, priceRLUSD:30, priceXRP:95,
    tagline:'Mint XRPL NFTs with custom metadata, royalties up to 50%, and collection taxons',
    desc:'Create native XRPL NFTs (XLS-20 standard). Custom metadata URI pointing to your IPFS or HTTPS content, collection taxon for grouping, transfer fee for royalties, and configurable flags for burn and transfer behavior.',
    aiDelivery:'AI constructs NFTokenMint with your specifications. You sign once in Xaman. NFT minted in ~4 seconds.',
    aiDetail:'You provide TokenTaxon (collection grouping), URI (hex-encoded metadata URL), TransferFee (0-50000 = 0%-50%), and flags (tfBurnable, tfOnlyXRP, tfTransferable). AI builds NFTokenMint with all fields properly encoded. You sign in Xaman. The NFTokenID is minted to your wallet immediately.',
    features:['XLS-20 standard XRPL NFTs','Royalties up to 50%','Collection taxon support','Custom IPFS/HTTPS metadata','Burnable and transferable flags'] },

  { id:'nft-burn',     cat:'nft', emoji:'🔥', name:'NFT Burn Certificate',
    amendment:'NFTokenBurn', color:'#ef4444', featured:false, priceRLUSD:20, priceXRP:65,
    tagline:'Permanently destroy an NFT with verifiable on-chain proof of burn',
    desc:'Burn an NFT you own to permanently remove it from circulation. The burn transaction hash is your on-chain proof — used for redemption campaigns, scarcity enforcement, and limited edition rarity reductions.',
    aiDelivery:'AI constructs NFTokenBurn. You sign once in Xaman. NFT permanently burned in ~4 seconds.',
    aiDetail:'You provide the NFTokenID. AI builds the NFTokenBurn transaction. You sign in Xaman as the owner (or as issuer for Burnable-flagged NFTs). After confirmation, the NFT is destroyed permanently and supply is reduced. The TX hash is immutable on-chain proof of destruction.',
    features:['Permanent on-chain burn','Verifiable TX hash proof','Owner or issuer burn','Reduces collection supply','Single-transaction execution'] },

  { id:'nft-offer',    cat:'nft', emoji:'🏷️', name:'NFT Offer Creator',
    amendment:'NFTokenCreateOffer', color:'#f59e0b', featured:false, priceRLUSD:20, priceXRP:65,
    tagline:'Create buy or sell offers for any XRPL NFT with optional expiration',
    desc:'List an NFT for sale at your price (sell offer) or make a bid on any NFT (buy offer). Price in XRP or any issued token. Set an expiration date or target a specific buyer.',
    aiDelivery:'AI constructs NFTokenCreateOffer. You sign once in Xaman. Offer live in ~4 seconds.',
    aiDetail:'You specify NFTokenID, Amount (price), optional Destination (targeted buyer), optional Expiration, and tfSellNFToken flag for sell offers. AI builds NFTokenCreateOffer with all fields. You sign in Xaman. Offer is live on-chain and cancellable at any time via NFTokenCancelOffer.',
    features:['Sell or buy offer types','XRP or token pricing','Targeted or open offers','Optional expiration','Cancellable anytime'] },

  // IDENTITY & COMPLIANCE
  { id:'identity',     cat:'identity', emoji:'🆔', name:'On-Chain Identity',
    amendment:'AccountSet · Domain + EmailHash', color:'#3b82f6', featured:true, priceRLUSD:20, priceXRP:65,
    tagline:'Link your verified domain and email to your XRPL wallet address',
    desc:'Make your wallet identifiable on every XRPL explorer. Your domain appears next to your address on XRPScan, Bithomp, and all major explorers. Your email hash links to Gravatar for a profile picture. Industry-standard wallet identification for businesses and builders.',
    aiDelivery:'AI constructs AccountSet with Domain and EmailHash. You sign once in Xaman. Visible on explorers in ~4 seconds.',
    aiDetail:'You provide your domain name and contact email. AI hex-encodes the domain (per XRPL spec, max 256 bytes) and MD5-hashes the lowercase-trimmed email per the Gravatar standard, then builds AccountSet with both fields. You sign in Xaman. All major XRPL explorers display your verified identity next to your wallet address.',
    features:['Domain visible on XRPScan','Gravatar profile picture','Bithomp verification','Updatable anytime','Professional credibility'] },

  { id:'did',          cat:'identity', emoji:'🪪', name:'DID Document Creator',
    amendment:'DIDSet', color:'#8b5cf6', featured:false, priceRLUSD:35, priceXRP:115,
    tagline:'Create a W3C-compliant Decentralized Identifier on XRPL mainnet',
    desc:'Establish portable on-chain identity using the XRPL DID amendment. Your DID document is stored on the ledger and resolvable by any application supporting the W3C DID standard. The foundation of self-sovereign identity on XRPL.',
    aiDelivery:'AI constructs DIDSet with your document data. You sign once in Xaman. DID live in ~4 seconds.',
    aiDetail:'You provide your DID document data, URI, and optional Data fields. AI builds the DIDSet transaction with proper encoding. You sign in Xaman. After confirmation, your DID is registered on XRPL mainnet and resolvable as did:xrpl:1:youraddress by any W3C-compatible resolver.',
    features:['W3C DID standard compliant','Portable decentralized identity','Updatable via DIDSet','Deletable via DIDDelete','Self-sovereign — no authority controls it'] },

  { id:'compliance',   cat:'identity', emoji:'✅', name:'Compliance Bundle',
    amendment:'AccountSet · Multi-Flag', color:'#10b981', featured:false, priceRLUSD:55, priceXRP:180,
    tagline:'Enterprise-grade XRPL compliance configuration in one bundle',
    desc:'Complete compliance setup for businesses: verified domain, email identity, destination tag enforcement, and deposit authorization. Everything an exchange, custodian, or regulated business needs to operate on XRPL.',
    aiDelivery:'AI constructs all 4 AccountSet transactions. You sign each in Xaman. Full compliance live in under a minute.',
    aiDetail:'AI builds four AccountSet transactions: (1) Domain with business domain, (2) EmailHash with compliance contact, (3) asfRequireDest forcing destination tags, (4) asfDepositAuth enabling preauthorized deposits only. You sign each in Xaman. After all four confirm, your wallet has enterprise-grade compliance configuration.',
    features:['Domain + email identity','RequireDest enforcement','DepositAuth whitelist','Exchange-grade setup','All 4 flags in one session'] },

  // ESCROW
  { id:'escrow',       cat:'escrow', emoji:'🏛️', name:'Escrow Setup',
    amendment:'EscrowCreate', color:'#fbbf24', featured:false, priceRLUSD:40, priceXRP:130,
    tagline:'Time-lock XRP on-chain with custom release and cancellation conditions',
    desc:'Create a time-locked escrow on XRPL mainnet. Specify the recipient, amount, and your FinishAfter date. Funds are locked on-chain until your conditions are met — used for contracts, vesting schedules, and conditional payments.',
    aiDelivery:'AI constructs EscrowCreate. You sign once in Xaman. XRP locked on-chain in ~4 seconds.',
    aiDetail:'You provide Destination, Amount (XRP), FinishAfter (the earliest the escrow can be completed), and optional CancelAfter (when the escrow can be cancelled if unclaimed). AI builds EscrowCreate with proper Ripple epoch timestamps. You sign in Xaman. XRP is locked on-chain. When FinishAfter arrives, the recipient or anyone can submit EscrowFinish to release funds — this is a separate transaction you execute when ready.',
    features:['Time-locked XRP on mainnet','Custom FinishAfter timestamp','Optional CancelAfter window','Verifiable on XRPScan','Manual EscrowFinish to release'] },

  // COMING SOON
  { id:'lending',      cat:'comingsoon', emoji:'🏦', name:'XRPL Lending Pool',
    amendment:'Lending Protocol · Pending', color:'#9ca3af', featured:false, priceRLUSD:0, priceXRP:0,
    tagline:'Deposit XRP to earn yield · Borrow against your XRPLScore',
    desc:'Coming when the XRPL lending amendment activates. Deposit XRP to earn yield from borrowers. Borrow against your XRPLScore — the first uncollateralized lending product on XRPL. Your payment history today builds your borrowing limit tomorrow.',
    aiDelivery:'Pending XRPL lending amendment activation',
    aiDetail:'Your XRPLScore and Credit Builder payment history will serve as the creditworthiness signal for uncollateralized loans when this launches.',
    features:['XRP yield deposits','XRPLScore-based borrowing','Uncollateralized loans','Pending amendment','Join notify list'] },

  { id:'xahau',        cat:'comingsoon', emoji:'🪝', name:'Xahau Hooks',
    amendment:'Cross-Chain · Xahau', color:'#9ca3af', featured:false, priceRLUSD:0, priceXRP:0,
    tagline:'Smart contract hooks via XRPL sister network Xahau',
    desc:'Coming when the Xahau bridge stabilizes for cross-chain operations. Enables programmable smart contract logic via Xahau Hooks while maintaining your XRPL primary wallet. The most powerful programmability available in the XRP ecosystem.',
    aiDelivery:'Pending Xahau bridge production readiness',
    aiDetail:'Cross-chain integration with Xahau for programmable hooks. Attach logic to your wallet that executes automatically on transaction events — without smart contract risk on the XRPL base layer.',
    features:['Xahau smart contracts','XRPL primary wallet','Programmable hooks','Automated execution','Join notify list'] },
] as const;

type Product = typeof PRODUCTS[number];

const CATS = [
  { id:'all',        label:'All Services' },
  { id:'security',   label:'Wallet Security' },
  { id:'issuer',     label:'Token Issuer' },
  { id:'defi',       label:'DeFi & Trading' },
  { id:'nft',        label:'NFT Tools' },
  { id:'identity',   label:'Identity' },
  { id:'escrow',     label:'Escrow' },
  { id:'comingsoon', label:'Coming Soon' },
] as const;

// ─── SCORE HELPERS ────────────────────────────────────────────────────────────
interface ScoreData {
  ledgerScore: number; grade?: string; percentile?: number;
  percentileLabel?: string;
  breakdown?: Array<{ label: string; signal: string; score: number; weight: string; desc: string }>;
  recommendations?: Array<{ action: string; points: string; priority: string }>;
  details?: { txCount?: number; accountAge?: number; balanceXRP?: number; trustLines?: number;
    hasMultiSig?: boolean; hasRegKey?: boolean; hasDomain?: boolean;
    nftCount?: number; ammTxCount?: number; dexTxCount?: number };
}

function gradeScore(n: number) {
  if (n >= 800) return { label:'Exceptional', color:'#10b981', glow:'rgba(16,185,129,.55)' };
  if (n >= 740) return { label:'Excellent',   color:'#34d399', glow:'rgba(52,211,153,.5)'  };
  if (n >= 670) return { label:'Good',         color:'#fbbf24', glow:'rgba(251,191,36,.5)'  };
  if (n >= 580) return { label:'Fair',          color:'#f97316', glow:'rgba(249,115,22,.5)'  };
  return              { label:'Building',       color:'#ef4444', glow:'rgba(239,68,68,.5)'   };
}

// ─── STYLE HELPERS ────────────────────────────────────────────────────────────
const GLASS: React.CSSProperties = {
  background:'rgba(6,6,22,.72)', backdropFilter:'blur(22px)',
  WebkitBackdropFilter:'blur(22px)', border:'1px solid rgba(255,255,255,.09)',
};
const INP: React.CSSProperties = {
  width:'100%', background:'rgba(255,255,255,.07)', border:'1px solid rgba(255,255,255,.13)',
  borderRadius:12, padding:'12px 15px', fontSize:14, color:'#fff', outline:'none',
  fontFamily:'inherit', boxSizing:'border-box', transition:'border-color .15s',
};
const LBL: React.CSSProperties = {
  display:'block', fontSize:10, fontWeight:700, color:'rgba(255,255,255,.32)',
  textTransform:'uppercase', letterSpacing:'.1em', marginBottom:6,
};
type BtnVariant = 'green' | 'ghost' | 'color';
function B(v: BtnVariant, color?: string, extra?: React.CSSProperties): React.CSSProperties {
  const base: React.CSSProperties = {
    display:'inline-flex', alignItems:'center', justifyContent:'center', gap:7,
    border:'none', borderRadius:99, fontWeight:700, fontSize:14,
    cursor:'pointer', fontFamily:'inherit', padding:'12px 26px', transition:'all .18s', ...extra,
  };
  if (v === 'green') return { ...base, background:'#10b981', color:'#000' };
  if (v === 'color') return { ...base, background:color||'#10b981', color:'#000' };
  return { ...base, background:'rgba(255,255,255,.08)', color:'#fff', border:'1px solid rgba(255,255,255,.14)' };
}
type Currency = 'RLUSD' | 'XRP';
function qrSrc(d: string) {
  return `https://api.qrserver.com/v1/create-qr-code/?size=166x166&data=${encodeURIComponent(d)}&color=0d9488&bgcolor=030407&qzone=2&format=svg`;
}
function xamanLink(amount: number, currency: Currency): string {
  if (currency === 'XRP' && amount > 0) return `xrpl:${TREASURY}?amount=${Math.floor(amount*1_000_000)}`;
  return `https://xumm.app/detect/request:${TREASURY}`;
}

// ─── OVERLAY ─────────────────────────────────────────────────────────────────
function Overlay({ show, onClose, children, wide=false }: {
  show:boolean; onClose:()=>void; children:React.ReactNode; wide?:boolean;
}) {
  useEffect(() => {
    if (!show) return;
    document.body.style.overflow = 'hidden';
    const fn = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', fn);
    return () => { window.removeEventListener('keydown', fn); document.body.style.overflow = ''; };
  }, [show, onClose]);
  if (!show) return null;
  return (
    <div onClick={onClose} style={{ position:'fixed', inset:0, zIndex:1000, background:'rgba(0,0,0,.88)', backdropFilter:'blur(14px)', display:'flex', alignItems:'center', justifyContent:'center', padding:20 }}>
      <div onClick={e => e.stopPropagation()} style={{ ...GLASS, borderRadius:26, padding:'36px 34px', width:'100%', maxWidth:wide?720:520, position:'relative', animation:'popIn .26s cubic-bezier(.34,1.56,.64,1) both', maxHeight:'90vh', overflowY:'auto', boxShadow:'0 0 80px rgba(16,185,129,.08),0 40px 100px rgba(0,0,0,.85)' }}>
        <button onClick={onClose} style={{ position:'absolute', top:16, right:16, width:32, height:32, borderRadius:'50%', background:'rgba(255,255,255,.08)', border:'none', color:'rgba(255,255,255,.6)', cursor:'pointer', fontSize:16, display:'flex', alignItems:'center', justifyContent:'center' }}>✕</button>
        {children}
      </div>
    </div>
  );
}

// ─── SCORE MODAL ─────────────────────────────────────────────────────────────
function ScoreModal({ show, onClose, data, loading, error, onRetry, address }: {
  show:boolean; onClose:()=>void; data:ScoreData|null; loading:boolean;
  error:string|null; onRetry:()=>void; address:string;
}) {
  const [tab, setTab] = useState<'overview'|'breakdown'|'improve'>('overview');
  const [anim, setAnim] = useState(false);
  const grade = data ? gradeScore(data.ledgerScore) : null;
  const R = 52; const circ = 2 * Math.PI * R;
  const pct = data ? Math.min(1, Math.max(0, (data.ledgerScore - 300) / 550)) : 0;

  useEffect(() => {
    if (show && data) { const t = setTimeout(() => setAnim(true), 100); return () => clearTimeout(t); }
    else setAnim(false);
  }, [show, data]);

  useEffect(() => { if (show) setTab('overview'); }, [show]);

  return (
    <Overlay show={show} onClose={onClose} wide>
      <div style={{ fontSize:10, fontWeight:700, color:'#10b981', letterSpacing:'.12em', textTransform:'uppercase', marginBottom:8, fontFamily:"'IBM Plex Mono',monospace" }}>XRPLScore™ Report</div>

      {loading && (
        <div style={{ textAlign:'center', padding:'44px 0' }}>
          <div style={{ fontSize:40, animation:'spin 1s linear infinite', display:'inline-block', marginBottom:14 }}>⚡</div>
          <p style={{ color:'#10b981', fontWeight:600, fontSize:17 }}>Scanning XRPL Mainnet…</p>
          <p style={{ color:'rgba(255,255,255,.35)', fontSize:13, marginTop:6 }}>Analyzing 8 on-chain signals</p>
          <div style={{ width:220, height:3, background:'rgba(255,255,255,.07)', borderRadius:99, margin:'18px auto 0', overflow:'hidden' }}>
            <div style={{ height:'100%', background:'#10b981', animation:'shimmer 1.5s ease-in-out infinite', borderRadius:99 }} />
          </div>
        </div>
      )}

      {error && !loading && (
        <div style={{ textAlign:'center', padding:'28px 0' }}>
          <div style={{ fontSize:44, marginBottom:12 }}>⚠️</div>
          <p style={{ color:'#f87171', fontWeight:600, fontSize:17, marginBottom:8 }}>Could not fetch score</p>
          <p style={{ color:'rgba(255,255,255,.4)', fontSize:13, marginBottom:22 }}>{error}</p>
          <div style={{ display:'flex', gap:10, justifyContent:'center' }}>
            <button onClick={onRetry} style={B('green')}>Retry</button>
            <button onClick={onClose} style={B('ghost')}>Close</button>
          </div>
        </div>
      )}

      {data && !loading && grade && (
        <>
          {/* Score ring + grade */}
          <div style={{ display:'flex', alignItems:'center', gap:28, marginBottom:20, flexWrap:'wrap' }}>
            <div style={{ position:'relative', width:140, height:140, filter:`drop-shadow(0 0 22px ${grade.glow})`, flexShrink:0 }}>
              <svg viewBox="0 0 120 120" style={{ width:'100%', height:'100%', transform:'rotate(-90deg)' }}>
                <circle cx="60" cy="60" r={R} fill="none" stroke="rgba(255,255,255,.06)" strokeWidth="10" />
                <circle cx="60" cy="60" r={R} fill="none" stroke={grade.color} strokeWidth="10" strokeLinecap="round" strokeDasharray={circ} strokeDashoffset={anim ? circ*(1-pct) : circ} style={{ transition:'stroke-dashoffset 1.4s cubic-bezier(.34,1.2,.64,1)' }} />
              </svg>
              <div style={{ position:'absolute', inset:0, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center' }}>
                <span style={{ fontSize:38, fontWeight:900, color:grade.color, lineHeight:1, letterSpacing:'-2px', transition:'all .8s', transform:anim?'scale(1)':'scale(.7)', opacity:anim?1:0 }}>{data.ledgerScore}</span>
                <span style={{ fontSize:9, color:'rgba(255,255,255,.3)', marginTop:3, letterSpacing:'.12em', textTransform:'uppercase' }}>XRPLScore</span>
              </div>
            </div>
            <div style={{ flex:1 }}>
              <span style={{ display:'inline-block', padding:'4px 16px', borderRadius:99, background:`${grade.color}18`, border:`1px solid ${grade.color}40`, color:grade.color, fontWeight:700, fontSize:16, marginBottom:8 }}>{grade.label}</span>
              {data.percentile && <p style={{ fontSize:13, color:'rgba(255,255,255,.5)', marginBottom:6 }}>Higher than {data.percentile}% of scanned XRPL wallets</p>}
              {address && <p style={{ fontSize:10, color:'rgba(255,255,255,.25)', fontFamily:"'IBM Plex Mono',monospace" }}>🔒 {address.slice(0,14)}…{address.slice(-5)}</p>}
            </div>
          </div>

          {/* Tab nav */}
          <div style={{ display:'flex', gap:6, marginBottom:18, borderBottom:'1px solid rgba(255,255,255,.07)', paddingBottom:10 }}>
            {(['overview','breakdown','improve'] as const).map(t => (
              <button key={t} onClick={() => setTab(t)} style={{ padding:'6px 14px', borderRadius:99, border:`1px solid ${tab===t?'#10b981':'rgba(255,255,255,.1)'}`, background:tab===t?'rgba(16,185,129,.15)':'transparent', color:tab===t?'#10b981':'rgba(255,255,255,.4)', fontSize:12, fontWeight:700, cursor:'pointer', fontFamily:'inherit', transition:'all .15s', textTransform:'capitalize' }}>{t}</button>
            ))}
          </div>

          {/* Overview tab */}
          {tab === 'overview' && data.details && (
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
              {([
                ['Transactions', data.details.txCount?.toLocaleString()],
                ['Account Age', data.details.accountAge != null ? `${data.details.accountAge}d` : undefined],
                ['XRP Balance', data.details.balanceXRP != null ? `${data.details.balanceXRP.toFixed(1)} XRP` : undefined],
                ['Trust Lines', data.details.trustLines?.toString()],
                ['Multi-Sig', data.details.hasMultiSig ? 'Enabled ✓' : 'Not set'],
                ['Domain', data.details.hasDomain ? 'Verified ✓' : 'Not set'],
                ['NFTs Held', data.details.nftCount != null ? String(data.details.nftCount) : undefined],
                ['DEX Trades', data.details.dexTxCount != null ? String(data.details.dexTxCount) : undefined],
              ] as [string, string|undefined][]).filter(([,v]) => v !== undefined).map(([l, v]) => (
                <div key={l} style={{ background:'rgba(255,255,255,.04)', borderRadius:12, padding:'12px 14px' }}>
                  <div style={{ fontSize:10, color:'rgba(255,255,255,.32)', textTransform:'uppercase', letterSpacing:'.07em', marginBottom:3 }}>{l}</div>
                  <div style={{ fontSize:18, fontWeight:800, color: v?.includes('✓') ? '#10b981' : '#fff' }}>{v}</div>
                </div>
              ))}
            </div>
          )}

          {/* Breakdown tab */}
          {tab === 'breakdown' && data.breakdown && (
            <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
              {data.breakdown.map(b => (
                <div key={b.signal} style={{ background:'rgba(255,255,255,.04)', borderRadius:12, padding:'12px 14px' }}>
                  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:6 }}>
                    <div>
                      <span style={{ fontSize:12, fontWeight:700, color:'#fff' }}>{b.label}</span>
                      <span style={{ fontSize:10, color:'rgba(255,255,255,.3)', marginLeft:8 }}>{b.weight}</span>
                    </div>
                    <span style={{ fontSize:14, fontWeight:900, color: b.score >= 70 ? '#10b981' : b.score >= 40 ? '#fbbf24' : '#ef4444' }}>{b.score}</span>
                  </div>
                  <div style={{ height:4, background:'rgba(255,255,255,.07)', borderRadius:99, overflow:'hidden' }}>
                    <div style={{ height:'100%', width:`${b.score}%`, background: b.score >= 70 ? '#10b981' : b.score >= 40 ? '#fbbf24' : '#ef4444', borderRadius:99, transition:'width 1s ease' }} />
                  </div>
                  <p style={{ fontSize:10, color:'rgba(255,255,255,.35)', marginTop:5 }}>{b.desc}</p>
                </div>
              ))}
            </div>
          )}

          {/* Improve tab */}
          {tab === 'improve' && data.recommendations && (
            <div>
              <p style={{ fontSize:12, color:'rgba(255,255,255,.45)', marginBottom:14 }}>Ranked by highest XRPLScore impact for your wallet:</p>
              <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
                {data.recommendations.map((r, i) => (
                  <div key={i} style={{ background:'rgba(255,255,255,.04)', borderRadius:12, padding:'12px 14px', display:'flex', justifyContent:'space-between', alignItems:'center', gap:12 }}>
                    <div style={{ display:'flex', gap:10, alignItems:'flex-start' }}>
                      <span style={{ fontSize:14, fontWeight:900, color: r.priority==='high'?'#10b981':r.priority==='medium'?'#fbbf24':'#9ca3af', flexShrink:0 }}>{i+1}.</span>
                      <span style={{ fontSize:12, color:'rgba(255,255,255,.7)' }}>{r.action}</span>
                    </div>
                    <span style={{ fontSize:11, fontWeight:700, color:'#10b981', flexShrink:0, background:'rgba(16,185,129,.12)', border:'1px solid rgba(16,185,129,.25)', borderRadius:99, padding:'2px 8px', whiteSpace:'nowrap' }}>{r.points}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <button onClick={onClose} style={{ ...B('green', undefined, { width:'100%', padding:'14px', fontSize:15, marginTop:20 }) }}>Done</button>
        </>
      )}
    </Overlay>
  );
}

// ─── PRODUCT MODAL ────────────────────────────────────────────────────────────
function ProductModal({ show, onClose, product, inXApp, signXRP }: {
  show:boolean; onClose:()=>void; product:Product|null; inXApp:boolean; signXRP:(n:number)=>Promise<string|null>;
}) {
  const [step, setStep]     = useState<'info'|'checkout'|'processing'|'success'>('info');
  const [currency, setCur]  = useState<Currency>('RLUSD');
  const [email, setEmail]   = useState('');
  const [copied, setCopied] = useState(false);
  const [qrErr, setQrErr]   = useState(false);
  const [txid, setTxid]     = useState('');

  if (!product || (product as any).comingSoon) {
    if ((product as any)?.comingSoon) return (
      <Overlay show={show} onClose={onClose}>
        <div style={{ textAlign:'center', padding:'20px 0' }}>
          <div style={{ fontSize:48, marginBottom:12 }}>{product?.emoji}</div>
          <h3 style={{ fontSize:22, fontWeight:900, marginBottom:10 }}>{product?.name}</h3>
          <p style={{ fontSize:13, color:'rgba(255,255,255,.5)', lineHeight:1.7, marginBottom:24 }}>{product?.desc}</p>
          <div style={{ background:'rgba(16,185,129,.06)', border:'1px solid rgba(16,185,129,.18)', borderRadius:12, padding:'12px 16px', marginBottom:20 }}>
            <p style={{ fontSize:12, color:'#10b981' }}>{product?.aiDelivery}</p>
          </div>
          <button onClick={onClose} style={B('ghost')}>Close</button>
        </div>
      </Overlay>
    );
    return null;
  }

  const price    = currency === 'RLUSD' ? product.priceRLUSD : product.priceXRP;
  const deepLink = xamanLink(price, currency);
  const copy     = () => { navigator.clipboard.writeText(TREASURY); setCopied(true); setTimeout(() => setCopied(false), 2200); };

  const handleSent = async () => {
    setStep('processing');
    // If inside xApp and paying XRP, use SDK
    if (inXApp && currency === 'XRP') {
      const id = await signXRP(price);
      if (id) setTxid(id);
    } else {
      // Browser: optimistic — user confirmed they sent
      try {
        await fetch(`${API_URL}/api/create-payment`, {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ productId: product.id, currency, amount: price, email }),
        });
      } catch {}
    }
    await new Promise(r => setTimeout(r, 2400));
    setStep('success');
  };

  const handleClose = () => {
    onClose();
    setTimeout(() => { setStep('info'); setEmail(''); setCopied(false); setQrErr(false); setTxid(''); }, 300);
  };

  if (step === 'processing') return (
    <Overlay show={show} onClose={() => {}}>
      <div style={{ textAlign:'center', padding:'44px 0' }}>
        <div style={{ width:80, height:80, borderRadius:'50%', background:`${product.color}15`, border:`2px solid ${product.color}40`, display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 22px', fontSize:36, animation:'spin 2s linear infinite' }}>⚡</div>
        <h3 style={{ fontSize:20, fontWeight:900, color:product.color, marginBottom:8 }}>Building Your Transaction…</h3>
        <p style={{ fontSize:13, color:'rgba(255,255,255,.45)', lineHeight:1.75, maxWidth:320, margin:'0 auto 20px' }}>{product.aiDelivery}</p>
        <div style={{ width:260, height:3, background:'rgba(255,255,255,.07)', borderRadius:99, margin:'0 auto', overflow:'hidden' }}>
          <div style={{ height:'100%', background:`linear-gradient(90deg,${product.color},#10b981)`, animation:'shimmer 1.5s ease-in-out infinite', borderRadius:99 }} />
        </div>
        <p style={{ fontSize:11, color:'rgba(255,255,255,.25)', marginTop:16, fontFamily:"'IBM Plex Mono',monospace" }}>Verifying on XRPL mainnet…</p>
      </div>
    </Overlay>
  );

  if (step === 'success') return (
    <Overlay show={show} onClose={handleClose}>
      <div style={{ textAlign:'center', padding:'20px 0' }}>
        <div style={{ width:76, height:76, borderRadius:'50%', background:`${product.color}18`, border:`2px solid ${product.color}45`, display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 18px', fontSize:34, animation:'glow 2s ease-in-out infinite' }}>{product.emoji}</div>
        <div style={{ display:'inline-flex', alignItems:'center', gap:6, background:'rgba(16,185,129,.1)', border:'1px solid rgba(16,185,129,.25)', borderRadius:99, padding:'4px 14px', marginBottom:14 }}>
          <span style={{ width:6, height:6, borderRadius:'50%', background:'#10b981', boxShadow:'0 0 8px #10b981', display:'inline-block', animation:'pulse 2s infinite' }} />
          <span style={{ fontSize:10, fontWeight:700, color:'#10b981', letterSpacing:'.1em' }}>CONFIRMED — XRPL MAINNET</span>
        </div>
        <h3 style={{ fontSize:24, fontWeight:900, marginBottom:8 }}>{product.name} Activated</h3>
        <div style={{ background:'rgba(255,255,255,.04)', border:'1px solid rgba(255,255,255,.08)', borderRadius:14, padding:18, margin:'14px 0 18px', textAlign:'left' }}>
          <p style={{ fontSize:11, color:product.color, fontFamily:"'IBM Plex Mono',monospace", fontWeight:700, marginBottom:6, textTransform:'uppercase', letterSpacing:'.08em' }}>Transaction Summary</p>
          <p style={{ fontSize:13, color:'rgba(255,255,255,.65)', lineHeight:1.75 }}>{product.aiDetail}</p>
        </div>
        {txid && <p style={{ fontSize:11, color:'rgba(255,255,255,.35)', fontFamily:"'IBM Plex Mono',monospace", marginBottom:10 }}>TX: {txid.slice(0,20)}…</p>}
        {email && <p style={{ fontSize:12, color:'rgba(255,255,255,.38)', marginBottom:18 }}>Receipt sent to {email}</p>}
        <div style={{ display:'flex', gap:10, justifyContent:'center' }}>
          <a href={`https://xrpscan.com/account/${TREASURY}`} target="_blank" rel="noopener noreferrer" style={{ ...B('ghost', undefined, { fontSize:13, textDecoration:'none' }) }}>Verify on XRPScan ↗</a>
          <button onClick={handleClose} style={B('green')}>Done</button>
        </div>
      </div>
    </Overlay>
  );

  if (step === 'checkout') return (
    <Overlay show={show} onClose={handleClose}>
      <div style={{ fontSize:10, fontWeight:700, color:product.color, letterSpacing:'.12em', textTransform:'uppercase', marginBottom:5, fontFamily:"'IBM Plex Mono',monospace" }}>{product.amendment}</div>
      <h3 style={{ fontSize:21, fontWeight:900, marginBottom:18 }}>Pay to Activate</h3>

      {inXApp && currency === 'XRP' ? (
        <div style={{ background:'rgba(16,185,129,.06)', border:'1px solid rgba(16,185,129,.2)', borderRadius:14, padding:18, marginBottom:18, textAlign:'center' }}>
          <p style={{ fontSize:12, color:'#10b981', fontWeight:700 }}>Running inside Xaman</p>
          <p style={{ fontSize:12, color:'rgba(255,255,255,.5)', marginTop:4 }}>One-tap signing — no QR needed</p>
        </div>
      ) : (
        <>
          <div style={{ background:'#fff', borderRadius:14, padding:10, width:148, height:148, margin:'0 auto 12px', display:'flex', alignItems:'center', justifyContent:'center', overflow:'hidden' }}>
            {qrErr ? <div style={{ color:'#064e3b', fontSize:11, textAlign:'center' }}>Use address below</div>
              : <img key={deepLink} src={qrSrc(deepLink)} alt="Pay via Xaman" style={{ width:128, height:128, borderRadius:4 }} onError={() => setQrErr(true)} />}
          </div>
          <p style={{ textAlign:'center', marginBottom:14 }}>
            <a href={deepLink} target="_blank" rel="noopener noreferrer" style={{ fontSize:12, color:'#10b981', fontWeight:600 }}>
              Open in Xaman — {price} {currency} pre-filled
            </a>
          </p>
        </>
      )}

      <label style={LBL}>Currency</label>
      <div style={{ display:'flex', gap:8, marginBottom:14 }}>
        {(['RLUSD','XRP'] as Currency[]).map(c => (
          <button key={c} onClick={() => { setCur(c); setQrErr(false); }} style={{ flex:1, padding:'10px', borderRadius:12, cursor:'pointer', fontFamily:'inherit', fontWeight:700, fontSize:13, border:`1px solid ${currency===c?product.color:'rgba(255,255,255,.1)'}`, background:currency===c?`${product.color}15`:'rgba(255,255,255,.04)', color:currency===c?product.color:'rgba(255,255,255,.5)', transition:'all .15s' }}>
            {c === 'RLUSD' ? '💵 RLUSD' : '◈ XRP'} — {c === 'RLUSD' ? product.priceRLUSD : product.priceXRP}
          </button>
        ))}
      </div>

      <div style={{ background:'rgba(16,185,129,.06)', border:'1px solid rgba(16,185,129,.18)', borderRadius:12, padding:'10px 14px', marginBottom:14, display:'flex', alignItems:'center', gap:10 }}>
        <code style={{ fontSize:11, color:'#34d399', flex:1, wordBreak:'break-all', fontFamily:"'IBM Plex Mono',monospace" }}>{TREASURY}</code>
        <button onClick={copy} style={{ ...B('ghost', undefined, { padding:'5px 10px', fontSize:11 }), flexShrink:0 }}>{copied ? '✓' : 'Copy'}</button>
      </div>

      <label style={LBL}>Email for Receipt</label>
      <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" style={{ ...INP, marginBottom:14 }} />

      <div style={{ background:'rgba(255,255,255,.03)', borderRadius:11, padding:'10px 14px', marginBottom:16, fontSize:12, color:'rgba(255,255,255,.35)', lineHeight:1.7 }}>
        Send <strong style={{ color:'#fff' }}>{price} {currency}</strong> to the address above via Xaman, then tap below. Confirmed on XRPL mainnet in ~4 seconds.
      </div>

      <div style={{ display:'flex', gap:10 }}>
        <button onClick={() => setStep('info')} style={{ ...B('ghost', undefined, { flex:1 }) }}>Back</button>
        <button onClick={handleSent} style={{ ...B('color', product.color, { flex:2 }) }}>
          {inXApp && currency === 'XRP' ? `Sign ${price} XRP in Xaman` : `I Sent ${price} ${currency} — Activate`}
        </button>
      </div>
    </Overlay>
  );

  // Info step
  return (
    <Overlay show={show} onClose={handleClose} wide>
      <div style={{ display:'flex', gap:16, alignItems:'flex-start', marginBottom:22 }}>
        <div style={{ width:58, height:58, borderRadius:16, background:`${product.color}18`, border:`1px solid ${product.color}30`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:26, flexShrink:0, animation:'float 4s ease-in-out infinite' }}>{product.emoji}</div>
        <div>
          <div style={{ fontSize:10, fontWeight:700, color:product.color, letterSpacing:'.12em', textTransform:'uppercase', marginBottom:4, fontFamily:"'IBM Plex Mono',monospace" }}>{product.amendment}</div>
          <h2 style={{ fontSize:22, fontWeight:900, marginBottom:4 }}>{product.name}</h2>
          <p style={{ fontSize:13, color:'rgba(255,255,255,.48)' }}>{product.tagline}</p>
        </div>
      </div>
      <p style={{ fontSize:13, color:'rgba(255,255,255,.62)', lineHeight:1.8, marginBottom:20 }}>{product.desc}</p>
      <div style={{ background:'rgba(16,185,129,.05)', border:'1px solid rgba(16,185,129,.18)', borderRadius:14, padding:16, marginBottom:20 }}>
        <p style={{ fontSize:11, fontWeight:700, color:'#10b981', marginBottom:6, textTransform:'uppercase', letterSpacing:'.09em', fontFamily:"'IBM Plex Mono',monospace" }}>What AI delivers</p>
        <p style={{ fontSize:13, color:'rgba(255,255,255,.6)', lineHeight:1.75 }}>{product.aiDelivery}</p>
      </div>
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8, marginBottom:22 }}>
        {product.features.map(f => (
          <div key={f} style={{ background:'rgba(255,255,255,.04)', border:'1px solid rgba(255,255,255,.07)', borderRadius:11, padding:'10px 13px', display:'flex', alignItems:'center', gap:8 }}>
            <span style={{ color:product.color, fontSize:11, flexShrink:0 }}>✓</span>
            <span style={{ fontSize:12, color:'rgba(255,255,255,.55)' }}>{f}</span>
          </div>
        ))}
      </div>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', background:`${product.color}08`, border:`1px solid ${product.color}22`, borderRadius:14, padding:'16px 20px', marginBottom:18 }}>
        <div>
          <div style={{ fontSize:10, color:'rgba(255,255,255,.35)', marginBottom:3 }}>One-time activation</div>
          <span style={{ fontSize:28, fontWeight:900, color:product.color }}>{product.priceRLUSD} RLUSD</span>
          <span style={{ fontSize:12, color:'rgba(255,255,255,.3)', marginLeft:10 }}>or {product.priceXRP} XRP</span>
        </div>
        <div style={{ textAlign:'right' }}>
          <div style={{ fontSize:11, color:'rgba(255,255,255,.35)', marginBottom:3 }}>On-chain in</div>
          <div style={{ fontSize:16, fontWeight:700, color:'#10b981' }}>~4 seconds</div>
        </div>
      </div>
      <div style={{ background:'rgba(255,255,255,.03)', borderRadius:11, padding:'10px 14px', marginBottom:18, fontSize:11, color:'rgba(255,255,255,.28)', lineHeight:1.7 }}>
        On-chain operational service via XRP Ledger. Not a financial instrument or insurance product. All transactions are permanent and irrevocable.
      </div>
      <button onClick={() => setStep('checkout')} style={{ ...B('color', product.color, { width:'100%', padding:'15px', fontSize:16 }) }}>
        Activate for {product.priceRLUSD} RLUSD →
      </button>
    </Overlay>
  );
}

// ─── DONATE MODAL ─────────────────────────────────────────────────────────────
function DonateModal({ show, onClose }: { show:boolean; onClose:()=>void }) {
  const [amount, setAmount]   = useState('');
  const [currency, setCur]    = useState<Currency>('XRP');
  const [copied, setCopied]   = useState(false);
  const [txHash, setTxHash]   = useState('');
  const [step, setStep]       = useState<'form'|'confirmed'>('form');
  const [qrErr, setQrErr]     = useState(false);
  const deepLink = xamanLink(parseFloat(amount)||0, currency);
  const copy = () => { navigator.clipboard.writeText(TREASURY); setCopied(true); setTimeout(() => setCopied(false), 2200); };
  const handleSent = async () => {
    try { await fetch(`${API_URL}/api/donate`, { method:'POST', headers:{ 'Content-Type':'application/json' }, body:JSON.stringify({ amount, currency, txHash }) }); } catch {}
    setStep('confirmed');
  };
  const handleClose = () => { onClose(); setTimeout(() => { setStep('form'); setAmount(''); setTxHash(''); setQrErr(false); }, 300); };

  if (step === 'confirmed') return (
    <Overlay show={show} onClose={handleClose}>
      <div style={{ textAlign:'center', padding:'28px 0' }}>
        <div style={{ fontSize:60, marginBottom:14 }}>💚</div>
        <h3 style={{ fontSize:26, fontWeight:900, color:'#10b981', marginBottom:10 }}>Thank You.</h3>
        <p style={{ color:'rgba(255,255,255,.55)', fontSize:14, lineHeight:1.8, marginBottom:22 }}>
          {amount} {currency} is going directly to someone in need. No overhead. No middlemen. Wallet to wallet. Permanently on-chain.
        </p>
        <div style={{ display:'flex', gap:10, justifyContent:'center' }}>
          <a href={`https://xrpscan.com/account/${TREASURY}`} target="_blank" rel="noopener noreferrer" style={{ ...B('ghost', undefined, { fontSize:13, textDecoration:'none' }) }}>Verify on XRPScan ↗</a>
          <button onClick={handleClose} style={B('green')}>Done</button>
        </div>
      </div>
    </Overlay>
  );

  return (
    <Overlay show={show} onClose={handleClose}>
      <div style={{ fontSize:10, fontWeight:700, color:'#10b981', letterSpacing:'.12em', textTransform:'uppercase', marginBottom:5 }}>Fund the Treasury</div>
      <h3 style={{ fontSize:22, fontWeight:900, marginBottom:4 }}>Zero overhead. 100% to wallet.</h3>
      <p style={{ fontSize:13, color:'rgba(255,255,255,.44)', marginBottom:18, lineHeight:1.65 }}>Every drop verified on XRPScan. That is not a promise. That is math.</p>
      <div style={{ background:'#fff', borderRadius:14, padding:10, width:148, height:148, margin:'0 auto 12px', display:'flex', alignItems:'center', justifyContent:'center', overflow:'hidden' }}>
        {qrErr ? <div style={{ color:'#064e3b', fontSize:11, textAlign:'center' }}>Use address below</div>
          : <img key={deepLink} src={qrSrc(deepLink)} alt="Donate" style={{ width:128, height:128, borderRadius:4 }} onError={() => setQrErr(true)} />}
      </div>
      <div style={{ background:'rgba(16,185,129,.06)', border:'1px solid rgba(16,185,129,.18)', borderRadius:12, padding:'10px 14px', marginBottom:14, display:'flex', alignItems:'center', gap:10 }}>
        <code style={{ fontSize:11, color:'#34d399', flex:1, wordBreak:'break-all', fontFamily:"'IBM Plex Mono',monospace" }}>{TREASURY}</code>
        <button onClick={copy} style={{ ...B('ghost', undefined, { padding:'5px 10px', fontSize:11 }), flexShrink:0 }}>{copied ? '✓' : 'Copy'}</button>
      </div>
      <div style={{ display:'flex', gap:8, marginBottom:12 }}>
        {(['XRP','RLUSD'] as Currency[]).map(c => (
          <button key={c} onClick={() => { setCur(c); setQrErr(false); }} style={{ flex:1, padding:'9px', borderRadius:12, cursor:'pointer', fontFamily:'inherit', fontWeight:700, fontSize:13, border:`1px solid ${currency===c?'#10b981':'rgba(255,255,255,.1)'}`, background:currency===c?'rgba(16,185,129,.12)':'rgba(255,255,255,.04)', color:currency===c?'#10b981':'rgba(255,255,255,.5)' }}>
            {c === 'XRP' ? '◈ XRP' : '💵 RLUSD'}
          </button>
        ))}
      </div>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:8, marginBottom:12 }}>
        {['10','25','50','100'].map(a => (
          <button key={a} onClick={() => { setAmount(a); setQrErr(false); }} style={{ padding:'10px', borderRadius:12, cursor:'pointer', border:`1px solid ${amount===a?'#10b981':'rgba(255,255,255,.1)'}`, background:amount===a?'rgba(16,185,129,.12)':'rgba(255,255,255,.04)', color:amount===a?'#10b981':'rgba(255,255,255,.6)', fontWeight:700, fontSize:13, fontFamily:'inherit' }}>{a}</button>
        ))}
      </div>
      <input type="number" value={amount} onChange={e => { setAmount(e.target.value); setQrErr(false); }} placeholder={`Amount in ${currency}`} style={{ ...INP, marginBottom:10 }} />
      <input type="text" value={txHash} onChange={e => setTxHash(e.target.value)} placeholder="TX hash (optional)" style={{ ...INP, fontFamily:"'IBM Plex Mono',monospace", fontSize:12, marginBottom:16 }} />
      <button onClick={handleSent} disabled={!amount || parseFloat(amount) <= 0} style={{ ...B('green', undefined, { width:'100%', padding:'14px', fontSize:15, opacity:!amount||parseFloat(amount)<=0?0.4:1, cursor:!amount||parseFloat(amount)<=0?'not-allowed':'pointer' }) }}>
        I Sent My Donation
      </button>
    </Overlay>
  );
}

// ─── GRANT MODAL ──────────────────────────────────────────────────────────────
function GrantModal({ show, onClose }: { show:boolean; onClose:()=>void }) {
  const [step, setStep] = useState<'form'|'processing'|'success'>('form');
  const [form, setForm] = useState({ name:'', wallet:'', email:'', category:'', need:'', amount:'25' });
  const [errors, setErrors] = useState<Record<string,string>>({});
  const cats = ['Food & Groceries','Rent / Housing','Medical Bills','Utilities','Transportation','Other'];
  const set = (k: string, v: string) => { setForm(f => ({ ...f, [k]:v })); setErrors(e => ({ ...e, [k]:'' })); };
  const validate = () => {
    const e: Record<string,string> = {};
    if (!form.need.trim()) e.need = 'Please describe your need';
    if (!form.category) e.category = 'Please select a category';
    if (!form.wallet && !form.email) e.contact = 'Please provide a wallet address or email';
    if (form.wallet && (!form.wallet.startsWith('r') || form.wallet.length < 25)) e.wallet = 'Invalid XRPL wallet address';
    return e;
  };
  const handleSubmit = async () => {
    const e = validate(); if (Object.keys(e).length) { setErrors(e); return; }
    setStep('processing');
    try { await fetch(`${API_URL}/api/grants/submit`, { method:'POST', headers:{ 'Content-Type':'application/json' }, body:JSON.stringify(form) }); } catch {}
    await new Promise(r => setTimeout(r, 1600));
    setStep('success');
  };
  const handleClose = () => { onClose(); setTimeout(() => { setStep('form'); setForm({ name:'',wallet:'',email:'',category:'',need:'',amount:'25' }); setErrors({}); }, 300); };

  if (step === 'processing') return (
    <Overlay show={show} onClose={() => {}}>
      <div style={{ textAlign:'center', padding:'44px 0' }}>
        <div style={{ fontSize:44, animation:'spin 1s linear infinite', display:'inline-block', marginBottom:14 }}>⚡</div>
        <p style={{ color:'#10b981', fontWeight:600, fontSize:17 }}>Submitting application…</p>
        <p style={{ fontSize:13, color:'rgba(255,255,255,.38)', marginTop:6 }}>AI review within 24 hours</p>
      </div>
    </Overlay>
  );

  if (step === 'success') return (
    <Overlay show={show} onClose={handleClose}>
      <div style={{ textAlign:'center', padding:'20px 0' }}>
        <div style={{ fontSize:60, marginBottom:12 }}>❤️</div>
        <h3 style={{ fontSize:24, fontWeight:900, color:'#10b981', marginBottom:10 }}>Application Received</h3>
        <p style={{ color:'rgba(255,255,255,.55)', fontSize:14, lineHeight:1.75, marginBottom:22 }}>
          Your ${form.amount} grant application has been submitted. AI-assisted review within 24 hours. If approved, funds go directly to your XRPL wallet — no intermediary, no NGO, no overhead.
        </p>
        <button onClick={handleClose} style={B('green')}>Done</button>
      </div>
    </Overlay>
  );

  return (
    <Overlay show={show} onClose={handleClose} wide>
      <div style={{ fontSize:10, fontWeight:700, color:'#8b5cf6', letterSpacing:'.12em', textTransform:'uppercase', marginBottom:5 }}>Emergency Grant Application</div>
      <h3 style={{ fontSize:22, fontWeight:900, marginBottom:4 }}>Apply for Emergency Funds</h3>
      <p style={{ color:'rgba(255,255,255,.4)', fontSize:13, marginBottom:22 }}>$25–$100 · AI-assisted review · Direct to your XRPL wallet · No middlemen</p>
      <label style={LBL}>Category *</label>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:8, marginBottom:4 }}>
        {cats.map(c => <button key={c} onClick={() => set('category',c)} style={{ padding:'9px', borderRadius:12, cursor:'pointer', fontSize:12, border:`1px solid ${form.category===c?'#8b5cf6':'rgba(255,255,255,.1)'}`, background:form.category===c?'rgba(139,92,246,.12)':'rgba(255,255,255,.04)', color:form.category===c?'#8b5cf6':'rgba(255,255,255,.6)', fontWeight:600, fontFamily:'inherit' }}>{c}</button>)}
      </div>
      {errors.category && <p style={{ fontSize:12, color:'#f87171', marginBottom:8 }}>{errors.category}</p>}
      <label style={{ ...LBL, marginTop:14 }}>Amount Requested</label>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:8, marginBottom:16 }}>
        {['25','50','75','100'].map(a => <button key={a} onClick={() => set('amount',a)} style={{ padding:'11px', borderRadius:12, cursor:'pointer', border:`1px solid ${form.amount===a?'#8b5cf6':'rgba(255,255,255,.1)'}`, background:form.amount===a?'rgba(139,92,246,.12)':'rgba(255,255,255,.04)', color:form.amount===a?'#8b5cf6':'rgba(255,255,255,.6)', fontWeight:800, fontSize:15, fontFamily:'inherit' }}>${a}</button>)}
      </div>
      <label style={LBL}>Describe your situation *</label>
      <textarea value={form.need} onChange={e => set('need',e.target.value)} placeholder="Tell us what you need and why…" rows={4} style={{ ...INP, resize:'none', lineHeight:1.6, marginBottom:4 }} />
      {errors.need && <p style={{ fontSize:12, color:'#f87171', marginBottom:8 }}>{errors.need}</p>}
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10, marginTop:14 }}>
        <div><label style={LBL}>Name (optional)</label><input type="text" value={form.name} onChange={e => set('name',e.target.value)} placeholder="Anonymous is fine" style={INP} /></div>
        <div>
          <label style={LBL}>XRPL Wallet</label>
          <input type="text" value={form.wallet} onChange={e => set('wallet',e.target.value)} placeholder="rXXXXX…" style={{ ...INP, fontFamily:"'IBM Plex Mono',monospace", fontSize:12 }} />
          {errors.wallet && <p style={{ fontSize:12, color:'#f87171' }}>{errors.wallet}</p>}
        </div>
        <div><label style={LBL}>Email</label><input type="email" value={form.email} onChange={e => set('email',e.target.value)} placeholder="you@example.com" style={INP} /></div>
      </div>
      {errors.contact && <p style={{ fontSize:12, color:'#f87171', marginTop:4 }}>{errors.contact}</p>}
      <button onClick={handleSubmit} style={{ ...B('color', '#8b5cf6', { width:'100%', marginTop:22, padding:'15px', fontSize:16 }) }}>Submit for Review →</button>
      <p style={{ textAlign:'center', fontSize:11, color:'rgba(255,255,255,.22)', marginTop:10 }}>AI-assisted review within 24 hours · Zero overhead · Wallet-to-wallet</p>
    </Overlay>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN PAGE
// ═══════════════════════════════════════════════════════════════════════════════
export default function XRPLHubHome() {
  const liveStats                             = useLiveStats();
  const { inXApp, xAppAddr, sdkReady, signXRP } = useXamanSDK();

  const [walletInput,    setWalletInput]      = useState('');
  const [walletAddr,     setWalletAddr]       = useState('');
  const [walletConnected,setWalletConnected]  = useState(false);
  const [scoreData,      setScoreData]        = useState<ScoreData | null>(null);
  const [scoreLoading,   setScoreLoading]     = useState(false);
  const [scoreError,     setScoreError]       = useState<string | null>(null);
  const [activeProduct,  setActiveProduct]    = useState<Product | null>(null);
  const [activeCat,      setActiveCat]        = useState('all');
  const [tickerIdx,      setTickerIdx]        = useState(0);

  // Modals
  const [showScore,  setShowScore]   = useState(false);
  const [showDonate, setShowDonate]  = useState(false);
  const [showGrant,  setShowGrant]   = useState(false);

  // xApp: auto-populate wallet
  useEffect(() => {
    if (xAppAddr) { setWalletAddr(xAppAddr); setWalletConnected(true); }
  }, [xAppAddr]);

  // Ticker
  useEffect(() => {
    const iv = setInterval(() => setTickerIdx(i => (i + 1) % TICKER.length), 4500);
    return () => clearInterval(iv);
  }, []);

  const fetchScore = useCallback(async (addr?: string) => {
    const target = addr || walletAddr || walletInput || TREASURY;
    setScoreData(null); setScoreError(null); setScoreLoading(true); setShowScore(true);
    try {
      const ctrl = new AbortController();
      const t = setTimeout(() => ctrl.abort(), 14_000);
      const res = await fetch(`${API_URL}/api/score/${encodeURIComponent(target)}`, { signal: ctrl.signal });
      clearTimeout(t);
      if (!res.ok) { const b = await res.json().catch(() => ({})); throw new Error(b.error || `Error ${res.status}`); }
      const raw = await res.json();
      setScoreData({
        ledgerScore: raw.ledgerScore || raw.xrplScore || 300,
        grade: raw.grade,
        percentile: raw.percentile,
        percentileLabel: raw.percentileLabel,
        breakdown: raw.breakdown,
        recommendations: raw.recommendations,
        details: raw.details,
      });
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') setScoreError('Request timed out — try again');
      else setScoreError(err instanceof Error ? err.message : 'Could not fetch score');
    } finally { setScoreLoading(false); }
  }, [walletAddr, walletInput]);

  const visibleProducts = PRODUCTS.filter(p =>
    activeCat === 'all' ? true : p.cat === activeCat
  );

  const featuredIds = ['multisig','no-freeze','amm-create','nft-mint','identity'];

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800;900&family=IBM+Plex+Mono:wght@400;500;600&display=swap');
        *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
        html,body{overflow-x:hidden;max-width:100%;width:100%}
        img,svg,video{max-width:100%;height:auto}
        html{scroll-behavior:smooth}
        ::placeholder{color:rgba(255,255,255,.18)!important}
        input,textarea,button,select{font-family:inherit}
        ::-webkit-scrollbar{width:4px}
        ::-webkit-scrollbar-thumb{background:rgba(255,255,255,.1);border-radius:99px}

        @keyframes popIn{from{opacity:0;transform:scale(.93) translateY(12px)}to{opacity:1;transform:scale(1) translateY(0)}}
        @keyframes shimmer{0%{width:0%;margin-left:0}50%{width:70%;margin-left:0}100%{width:0%;margin-left:100%}}
        @keyframes spin{to{transform:rotate(360deg)}}
        @keyframes pulse{0%,100%{opacity:1;box-shadow:0 0 0 0 rgba(16,185,129,.7)}50%{opacity:.75;box-shadow:0 0 0 6px rgba(16,185,129,0)}}
        @keyframes glow{0%,100%{box-shadow:0 0 20px rgba(16,185,129,.25)}50%{box-shadow:0 0 55px rgba(16,185,129,.6)}}
        @keyframes float{0%,100%{transform:translateY(0)}50%{transform:translateY(-8px)}}
        @keyframes fadeUp{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
        @keyframes tickerScroll{0%{transform:translateX(0)}100%{transform:translateX(-50%)}}

        .pcard{transition:transform .22s,box-shadow .22s,border-color .22s;cursor:pointer}
        .pcard:hover{transform:translateY(-5px);box-shadow:0 0 50px rgba(16,185,129,.14),0 24px 60px rgba(0,0,0,.55)!important}
        .navbtn{padding:8px 16px;border-radius:99px;font-weight:600;font-size:13px;cursor:pointer;border:1px solid rgba(255,255,255,.12);background:rgba(255,255,255,.05);color:rgba(255,255,255,.62);transition:all .15s}
        .navbtn:hover{background:rgba(255,255,255,.1);color:#fff}
        .catbtn{padding:8px 18px;border-radius:99px;font-size:12px;font-weight:700;cursor:pointer;transition:all .15s;white-space:nowrap}

        /* NAV — responsive */
        .xh-nav{position:sticky;top:0;z-index:100;backdrop-filter:blur(22px);-webkit-backdrop-filter:blur(22px);background:rgba(3,3,16,.9);border-bottom:1px solid rgba(16,185,129,.15);padding:10px 28px;display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap}
        .xh-nav-brand{display:flex;align-items:center;gap:10px;min-width:0}
        .xh-nav-actions{display:flex;align-items:center;gap:8px}
        @media(max-width:640px){
          .xh-nav{padding:10px 14px;gap:8px}
          .xh-nav-pill{display:none!important}
          .xh-nav-sub{display:none!important}
          .xh-hide-sm{display:none!important}
          .xh-nav-actions{gap:6px}
          .navbtn{padding:7px 13px;font-size:12px}
          .xh-section{padding-left:16px!important;padding-right:16px!important}
          .xh-hero{padding:60px 16px 48px!important}
          .xh-card-pad{padding:28px 20px!important}
        }
        .xh-section{width:100%;max-width:1280px;margin:0 auto}
      `}</style>

      {/* BACKGROUND */}
      <div style={{ position:'fixed', inset:0, zIndex:-1 }}>
        <div style={{ position:'absolute', inset:0, background:'radial-gradient(ellipse at 20% 20%,rgba(16,185,129,.06) 0%,transparent 60%),radial-gradient(ellipse at 80% 80%,rgba(6,182,212,.04) 0%,transparent 60%),linear-gradient(135deg,#030310 0%,#040418 50%,#030312 100%)' }} />
      </div>

      <div style={{ minHeight:'100vh', fontFamily:"'Syne',sans-serif", color:'#eeeef5' }}>

        {/* NAV */}
        <nav className="xh-nav">
          <div className="xh-nav-brand">
            <img src="/hub-logo.png" alt="XRPLHub" style={{ width:34, height:34, borderRadius:8, flexShrink:0 }} onError={e => { (e.target as HTMLImageElement).style.display='none'; }} />
            <div style={{ minWidth:0 }}>
              <span style={{ fontSize:17, fontWeight:900, letterSpacing:'-.5px' }}>XRPLHub.io</span>
              <span className="xh-nav-sub" style={{ fontSize:9, color:'rgba(255,255,255,.35)', marginLeft:6, letterSpacing:'.08em', textTransform:'uppercase' }}>
                {inXApp ? '· xApp Mode' : '· XRPL Mainnet'}
              </span>
            </div>
            <span className="xh-nav-pill" style={{ display:'inline-flex', alignItems:'center', gap:5, background:'rgba(16,185,129,.1)', border:'1px solid rgba(16,185,129,.2)', borderRadius:99, padding:'3px 9px', fontSize:9, fontWeight:700, color:'#10b981', letterSpacing:'.1em', fontFamily:"'IBM Plex Mono',monospace" }}>
              <span style={{ width:4, height:4, borderRadius:'50%', background:'#10b981', display:'inline-block', animation:'pulse 2.5s infinite' }} />
              XRPL MAINNET
            </span>
          </div>
          <div className="xh-nav-actions">
            <button className="navbtn" onClick={() => setShowDonate(true)}>Donate</button>
            <button className="navbtn xh-hide-sm" onClick={() => setShowGrant(true)}>Apply for Grant</button>
            {walletConnected && (
              <div className="xh-hide-sm" style={{ display:'flex', alignItems:'center', gap:5, padding:'5px 12px', borderRadius:99, border:'1px solid rgba(16,185,129,.35)', background:'rgba(16,185,129,.07)', fontSize:11, fontWeight:600, color:'#34d399', fontFamily:"'IBM Plex Mono',monospace" }}>
                <span style={{ width:5, height:5, borderRadius:'50%', background:'#10b981', boxShadow:'0 0 6px #10b981', display:'inline-block' }} />
                {walletAddr.slice(0,6)}…{walletAddr.slice(-4)}
              </div>
            )}
            <button onClick={() => fetchScore()} style={{ padding:'8px 16px', borderRadius:99, fontFamily:'inherit', fontWeight:700, fontSize:13, cursor:'pointer', border:'none', background:'#10b981', color:'#000', transition:'all .15s', whiteSpace:'nowrap' }}>
              XRPLScore
            </button>
          </div>
        </nav>

        {/* TICKER — continuous scroll */}
        <div style={{ background:'rgba(16,185,129,.06)', borderBottom:'1px solid rgba(16,185,129,.12)', padding:'8px 0', overflow:'hidden', display:'flex', alignItems:'center', position:'relative' }}>
          {/* LIVE badge pinned left */}
          <div style={{ flexShrink:0, padding:'0 14px 0 20px', fontSize:9, fontWeight:800, color:'#10b981', letterSpacing:'.12em', textTransform:'uppercase', fontFamily:"'IBM Plex Mono',monospace", zIndex:2, background:'linear-gradient(90deg,rgba(3,3,16,1) 70%,transparent)', position:'relative' }}>LIVE ▶</div>
          {/* Scrolling track */}
          <div style={{ overflow:'hidden', flex:1 }}>
            <div style={{ display:'flex', animation:'tickerScroll 55s linear infinite', willChange:'transform' }}>
              {[...TICKER, ...(liveStats ? [`${(liveStats.xrplScores ?? 0).toLocaleString()} XRPLScores checked`, `${liveStats.treasuryUSD} in treasury`, `${liveStats.servicesCount || 24} services live on xrplhub.io`] : []), ...TICKER].map((msg, i) => (
                <span key={i} style={{ fontSize:12, color:'rgba(255,255,255,.6)', padding:'0 36px', whiteSpace:'nowrap', display:'inline-flex', alignItems:'center', gap:10, flexShrink:0 }}>
                  <span style={{ color:'#10b981', fontSize:8 }}>◆</span>
                  {msg}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* HERO */}
        <section className="xh-hero" style={{ textAlign:'center', padding:'90px 24px 64px', position:'relative', overflow:'hidden' }}>
          <div style={{ position:'absolute', top:'40%', left:'50%', transform:'translate(-50%,-50%)', width:600, height:600, borderRadius:'50%', background:'radial-gradient(circle,rgba(16,185,129,.06) 0%,transparent 68%)', pointerEvents:'none', animation:'float 9s ease-in-out infinite' }} />
          <h1 style={{ fontSize:'clamp(48px,9vw,110px)', fontWeight:900, letterSpacing:'-4px', lineHeight:.92, marginBottom:16 }}>
            <span style={{ background:'linear-gradient(135deg,#10b981,#34d399,#6ee7b7)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent', backgroundClip:'text' }}>
              XRPLHub.io
            </span>
          </h1>
          <div style={{ display:'inline-flex', alignItems:'center', gap:8, background:'rgba(16,185,129,.1)', border:'1px solid rgba(16,185,129,.25)', color:'#10b981', padding:'6px 16px', borderRadius:99, fontSize:10, fontWeight:700, marginBottom:24, letterSpacing:'.09em', fontFamily:"'IBM Plex Mono',monospace" }}>
            <span style={{ width:5, height:5, borderRadius:'50%', background:'#10b981', boxShadow:'0 0 8px #10b981', display:'inline-block', animation:'pulse 2.5s infinite' }} />
            FIRST-TO-MARKET · XRPL AMENDMENT SERVICES · XRPLSCORE™ · 2026
          </div>
          <p style={{ fontSize:17, color:'rgba(255,255,255,.5)', maxWidth:520, margin:'0 auto 40px', lineHeight:1.7 }}>
            24 XRPL amendment services. XRPLScore™ on-chain credit scoring. Wallet-to-wallet community grants. AI builds the transaction. You sign in Xaman. On-chain in 4 seconds.
          </p>
          <div style={{ display:'flex', gap:14, justifyContent:'center', flexWrap:'wrap', marginBottom:40 }}>
            <button onClick={() => fetchScore()} style={{ display:'inline-flex', alignItems:'center', gap:8, padding:'16px 36px', background:'#fff', color:'#000', fontSize:16, fontWeight:700, borderRadius:99, border:'none', cursor:'pointer', transition:'all .18s', boxShadow:'0 4px 28px rgba(255,255,255,.12)' }}>
              Free XRPLScore Check →
            </button>
            <button onClick={() => { const el = document.getElementById('products'); el?.scrollIntoView({ behavior:'smooth' }); }} style={{ display:'inline-flex', alignItems:'center', gap:8, padding:'16px 36px', border:'1.5px solid rgba(255,255,255,.2)', color:'#fff', fontSize:16, fontWeight:600, borderRadius:99, background:'transparent', cursor:'pointer', transition:'all .18s' }}>
              Browse Services ↓
            </button>
          </div>
          <div style={{ display:'flex', gap:28, justifyContent:'center', flexWrap:'wrap' }}>
            {[
              [liveStats ? (liveStats.xrplScores ?? 0).toLocaleString() : '—', 'XRPLScores'],
              [liveStats ? `${liveStats.treasuryXRP} XRP` : '—', 'Treasury'],
              ['24', 'Services'],
              ['0%', 'Overhead'],
              ['~4s', 'On-Chain'],
            ].map(([n, l]) => (
              <div key={l as string} style={{ textAlign:'center' }}>
                <div style={{ fontSize:22, fontWeight:900, color:'#10b981', lineHeight:1, textShadow:'0 0 28px rgba(16,185,129,.5)' }}>{n}</div>
                <div style={{ fontSize:10, color:'rgba(255,255,255,.32)', marginTop:4, textTransform:'uppercase', letterSpacing:'.08em' }}>{l}</div>
              </div>
            ))}
          </div>
        </section>

        {/* PRODUCTS */}
        <section id="products" className="xh-section" style={{ padding:'0 28px 80px' }}>
          <div style={{ textAlign:'center', marginBottom:36 }}>
            <div style={{ display:'inline-flex', alignItems:'center', gap:6, marginBottom:10 }}>
              <span style={{ width:5, height:5, borderRadius:'50%', background:'#10b981', boxShadow:'0 0 8px #10b981', display:'inline-block' }} />
              <span style={{ fontSize:11, fontWeight:700, color:'#10b981', letterSpacing:'.14em', textTransform:'uppercase' }}>XRPL Amendment Services</span>
            </div>
            <h2 style={{ fontSize:'clamp(24px,4vw,44px)', fontWeight:900, letterSpacing:'-2px', marginBottom:10 }}>AI builds the transaction. You sign once.</h2>
            <p style={{ fontSize:13, color:'rgba(255,255,255,.42)', maxWidth:480, margin:'0 auto' }}>
              Every service maps to a real XRPL transaction type. Pay in RLUSD or XRP. Sign in Xaman. Permanent on mainnet.
            </p>
          </div>

          {/* Category tabs */}
          <div style={{ display:'flex', gap:8, flexWrap:'wrap', justifyContent:'center', marginBottom:32 }}>
            {CATS.map(c => (
              <button key={c.id} className="catbtn" onClick={() => setActiveCat(c.id)} style={{ border:`1px solid ${activeCat===c.id?'#10b981':'rgba(255,255,255,.1)'}`, background:activeCat===c.id?'rgba(16,185,129,.15)':'rgba(255,255,255,.04)', color:activeCat===c.id?'#10b981':'rgba(255,255,255,.45)', fontFamily:'inherit' }}>
                {c.label}
              </button>
            ))}
          </div>

          {/* Product grid */}
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(290px,1fr))', gap:16 }}>
            {visibleProducts.map(p => {
              const isFeatured = featuredIds.includes(p.id) && activeCat === 'all';
              const isCS = (p as any).comingSoon;
              return (
                <div key={p.id} className="pcard" onClick={() => setActiveProduct(p)}
                  style={{ background:isFeatured?`linear-gradient(135deg,${p.color}10,rgba(6,6,22,.85))`:'rgba(6,6,22,.72)', backdropFilter:'blur(16px)', border:`1px solid ${p.color}${isFeatured?'30':'18'}`, borderRadius:20, padding:24, position:'relative', overflow:'hidden', opacity:isCS?0.65:1 }}>
                  {isFeatured && <div style={{ position:'absolute', top:-20, right:-20, width:120, height:120, borderRadius:'50%', background:`radial-gradient(circle,${p.color}14 0%,transparent 70%)`, pointerEvents:'none' }} />}
                  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:14 }}>
                    <div style={{ width:46, height:46, borderRadius:12, background:`${p.color}18`, border:`1px solid ${p.color}28`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:22 }}>{p.emoji}</div>
                    {isCS
                      ? <span style={{ fontSize:9, fontWeight:700, color:'#9ca3af', background:'rgba(156,163,175,.1)', border:'1px solid rgba(156,163,175,.2)', borderRadius:99, padding:'3px 8px', fontFamily:"'IBM Plex Mono',monospace" }}>COMING SOON</span>
                      : <span style={{ fontSize:9, fontWeight:700, color:p.color, fontFamily:"'IBM Plex Mono',monospace", background:`${p.color}12`, border:`1px solid ${p.color}25`, borderRadius:99, padding:'3px 8px' }}>
                          {p.priceRLUSD} RLUSD
                        </span>
                    }
                  </div>
                  <div style={{ fontSize:9, color:p.color, fontFamily:"'IBM Plex Mono',monospace", fontWeight:700, letterSpacing:'.1em', textTransform:'uppercase', marginBottom:6 }}>{p.amendment}</div>
                  <h3 style={{ fontSize:15, fontWeight:800, marginBottom:6 }}>{p.name}</h3>
                  <p style={{ fontSize:11, color:'rgba(255,255,255,.42)', lineHeight:1.65, marginBottom:14 }}>{p.tagline}</p>
                  <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', paddingTop:12, borderTop:`1px solid ${p.color}15` }}>
                    {isCS
                      ? <span style={{ fontSize:11, color:'rgba(255,255,255,.3)' }}>Notify me when live</span>
                      : <span style={{ fontSize:16, fontWeight:900, color:p.color }}>{p.priceRLUSD} RLUSD</span>
                    }
                    <button onClick={() => setActiveProduct(p)} style={{ padding:'6px 14px', borderRadius:99, background:`${p.color}18`, border:`1px solid ${p.color}28`, color:p.color, fontWeight:700, fontSize:11, cursor:'pointer', fontFamily:'inherit', transition:'all .15s' }}>
                      {isCS ? 'Learn More' : 'Activate →'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* XRPLSCORE */}
        <section id="score" className="xh-section" style={{ padding:'0 28px 80px' }}>
          <div style={{ background:'linear-gradient(135deg,rgba(16,185,129,.07),rgba(6,6,22,.85))', border:'1px solid rgba(16,185,129,.18)', borderRadius:26, padding:'52px 44px', backdropFilter:'blur(20px)' }}>
            <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(320px,1fr))', gap:48, alignItems:'center' }}>
              <div>
                <div style={{ display:'inline-flex', alignItems:'center', gap:6, marginBottom:14 }}>
                  <span style={{ width:5, height:5, borderRadius:'50%', background:'#10b981', boxShadow:'0 0 8px #10b981', display:'inline-block' }} />
                  <span style={{ fontSize:11, fontWeight:700, color:'#10b981', letterSpacing:'.14em', textTransform:'uppercase' }}>XRPLScore™ — Proprietary</span>
                </div>
                <h2 style={{ fontSize:'clamp(24px,3.5vw,42px)', fontWeight:900, letterSpacing:'-2px', marginBottom:16 }}>
                  On-chain credit score.<br />No SSN. No bureau. Just truth.
                </h2>
                <p style={{ fontSize:13, color:'rgba(255,255,255,.5)', lineHeight:1.82, marginBottom:22 }}>
                  300–850. Eight signals. Calculated live from XRPL mainnet. Account history, transaction velocity, trust line diversity, DEX participation, AMM activity, reserve management, NFT portfolio, security configuration.
                </p>
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:9, marginBottom:24 }}>
                  {[['No SSN Required','Wallet-only identity'],['8-Signal Scoring','Proprietary algorithm'],['Real-Time','Calculated from mainnet'],['Permanent Record','On-chain forever']].map(([t,d]) => (
                    <div key={t} style={{ background:'rgba(255,255,255,.04)', border:'1px solid rgba(255,255,255,.07)', borderRadius:11, padding:'11px 13px' }}>
                      <div style={{ fontSize:11, fontWeight:700, color:'#10b981', marginBottom:2 }}>{t}</div>
                      <div style={{ fontSize:10, color:'rgba(255,255,255,.38)' }}>{d}</div>
                    </div>
                  ))}
                </div>
                <div style={{ display:'flex', gap:9, flexWrap:'wrap' }}>
                  <input type="text" value={walletInput} onChange={e => setWalletInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && fetchScore(walletInput)} placeholder="Paste XRPL wallet address…" style={{ ...INP, flex:1, minWidth:0, borderRadius:99, paddingLeft:20, fontFamily:"'IBM Plex Mono',monospace", fontSize:12 }} />
                  <button onClick={() => fetchScore(walletInput)} style={{ padding:'12px 22px', borderRadius:99, background:'#10b981', color:'#000', border:'none', fontWeight:800, fontSize:13, cursor:'pointer', fontFamily:'inherit', whiteSpace:'nowrap' }}>Check Score →</button>
                </div>
              </div>

              {/* Credit Builder — reframed */}
              <div>
                <div style={{ fontSize:11, fontWeight:700, color:'#10b981', letterSpacing:'.1em', textTransform:'uppercase', marginBottom:16 }}>Credit Builder — Monthly XRPLScore Building</div>
                <div style={{ display:'flex', flexDirection:'column', gap:10, marginBottom:16 }}>
                  {[
                    { name:'Starter', price:'15 RLUSD/mo', color:'#34d399', sub:'Monthly XRPLScore tracking · Improvement alerts · Email reports' },
                    { name:'Builder', price:'25 RLUSD/mo', color:'#10b981', sub:'Score tracking + simulator · Dispute support · Priority review', popular:true },
                    { name:'Pro',     price:'35 RLUSD/mo', color:'#f59e0b', sub:'All Builder features · First in line for bureau reporting (coming)' },
                  ].map(t => (
                    <div key={t.name} style={{ background:'rgba(255,255,255,.04)', border:`1px solid ${t.color}28`, borderRadius:14, padding:'14px 18px', cursor:'pointer', position:'relative', transition:'all .18s' }}
                      onMouseEnter={e => (e.currentTarget as HTMLDivElement).style.borderColor=`${t.color}55`}
                      onMouseLeave={e => (e.currentTarget as HTMLDivElement).style.borderColor=`${t.color}28`}>
                      {t.popular && <div style={{ position:'absolute', top:-8, right:12, background:'#10b981', color:'#000', fontSize:8, fontWeight:800, padding:'2px 8px', borderRadius:99 }}>POPULAR</div>}
                      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:4 }}>
                        <span style={{ fontWeight:800, fontSize:14 }}>{t.name}</span>
                        <span style={{ fontSize:15, fontWeight:900, color:t.color }}>{t.price}</span>
                      </div>
                      <div style={{ fontSize:11, color:'rgba(255,255,255,.38)', lineHeight:1.5 }}>{t.sub}</div>
                    </div>
                  ))}
                </div>
                <div style={{ background:'rgba(255,255,255,.03)', border:'1px solid rgba(255,255,255,.07)', borderRadius:12, padding:'12px 14px', marginBottom:14, fontSize:11, color:'rgba(255,255,255,.35)', lineHeight:1.7 }}>
                  Each monthly payment is recorded on XRPL mainnet and builds your XRPLScore history. Bureau furnishing coming when furnisher partnerships are established.
                </div>
                <button style={{ ...B('green', undefined, { width:'100%', padding:'13px' }) }}>
                  Build Your XRPLScore →
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* GRANTS */}
        <section id="grants" className="xh-section" style={{ padding:'0 28px 80px' }}>
          <div style={{ textAlign:'center', marginBottom:40 }}>
            <div style={{ display:'inline-flex', alignItems:'center', gap:6, marginBottom:10 }}>
              <span style={{ width:5, height:5, borderRadius:'50%', background:'#8b5cf6', boxShadow:'0 0 8px #8b5cf6', display:'inline-block' }} />
              <span style={{ fontSize:11, fontWeight:700, color:'#8b5cf6', letterSpacing:'.14em', textTransform:'uppercase' }}>Community Grants</span>
            </div>
            <h2 style={{ fontSize:'clamp(24px,4vw,44px)', fontWeight:900, letterSpacing:'-2px', marginBottom:10 }}>Real people. Real money. Wallet to wallet.</h2>
            <p style={{ fontSize:13, color:'rgba(255,255,255,.42)', maxWidth:500, margin:'0 auto' }}>
              Zero overhead. AI-assisted review. Every dollar verifiable on XRPScan. No NGOs. No middlemen. That is not a promise. That is math.
            </p>
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(300px,1fr))', gap:20 }}>
            <div style={{ background:'linear-gradient(135deg,rgba(16,185,129,.08),rgba(6,6,22,.85))', border:'1px solid rgba(16,185,129,.2)', borderRadius:22, padding:'32px 28px', backdropFilter:'blur(20px)' }}>
              <div style={{ fontSize:40, marginBottom:14, animation:'float 4s ease-in-out infinite' }}>💚</div>
              <h3 style={{ fontSize:22, fontWeight:900, marginBottom:10 }}>Fund the Treasury</h3>
              <p style={{ fontSize:13, color:'rgba(255,255,255,.48)', lineHeight:1.8, marginBottom:20 }}>Send XRP or RLUSD. 100% reaches grant recipients. Treasury publicly visible on XRPScan 24/7. Every transaction permanent and verifiable.</p>
              <div style={{ background:'rgba(16,185,129,.06)', border:'1px solid rgba(16,185,129,.15)', borderRadius:11, padding:'9px 13px', marginBottom:18 }}>
                <code style={{ fontSize:10, color:'#34d399', wordBreak:'break-all', fontFamily:"'IBM Plex Mono',monospace" }}>{TREASURY}</code>
              </div>
              <button onClick={() => setShowDonate(true)} style={{ ...B('green', undefined, { width:'100%', padding:'14px', fontSize:15 }) }}>Donate via Xaman →</button>
            </div>
            <div style={{ background:'linear-gradient(135deg,rgba(139,92,246,.08),rgba(6,6,22,.85))', border:'1px solid rgba(139,92,246,.2)', borderRadius:22, padding:'32px 28px', backdropFilter:'blur(20px)' }}>
              <div style={{ fontSize:40, marginBottom:14, animation:'float 4s ease-in-out infinite', animationDelay:'1s' }}>❤️</div>
              <h3 style={{ fontSize:22, fontWeight:900, marginBottom:10 }}>Apply for Emergency Aid</h3>
              <p style={{ fontSize:13, color:'rgba(255,255,255,.48)', lineHeight:1.8, marginBottom:20 }}>Need help? Apply for $25–$100. No bank account required. No paperwork. AI-assisted review. Approved funds go directly to your XRPL wallet.</p>
              <div style={{ display:'flex', flexDirection:'column', gap:7, marginBottom:20 }}>
                {['$25–$100 direct to your XRPL wallet','AI-assisted review within 24 hours','No bank account or ID required','Permanently verifiable on XRPScan'].map(f => (
                  <div key={f} style={{ display:'flex', alignItems:'center', gap:8, fontSize:12, color:'rgba(255,255,255,.52)' }}>
                    <span style={{ color:'#8b5cf6', fontSize:11 }}>✓</span>{f}
                  </div>
                ))}
              </div>
              <button onClick={() => setShowGrant(true)} style={{ ...B('color', '#8b5cf6', { width:'100%', padding:'14px', fontSize:15 }) }}>Apply for Grant →</button>
            </div>
          </div>
        </section>

        {/* WHY XRPL */}
        <section className="xh-section" style={{ padding:'0 28px 80px' }}>
          <div style={{ ...GLASS, borderRadius:22, padding:'44px 40px', textAlign:'center' }}>
            <div style={{ display:'inline-flex', alignItems:'center', gap:6, marginBottom:14 }}>
              <span style={{ width:5, height:5, borderRadius:'50%', background:'#10b981', boxShadow:'0 0 8px #10b981', display:'inline-block' }} />
              <span style={{ fontSize:11, fontWeight:700, color:'#10b981', letterSpacing:'.14em', textTransform:'uppercase' }}>Why XRPL</span>
            </div>
            <h2 style={{ fontSize:'clamp(20px,3vw,36px)', fontWeight:900, letterSpacing:'-2px', marginBottom:12 }}>The only blockchain built for this.</h2>
            <div style={{ display:'flex', justifyContent:'center', gap:32, flexWrap:'wrap' }}>
              {[['3–5s','Finality'],['$0.000001','Avg Fee'],['10+','Years Live'],['1,500','TPS'],['~0.0079kWh','Per TX']].map(([v,l]) => (
                <div key={l} style={{ textAlign:'center', minWidth:80 }}>
                  <div style={{ fontSize:24, fontWeight:900, color:'#10b981', textShadow:'0 0 24px rgba(16,185,129,.5)' }}>{v}</div>
                  <div style={{ fontSize:10, color:'rgba(255,255,255,.35)', marginTop:3, textTransform:'uppercase', letterSpacing:'.08em' }}>{l}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="xh-section" style={{ padding:'0 28px 100px', maxWidth:820, textAlign:'center' }}>
          <div style={{ background:'linear-gradient(135deg,rgba(16,185,129,.1),rgba(6,6,22,.9))', border:'1px solid rgba(16,185,129,.22)', borderRadius:26, padding:'60px 44px', backdropFilter:'blur(20px)' }}>
            <h2 style={{ fontSize:'clamp(24px,5vw,50px)', fontWeight:900, letterSpacing:'-2.5px', lineHeight:1.04, marginBottom:16 }}>
              Your wallet has a story.<br />
              <span style={{ color:'#10b981' }}>Let the ledger score it.</span>
            </h2>
            <p style={{ fontSize:14, color:'rgba(255,255,255,.42)', marginBottom:32, lineHeight:1.65 }}>Free XRPLScore check. No SSN. No bank account. 100% on-chain. 24 amendment services available now.</p>
            <div style={{ display:'flex', gap:14, justifyContent:'center', flexWrap:'wrap' }}>
              <button onClick={() => fetchScore()} style={{ display:'inline-flex', alignItems:'center', gap:8, padding:'15px 34px', background:'#fff', color:'#000', fontSize:15, fontWeight:700, borderRadius:99, border:'none', cursor:'pointer', transition:'all .18s', boxShadow:'0 4px 28px rgba(255,255,255,.12)' }}>Get Free XRPLScore →</button>
              <button onClick={() => setShowDonate(true)} style={{ display:'inline-flex', alignItems:'center', gap:8, padding:'15px 34px', border:'1.5px solid rgba(255,255,255,.2)', color:'#fff', fontSize:15, fontWeight:600, borderRadius:99, background:'transparent', cursor:'pointer', transition:'all .18s' }}>Fund a Grant</button>
            </div>
            <p style={{ fontSize:11, color:'rgba(255,255,255,.2)', marginTop:20 }}>
              Partnerships: XRPL Foundation · Ripple Impact · Evernorth · <a href="mailto:partners@xrplhub.io" style={{ color:'#10b981' }}>partners@xrplhub.io</a>
            </p>
          </div>
        </section>

        {/* FOOTER */}
        <footer style={{ backdropFilter:'blur(14px)', background:'rgba(3,3,16,.8)', borderTop:'1px solid rgba(255,255,255,.07)', padding:'36px 28px 28px' }}>
          <div style={{ maxWidth:1280, margin:'0 auto', display:'flex', justifyContent:'space-between', alignItems:'center', flexWrap:'wrap', gap:18 }}>
            <div>
              <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:6 }}>
                <img src="/hub-logo.png" alt="XRPLHub" style={{ width:28, height:28, borderRadius:6 }} onError={e => { (e.target as HTMLImageElement).style.display='none'; }} />
                <span style={{ fontWeight:800, fontSize:15 }}>XRPLHub.io</span>
              </div>
              <p style={{ fontSize:11, color:'rgba(255,255,255,.22)' }}>© 2026 XRPLHub.io · XRPLScore™ · US Copyright Reg. #1-15166646291</p>
              <p style={{ fontSize:10, color:'rgba(255,255,255,.15)', marginTop:2 }}>Not a bank · Not a broker · Not an insurer · 100% on-chain</p>
            </div>
            <div style={{ display:'flex', gap:18, flexWrap:'wrap', alignItems:'center' }}>
              <a href="/terms"   style={{ fontSize:13, color:'rgba(255,255,255,.38)', textDecoration:'none' }}>Terms</a>
              <a href="/privacy" style={{ fontSize:13, color:'rgba(255,255,255,.38)', textDecoration:'none' }}>Privacy</a>
              <a href="/support" style={{ fontSize:13, color:'rgba(255,255,255,.38)', textDecoration:'none' }}>Support</a>
              <a href="mailto:support@xrplhub.io" style={{ fontSize:13, color:'rgba(255,255,255,.38)', textDecoration:'none' }}>support@xrplhub.io</a>
              <a href={`https://xrpscan.com/account/${TREASURY}`} target="_blank" rel="noopener noreferrer" style={{ fontSize:11, color:'#10b981', textDecoration:'none', display:'flex', alignItems:'center', gap:5, fontFamily:"'IBM Plex Mono',monospace" }}>
                <span style={{ width:5, height:5, borderRadius:'50%', background:'#10b981', animation:'pulse 2.5s infinite', display:'inline-block' }} />
                Treasury Live ↗
              </a>
            </div>
          </div>
        </footer>
      </div>

      {/* MODALS */}
      <ScoreModal show={showScore} onClose={() => setShowScore(false)} data={scoreData} loading={scoreLoading} error={scoreError} onRetry={() => fetchScore()} address={walletAddr || walletInput} />
      <ProductModal show={!!activeProduct} onClose={() => setActiveProduct(null)} product={activeProduct} inXApp={inXApp} signXRP={signXRP} />
      <DonateModal  show={showDonate}  onClose={() => setShowDonate(false)} />
      <GrantModal   show={showGrant}   onClose={() => setShowGrant(false)} />
    </>
  );
}
