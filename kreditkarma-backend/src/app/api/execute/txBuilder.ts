// src/app/api/execute/txBuilder.ts
// The autonomous execution brain. Maps each productId to the exact XRPL
// transaction the CUSTOMER signs in Xaman to receive their service.
//
// SAFETY TIERS:
//   'safe'      → additive or reversible; auto-builds, no special warning
//   'caution'   → can misconfigure account access; sellable but UI must show a hard warning gate
//   'blocked'   → irreversible account-killers; never auto-built (returns error)
//
// Every builder returns a txjson object for the customer's own wallet.
// Params come from the customer (validated here). Never trust raw input.

export type SafetyTier = 'safe' | 'caution' | 'blocked';

export interface BuildResult {
  ok: boolean;
  txjson?: Record<string, unknown>;
  tier?: SafetyTier;
  label?: string;
  error?: string;
  needsParams?: string[]; // params we required but didn't get
}

interface Params { [k: string]: string | number | boolean | undefined }

const str = (v: unknown) => (v === undefined || v === null ? '' : String(v)).trim();
const isAddr = (v: string) => v.startsWith('r') && v.length >= 25 && v.length <= 35;
const xrpToDrops = (xrp: number) => String(Math.round(xrp * 1_000_000));

// ── Per-product builders ──────────────────────────────────────────────
// account = the customer's own wallet (the signer)
type Builder = (account: string, p: Params) => BuildResult;

const SAFE = (txjson: Record<string, unknown>, label: string): BuildResult => ({ ok: true, txjson, tier: 'safe', label });
const CAUTION = (txjson: Record<string, unknown>, label: string): BuildResult => ({ ok: true, txjson, tier: 'caution', label });
const NEED = (needsParams: string[]): BuildResult => ({ ok: false, error: 'missing required parameters', needsParams });
const BAD = (error: string): BuildResult => ({ ok: false, error });
const BLOCKED = (error: string): BuildResult => ({ ok: false, tier: 'blocked', error });

const builders: Record<string, Builder> = {

  // ── WALLET SECURITY ───────────────────────────────────────────────
  multisig: (account, p) => {
    // SignerListSet — caution: a bad quorum can lock the account
    const signers = str(p.signers); // comma-separated addresses
    const quorum = Number(p.quorum);
    if (!signers || !quorum) return NEED(['signers', 'quorum']);
    const list = signers.split(',').map(s => s.trim()).filter(Boolean);
    if (list.length < 1 || list.some(a => !isAddr(a))) return BAD('invalid signer address list');
    if (quorum < 1) return BAD('quorum must be at least 1');
    return CAUTION({
      TransactionType: 'SignerListSet',
      Account: account,
      SignerQuorum: quorum,
      SignerEntries: list.map(a => ({ SignerEntry: { Account: a, SignerWeight: 1 } })),
    }, 'Multi-Sig (SignerListSet)');
  },
  regkey: (account, p) => {
    // SetRegularKey — caution: master key still works unless later disabled
    const key = str(p.regularKey);
    if (!key || !isAddr(key)) return NEED(['regularKey']);
    return CAUTION({ TransactionType: 'SetRegularKey', Account: account, RegularKey: key }, 'Set Regular Key');
  },
  depositauth: (account) => SAFE({ TransactionType: 'AccountSet', Account: account, SetFlag: 9 }, 'Enable Deposit Auth'), // asfDepositAuth
  desttag: (account) => SAFE({ TransactionType: 'AccountSet', Account: account, SetFlag: 1 }, 'Require Destination Tag'), // asfRequireDest
  lockdown: () => BLOCKED('XRP Lockdown disables the master key and can permanently lock you out of your account. For your protection, this cannot be auto-executed. Contact support@xrplhub.io for a guided, manual process.'),

  // ── TOKEN ISSUER ──────────────────────────────────────────────────
  issuerdecl: (account) => SAFE({ TransactionType: 'AccountSet', Account: account, SetFlag: 8 }, 'Default Ripple (issuer)'), // asfDefaultRipple
  tokenfee: (account, p) => {
    const fee = Number(p.transferFee); // 0..1000000000 (0%..100% as billionths over 1e9 base); UI passes percent
    if (p.transferFee === undefined) return NEED(['transferFee']);
    // percent → TransferRate: 1.0 + pct/100, expressed as integer billionths
    const rate = Math.round((1 + Number(fee) / 100) * 1_000_000_000);
    if (rate < 1_000_000_000 || rate > 2_000_000_000) return BAD('transfer fee must be between 0% and 100%');
    return SAFE({ TransactionType: 'AccountSet', Account: account, TransferRate: rate }, 'Set Transfer Fee');
  },
  issuercfg: (account) => SAFE({ TransactionType: 'AccountSet', Account: account, SetFlag: 8 }, 'Issuer Config (Default Ripple)'),
  trustline: (account, p) => {
    const issuer = str(p.issuer), currency = str(p.currency), limit = str(p.limit || '1000000000');
    if (!issuer || !currency) return NEED(['issuer', 'currency']);
    if (!isAddr(issuer)) return BAD('invalid issuer address');
    return SAFE({ TransactionType: 'TrustSet', Account: account, LimitAmount: { currency, issuer, value: limit } }, 'Set Trust Line');
  },
  rippling: (account, p) => {
    const enable = str(p.enable) !== 'false';
    return SAFE({ TransactionType: 'AccountSet', Account: account, [enable ? 'ClearFlag' : 'SetFlag']: 8 }, 'Rippling Control');
  },
  mptissue: (account, p) => {
    const max = str(p.maximumAmount || '1000000000');
    const scale = Number(p.assetScale || 0);
    return SAFE({
      TransactionType: 'MPTokenIssuanceCreate',
      Account: account,
      MaximumAmount: max,
      AssetScale: scale,
      Flags: 0x0000002, // tfMPTCanTransfer
    }, 'Issue Multi-Purpose Token');
  },
  mptsend: (account, p) => {
    const dest = str(p.destination), issuanceId = str(p.mptIssuanceId), amount = str(p.amount);
    if (!dest || !issuanceId || !amount) return NEED(['destination', 'mptIssuanceId', 'amount']);
    if (!isAddr(dest)) return BAD('invalid destination address');
    return SAFE({ TransactionType: 'Payment', Account: account, Destination: dest, Amount: { mpt_issuance_id: issuanceId, value: amount } }, 'Send MPT');
  },
  trustsend: (account, p) => {
    const issuer = str(p.issuer), currency = str(p.currency), limit = str(p.limit || '1000000000');
    if (!issuer || !currency) return NEED(['issuer', 'currency']);
    if (!isAddr(issuer)) return BAD('invalid issuer address');
    // First leg: the trust line. (Sending currency is a separate signed Payment step.)
    return SAFE({ TransactionType: 'TrustSet', Account: account, LimitAmount: { currency, issuer, value: limit } }, 'Trust Line + Send (step 1: TrustSet)');
  },
  globalfreeze: (account) => SAFE({ TransactionType: 'AccountSet', Account: account, SetFlag: 7 }, 'Global Freeze (asfGlobalFreeze)'), // asfGlobalFreeze=7
  freezeline: (account, p) => {
    const issuer = str(p.holder), currency = str(p.currency);
    if (!issuer || !currency) return NEED(['holder', 'currency']);
    if (!isAddr(issuer)) return BAD('invalid holder address');
    return SAFE({ TransactionType: 'TrustSet', Account: account, LimitAmount: { currency, issuer, value: '0' }, Flags: 0x00100000 }, 'Freeze Trust Line (tfSetFreeze)');
  },

  // ── DEFI ──────────────────────────────────────────────────────────
  dexorder: (account, p) => {
    const getsCur = str(p.takerGetsCurrency), getsVal = str(p.takerGetsValue), getsIss = str(p.takerGetsIssuer);
    const paysCur = str(p.takerPaysCurrency), paysVal = str(p.takerPaysValue), paysIss = str(p.takerPaysIssuer);
    if (!getsVal || !paysVal) return NEED(['takerGetsValue', 'takerPaysValue']);
    const gets = getsCur === 'XRP' || !getsCur ? xrpToDrops(Number(getsVal)) : { currency: getsCur, issuer: getsIss, value: getsVal };
    const pays = paysCur === 'XRP' || !paysCur ? xrpToDrops(Number(paysVal)) : { currency: paysCur, issuer: paysIss, value: paysVal };
    return SAFE({ TransactionType: 'OfferCreate', Account: account, TakerGets: gets, TakerPays: pays }, 'DEX Order (OfferCreate)');
  },
  dextrade: (account, p) => builders.dexorder(account, p),
  ammlaunch: (account, p) => {
    const aCur = str(p.assetCurrency), aVal = str(p.assetValue), aIss = str(p.assetIssuer);
    const bCur = str(p.asset2Currency), bVal = str(p.asset2Value), bIss = str(p.asset2Issuer);
    if (!aVal || !bVal) return NEED(['assetValue', 'asset2Value']);
    const a = aCur === 'XRP' || !aCur ? xrpToDrops(Number(aVal)) : { currency: aCur, issuer: aIss, value: aVal };
    const b = bCur === 'XRP' || !bCur ? xrpToDrops(Number(bVal)) : { currency: bCur, issuer: bIss, value: bVal };
    return SAFE({ TransactionType: 'AMMCreate', Account: account, Amount: a, Amount2: b, TradingFee: Number(p.tradingFee || 500) }, 'Create AMM Pool');
  },
  ammentry: (account, p) => {
    const aCur = str(p.assetCurrency), aIss = str(p.assetIssuer);
    const bCur = str(p.asset2Currency), bIss = str(p.asset2Issuer);
    const aVal = str(p.assetValue), bVal = str(p.asset2Value);
    if (!aVal || !bVal) return NEED(['assetValue', 'asset2Value']);
    const a = aCur === 'XRP' || !aCur ? xrpToDrops(Number(aVal)) : { currency: aCur, issuer: aIss, value: aVal };
    const b = bCur === 'XRP' || !bCur ? xrpToDrops(Number(bVal)) : { currency: bCur, issuer: bIss, value: bVal };
    return SAFE({ TransactionType: 'AMMDeposit', Account: account, Amount: a, Amount2: b, Flags: 0x00100000 }, 'AMM Liquidity Deposit');
  },
  smartswap: (account, p) => builders.dexorder(account, p),
  paychannel: (account, p) => {
    const dest = str(p.destination), amount = str(p.amount), pubkey = str(p.publicKey);
    if (!dest || !amount || !pubkey) return NEED(['destination', 'amount', 'publicKey']);
    if (!isAddr(dest)) return BAD('invalid destination address');
    return SAFE({ TransactionType: 'PaymentChannelCreate', Account: account, Destination: dest, Amount: xrpToDrops(Number(amount)), SettleDelay: Number(p.settleDelay || 86400), PublicKey: pubkey }, 'Create Payment Channel');
  },
  tickets: (account, p) => {
    const count = Number(p.ticketCount || 1);
    if (count < 1 || count > 250) return BAD('ticket count must be 1–250');
    return SAFE({ TransactionType: 'TicketCreate', Account: account, TicketCount: count }, 'Create Tickets');
  },

  // ── NFT ───────────────────────────────────────────────────────────
  nftmint: (account, p) => {
    const uri = str(p.uri);
    const royalty = Number(p.royalty || 0); // percent
    if (!uri) return NEED(['uri']);
    const transferFee = Math.round(royalty * 1000); // percent → 0..50000 (XRPL NFT fee is in 1/100,000)
    if (transferFee < 0 || transferFee > 50000) return BAD('royalty must be 0–50%');
    const uriHex = Buffer.from(uri, 'utf8').toString('hex').toUpperCase();
    return SAFE({ TransactionType: 'NFTokenMint', Account: account, URI: uriHex, NFTokenTaxon: Number(p.taxon || 0), TransferFee: transferFee, Flags: 8 }, 'Mint NFT'); // tfTransferable
  },
  nftburn: (account, p) => {
    const id = str(p.nftokenId);
    if (!id) return NEED(['nftokenId']);
    return SAFE({ TransactionType: 'NFTokenBurn', Account: account, NFTokenID: id }, 'Burn NFT');
  },
  nftoffer: (account, p) => {
    const id = str(p.nftokenId), amount = str(p.amount);
    if (!id || !amount) return NEED(['nftokenId', 'amount']);
    return SAFE({ TransactionType: 'NFTokenCreateOffer', Account: account, NFTokenID: id, Amount: xrpToDrops(Number(amount)), Flags: 1 }, 'Create NFT Sell Offer'); // tfSellNFToken
  },

  // ── PAYMENTS ──────────────────────────────────────────────────────
  checkcreate: (account, p) => {
    const dest = str(p.destination), amount = str(p.amount);
    if (!dest || !amount) return NEED(['destination', 'amount']);
    if (!isAddr(dest)) return BAD('invalid destination address');
    return SAFE({ TransactionType: 'CheckCreate', Account: account, Destination: dest, SendMax: xrpToDrops(Number(amount)) }, 'Create Check');
  },
  checkcash: (account, p) => {
    const checkId = str(p.checkId), amount = str(p.amount);
    if (!checkId || !amount) return NEED(['checkId', 'amount']);
    return SAFE({ TransactionType: 'CheckCash', Account: account, CheckID: checkId, Amount: xrpToDrops(Number(amount)) }, 'Cash Check');
  },
  checkcancel: (account, p) => {
    const checkId = str(p.checkId);
    if (!checkId) return NEED(['checkId']);
    return SAFE({ TransactionType: 'CheckCancel', Account: account, CheckID: checkId }, 'Cancel Check');
  },
  desttagreq: (account) => SAFE({ TransactionType: 'AccountSet', Account: account, SetFlag: 1 }, 'Require Destination Tags'),
  escrow: (account, p) => {
    const dest = str(p.destination), amount = str(p.amount), finishAfter = Number(p.finishAfter);
    if (!dest || !amount || !finishAfter) return NEED(['destination', 'amount', 'finishAfter']);
    if (!isAddr(dest)) return BAD('invalid destination address');
    return SAFE({ TransactionType: 'EscrowCreate', Account: account, Destination: dest, Amount: xrpToDrops(Number(amount)), FinishAfter: finishAfter }, 'Create Escrow');
  },

  // ── IDENTITY / COMPLIANCE ─────────────────────────────────────────
  identity: (account, p) => {
    const data = str(p.data);
    if (!data) return NEED(['data']);
    const hex = Buffer.from(data, 'utf8').toString('hex').toUpperCase();
    return SAFE({ TransactionType: 'AccountSet', Account: account, Domain: hex }, 'Set On-Chain Identity (Domain)');
  },
  did: (account, p) => {
    const uri = str(p.uri);
    if (!uri) return NEED(['uri']);
    const hex = Buffer.from(uri, 'utf8').toString('hex').toUpperCase();
    return SAFE({ TransactionType: 'DIDSet', Account: account, URI: hex }, 'Create / Update DID');
  },
  compliance: (account) => SAFE({ TransactionType: 'AccountSet', Account: account, SetFlag: 1 }, 'Compliance Bundle (Require Dest Tag)'),
  credentialissue: (account, p) => {
    const subject = str(p.subject), credType = str(p.credentialType);
    if (!subject || !credType) return NEED(['subject', 'credentialType']);
    if (!isAddr(subject)) return BAD('invalid subject address');
    const typeHex = Buffer.from(credType, 'utf8').toString('hex').toUpperCase();
    return SAFE({ TransactionType: 'CredentialCreate', Account: account, Subject: subject, CredentialType: typeHex }, 'Issue Credential');
  },
  permdomain: (account, p) => {
    const credType = str(p.credentialType), issuer = str(p.acceptedIssuer || account);
    if (!credType) return NEED(['credentialType']);
    const typeHex = Buffer.from(credType, 'utf8').toString('hex').toUpperCase();
    return SAFE({ TransactionType: 'PermissionedDomainSet', Account: account, AcceptedCredentials: [{ Credential: { Issuer: issuer, CredentialType: typeHex } }] }, 'Set Permissioned Domain');
  },
};

export function buildServiceTx(productId: string, account: string, params: Params): BuildResult {
  if (!isAddr(account)) return BAD('invalid signer wallet address');
  const b = builders[productId];
  if (!b) return BAD(`product "${productId}" has no execution builder yet`);
  return b(account, params);
}

// Quick lookup for the frontend: which params each product needs, and its tier.
export function productMeta(productId: string): { needsParams: string[]; tier: SafetyTier } {
  const probe = builders[productId]?.('rEXAMPLE0000000000000000000000000', {});
  if (!probe) return { needsParams: [], tier: 'safe' };
  if (probe.tier === 'blocked') return { needsParams: [], tier: 'blocked' };
  return { needsParams: probe.needsParams || [], tier: (probe.tier as SafetyTier) || 'safe' };
}
