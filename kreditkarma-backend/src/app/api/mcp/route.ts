// src/app/api/mcp/route.ts
// ═══════════════════════════════════════════════════════════════════════════
// XRPLHub MCP Server — the three pillars of XRPLHub as AI-agent tools.
//
// Compatible with:
//   • Claude Desktop   → add to claude_desktop_config.json
//   • Claude Code      → claude mcp add xrplhub --url https://www.xrplhub.io/api/mcp
//   • XRPL AI Starter Kit (Ripple/Anthropic, 2026)
//   • Any MCP-compatible agent framework
//
// Implements MCP Streamable HTTP transport (spec 2024-11-05).
// Stateless — zero new infrastructure, runs on Vercel as a standard serverless fn.
// No new npm packages required.
//
// THREE TOOLS:
//   1. check_xrpl_score        — XRPLScore™ reputation check (read-only, instant)
//   2. build_xrpl_transaction  — all 35 done-for-you XRPL services → tx JSON
//   3. submit_grant_application — community grants wallet-to-wallet
//
// © 2026 XRPLHub.io · XRPLScore™ · All Rights Reserved
// ═══════════════════════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from 'next/server';
import { buildServiceTx } from '@/app/api/execute/txBuilder';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://www.xrplhub.io';

// ─── CORS HEADERS (agents call from anywhere) ────────────────────────────────
const CORS = {
  'Access-Control-Allow-Origin':  '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Content-Type': 'application/json',
};

// ─── TOOL DEFINITIONS (descriptions are the marketing copy to the AI) ────────
// The AI reads these descriptions and decides WHEN to call each tool.
// Write them to match the exact questions agents are asked.
const TOOLS = [
  {
    name: 'check_xrpl_score',
    description:
      'Check the XRPLScore™ of any XRP Ledger wallet. Returns a 300–850 on-chain ' +
      'reputation score computed from 9 signals: account age, payment history, trust line ' +
      'diversity, DEX activity, AMM liquidity provision, reserve health, NFT portfolio, ' +
      'security configuration, and builder commitment to XRPLHub. ' +
      'Use this tool BEFORE any transaction, payment, loan, DeFi interaction, or counterparty ' +
      'assessment on XRPL. No API key, no SSN, no credit bureau — 100% public ledger data. ' +
      'Also returns personalized recommendations to raise the score and a peer percentile ' +
      'ranking among all scanned XRPL wallets.',
    inputSchema: {
      type: 'object',
      properties: {
        wallet_address: {
          type: 'string',
          description: 'XRP Ledger wallet address (starts with r, 25–35 characters)',
        },
      },
      required: ['wallet_address'],
    },
  },
  {
    name: 'build_xrpl_transaction',
    description:
      'Build any of 35 done-for-you XRPL transaction types — no coding required. ' +
      'Returns the exact transaction JSON ready for the wallet owner to sign in Xaman. ' +
      'Supports: write a check (checkcreate), cash a check (checkcash), cancel a check (checkcancel), ' +
      'time-lock funds in escrow (escrow), set a trust line (trustline), receive issued currency (trustsend), ' +
      'mint an NFT with royalties (nftmint), sell an NFT (nftoffer), burn an NFT (nftburn), ' +
      'place a DEX order (dexorder / dextrade / smartswap), ' +
      'launch an AMM pool (ammlaunch), add AMM liquidity (ammentry), ' +
      'issue a multi-purpose token (mptissue), send MPT (mptsend), ' +
      'set up multi-sig (multisig), set a regular key (regkey), ' +
      'declare token issuer defaults (issuerdecl / issuercfg), set transfer fee (tokenfee), ' +
      'control rippling (rippling), global freeze (globalfreeze), freeze trust line (freezeline), ' +
      'set on-chain identity / domain (identity), create a DID (did), ' +
      'issue a credential (credentialissue), set permissioned domain (permdomain), ' +
      'enable deposit auth (depositauth), require destination tags (desttag / desttagreq), ' +
      'open a payment channel (paychannel), create tickets (tickets), compliance bundle (compliance). ' +
      'IMPORTANT: this tool builds the transaction payload only. The wallet holder must sign it ' +
      'with their own Xaman wallet — never sign on behalf of a user.',
    inputSchema: {
      type: 'object',
      properties: {
        product_id: {
          type: 'string',
          description:
            'Service identifier (one of): checkcreate, checkcash, checkcancel, escrow, ' +
            'trustline, trustsend, nftmint, nftburn, nftoffer, dexorder, dextrade, smartswap, ' +
            'ammlaunch, ammentry, mptissue, mptsend, multisig, regkey, depositauth, desttag, ' +
            'desttagreq, issuerdecl, issuercfg, tokenfee, rippling, globalfreeze, freezeline, ' +
            'identity, did, credentialissue, permdomain, paychannel, tickets, compliance',
        },
        wallet_address: {
          type: 'string',
          description: 'XRPL wallet address of the account that will sign the transaction',
        },
        params: {
          type: 'object',
          description:
            'Transaction parameters. Required fields vary by service. Examples: ' +
            'checkcreate → { destination: "rXXX", amount: "10" } | ' +
            'escrow → { destination: "rXXX", amount: "25", finishAfter: 86400 } | ' +
            'nftmint → { uri: "https://...", royalty: 5, taxon: 0 } | ' +
            'trustline → { issuer: "rXXX", currency: "USD", limit: "1000000" } | ' +
            'multisig → { signers: "rAAA,rBBB", quorum: 2 } | ' +
            'dexorder → { takerGetsValue: "10", takerPaysCurrency: "USD", takerPaysValue: "10", takerPaysIssuer: "rXXX" } | ' +
            'identity → { data: "xrplhub.io" } | ' +
            'mptissue → { maximumAmount: "1000000000", assetScale: 2 }',
        },
      },
      required: ['product_id', 'wallet_address'],
    },
  },
  {
    name: 'submit_grant_application',
    description:
      'Submit a community grant application to the XRPLHub on-chain treasury. ' +
      'Grants go directly wallet-to-wallet — no NGO, no overhead, no middleman. ' +
      'AI reviews every application and a human approves within 24 hours. ' +
      'If approved, funds are sent in RLUSD directly to the applicant\'s XRPL wallet. ' +
      'Use this to help someone apply for emergency financial assistance — rent, food, medical, ' +
      'utilities, transport, or other urgent needs. ' +
      'This tool is especially valuable for people without access to traditional banking or ' +
      'government grant systems. The process takes minutes, not months. ' +
      'Maximum grant amount is 100 RLUSD (≈ $100 USD). Treasury availability varies.',
    inputSchema: {
      type: 'object',
      properties: {
        wallet_address: {
          type: 'string',
          description: 'XRPL wallet address where the grant will be sent if approved',
        },
        category: {
          type: 'string',
          description: 'Grant category: RENT, UTILITIES, GROCERIES, MEDICAL, TRANSPORT, CHILDCARE, or OTHER',
        },
        amount: {
          type: 'number',
          description: 'Amount requested in RLUSD (1–100)',
        },
        description: {
          type: 'string',
          description:
            'Clear description of the need, situation, and urgency (2–4 sentences). ' +
            'Be specific — vague applications score lower in AI review.',
        },
        currency: {
          type: 'string',
          description: 'Payout currency. Default and recommended: RLUSD',
        },
      },
      required: ['wallet_address', 'category', 'amount', 'description'],
    },
  },
];

// ─── TOOL IMPLEMENTATIONS ─────────────────────────────────────────────────────

async function toolCheckXrplScore(
  args: Record<string, unknown>
): Promise<string> {
  const wallet = String(args.wallet_address || '').trim();
  if (!wallet.startsWith('r') || wallet.length < 25 || wallet.length > 35) {
    return JSON.stringify({ error: 'Invalid XRPL wallet address. Must start with r and be 25–35 characters.' });
  }
  try {
    const res = await fetch(
      `${API_URL}/api/score/${encodeURIComponent(wallet)}`,
      { signal: AbortSignal.timeout(15_000) }
    );
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      return JSON.stringify({ error: (err as { error?: string }).error || `Score lookup failed (HTTP ${res.status})` });
    }
    const d = await res.json();
    return JSON.stringify({
      wallet,
      xrplScore:      d.ledgerScore,
      grade:          d.grade,
      percentile:     d.percentile,
      percentileLabel: d.percentileLabel,
      breakdown: (d.breakdown || []).map((b: { label: string; score: number; weight: string; desc: string }) => ({
        signal:      b.label,
        score:       b.score,
        weight:      b.weight,
        description: b.desc,
      })),
      topRecommendations: (d.recommendations || []).slice(0, 3).map(
        (r: { action: string; points: string; priority: string }) => ({
          action:   r.action,
          impact:   r.points,
          priority: r.priority,
        })
      ),
      details: {
        accountAgeDays:   d.details?.accountAgeDays,
        transactionCount: d.details?.txCount,
        balanceXRP:       d.details?.balanceXRP,
        trustLines:       d.details?.trustLineCount,
        hasMultiSig:      d.details?.hasMultiSig,
        builderPayments:  d.details?.builderPayments,
      },
      methodology: d.methodology,
      scannedAt:   d.scannedAt,
      poweredBy:   'XRPLHub.io — XRPLScore™ © 2026',
    }, null, 2);
  } catch (e) {
    return JSON.stringify({ error: `Score fetch failed: ${e instanceof Error ? e.message : 'unknown'}` });
  }
}

async function toolBuildXrplTransaction(
  args: Record<string, unknown>
): Promise<string> {
  const productId = String(args.product_id || '').trim();
  const wallet    = String(args.wallet_address || '').trim();
  const params    = (args.params as Record<string, string | number | boolean | undefined>) || {};

  if (!wallet.startsWith('r') || wallet.length < 25 || wallet.length > 35) {
    return JSON.stringify({ error: 'Invalid XRPL wallet address.' });
  }
  if (!productId) {
    return JSON.stringify({ error: 'product_id is required. See tool description for valid options.' });
  }

  try {
    const result = buildServiceTx(productId, wallet, params);
    if (!result.ok) {
      return JSON.stringify({
        error:        result.error || 'Transaction build failed',
        missingParams: result.needsParams || [],
        hint: result.needsParams?.length
          ? `Provide these params and try again: ${result.needsParams.join(', ')}`
          : 'Check the product_id is valid and try again.',
      });
    }
    if (result.tier === 'blocked') {
      return JSON.stringify({
        error: result.error,
        safetyTier: 'blocked',
        reason: 'This operation is disabled for safety — it can permanently lock account access.',
      });
    }
    return JSON.stringify({
      success:     true,
      product:     productId,
      label:       result.label,
      safetyTier:  result.tier,
      transaction: result.txjson,
      signingInstructions:
        'Present this transaction object to the wallet holder. They must sign it ' +
        'using their Xaman wallet — the transaction cannot be submitted without ' +
        'their cryptographic signature. Never sign on behalf of a user.',
      poweredBy: 'XRPLHub.io — 35 Done-For-You XRPL Services © 2026',
    }, null, 2);
  } catch (e) {
    return JSON.stringify({ error: `Build failed: ${e instanceof Error ? e.message : 'unknown'}` });
  }
}

async function toolSubmitGrantApplication(
  args: Record<string, unknown>
): Promise<string> {
  const wallet   = String(args.wallet_address || '').trim();
  const category = String(args.category      || '').trim().toUpperCase();
  const amount   = Number(args.amount        || 0);
  const desc     = String(args.description   || '').trim();
  const currency = String(args.currency      || 'RLUSD').trim();

  const VALID_CATS = ['RENT','UTILITIES','GROCERIES','MEDICAL','TRANSPORT','CHILDCARE','OTHER'];

  if (!wallet.startsWith('r') || wallet.length < 25 || wallet.length > 35) {
    return JSON.stringify({ error: 'Invalid XRPL wallet address.' });
  }
  if (!VALID_CATS.includes(category)) {
    return JSON.stringify({ error: `Invalid category. Must be one of: ${VALID_CATS.join(', ')}` });
  }
  if (amount <= 0 || amount > 100) {
    return JSON.stringify({ error: 'Amount must be between 1 and 100 RLUSD.' });
  }
  if (!desc || desc.length < 20) {
    return JSON.stringify({ error: 'Description too short. Provide at least 20 characters explaining the need.' });
  }

  try {
    const res = await fetch(`${API_URL}/api/grants/submit`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({
        wallet,
        category,
        amount,
        currency,
        need: desc,
        name: 'AI-assisted application via XRPLHub MCP',
      }),
      signal: AbortSignal.timeout(12_000),
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok || (data as { error?: string }).error) {
      return JSON.stringify({ error: (data as { error?: string }).error || 'Submission failed' });
    }

    return JSON.stringify({
      success:         true,
      grantId:         (data as { id?: string }).id,
      status:          (data as { status?: string }).status,
      walletAddress:   wallet,
      amountRequested: `${amount} ${currency}`,
      category,
      nextSteps:
        'Application submitted. AI review begins immediately. A human approver will ' +
        'review within 24 hours. If approved, funds are sent directly to the wallet ' +
        'address — no further action required from the applicant.',
      poweredBy: 'XRPLHub.io Community Grants — wallet-to-wallet, no middleman © 2026',
    }, null, 2);
  } catch (e) {
    return JSON.stringify({ error: `Grant submission failed: ${e instanceof Error ? e.message : 'unknown'}` });
  }
}

// ─── JSON-RPC DISPATCHER ──────────────────────────────────────────────────────
function rpcError(id: unknown, code: number, message: string) {
  return NextResponse.json(
    { jsonrpc: '2.0', id: id ?? null, error: { code, message } },
    { headers: CORS }
  );
}
function rpcResult(id: unknown, result: unknown) {
  return NextResponse.json(
    { jsonrpc: '2.0', id, result },
    { headers: CORS }
  );
}

// ─── HANDLERS ─────────────────────────────────────────────────────────────────

export async function OPTIONS() {
  return new NextResponse(null, { status: 200, headers: CORS });
}

// GET — human-readable server info and Claude Desktop integration instructions
export async function GET() {
  return NextResponse.json(
    {
      name:        'XRPLHub MCP Server',
      version:     '1.1.0',
      description: 'The three pillars of XRPLHub as AI-agent tools: ' +
                   'XRPLScore™ reputation check, 35 XRPL transaction builders, and community grants.',
      tools: TOOLS.map(t => ({
        name:        t.name,
        description: t.description.slice(0, 140) + '...',
      })),
      quickstart: {
        claudeDesktop: {
          step: 'Add to your Claude Desktop config file',
          configFile: {
            mac:     '~/.config/claude/claude_desktop_config.json',
            windows: '%APPDATA%\\Claude\\claude_desktop_config.json',
          },
          add: {
            mcpServers: {
              xrplhub: { url: 'https://www.xrplhub.io/api/mcp' },
            },
          },
        },
        claudeCode:  'claude mcp add xrplhub --url https://www.xrplhub.io/api/mcp',
        xrplStarter: 'Compatible with the XRPL AI Starter Kit (Ripple/Anthropic, 2026)',
        directAPI:   'POST https://www.xrplhub.io/api/mcp — JSON-RPC 2.0',
      },
      links: {
        site:        'https://www.xrplhub.io',
        github:      'https://github.com/Dcroyalty/XRPLHub.io',
        crunchbase:  'https://www.crunchbase.com/organization/xrplhub-io',
        methodology: 'XRPLScore™ methodology whitepaper available at partners@xrplhub.io',
      },
      copyright: '© 2026 XRPLHub.io · XRPLScore™ · All Rights Reserved',
    },
    { headers: CORS }
  );
}

// POST — MCP JSON-RPC 2.0 endpoint
export async function POST(req: NextRequest) {
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return rpcError(null, -32700, 'Parse error — request body must be valid JSON');
  }

  if (!body || body.jsonrpc !== '2.0' || !body.method) {
    return rpcError(body?.id, -32600, 'Invalid Request — must be JSON-RPC 2.0');
  }

  const { id, method, params } = body as {
    id:     unknown;
    method: string;
    params: Record<string, unknown>;
  };

  // ── INITIALIZE ────────────────────────────────────────────────────────────
  if (method === 'initialize') {
    return rpcResult(id, {
      protocolVersion: '2024-11-05',
      capabilities:    { tools: {} },
      serverInfo: {
        name:        'xrplhub',
        version:     '1.1.0',
        description: 'XRPLScore™ · XRPL Transaction Builder · Community Grants',
      },
    });
  }

  // ── TOOLS/LIST ────────────────────────────────────────────────────────────
  if (method === 'tools/list') {
    return rpcResult(id, { tools: TOOLS });
  }

  // ── TOOLS/CALL ────────────────────────────────────────────────────────────
  if (method === 'tools/call') {
    const toolName = String((params as { name?: string })?.name || '');
    const toolArgs = ((params as { arguments?: Record<string, unknown> })?.arguments) || {};
    let output: string;

    try {
      if (toolName === 'check_xrpl_score') {
        output = await toolCheckXrplScore(toolArgs);
      } else if (toolName === 'build_xrpl_transaction') {
        output = await toolBuildXrplTransaction(toolArgs);
      } else if (toolName === 'submit_grant_application') {
        output = await toolSubmitGrantApplication(toolArgs);
      } else {
        return rpcError(id, -32601, `Tool not found: ${toolName}`);
      }
    } catch (e) {
      output = JSON.stringify({
        error: `Tool execution error: ${e instanceof Error ? e.message : 'unknown'}`,
      });
    }

    return rpcResult(id, {
      content: [{ type: 'text', text: output }],
    });
  }

  // ── NOTIFICATIONS (no response) ───────────────────────────────────────────
  if (typeof method === 'string' && method.startsWith('notifications/')) {
    return new NextResponse(null, { status: 204, headers: CORS });
  }

  return rpcError(id, -32601, `Method not found: ${method}`);
}
