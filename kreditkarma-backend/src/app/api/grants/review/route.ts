import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// ── Env vars (set these in Vercel) ──
//   XAI_API_KEY        → Grok (xAI)
//   ANTHROPIC_API_KEY  → Anthropic (Claude)
// If your Vercel var names differ, change the two process.env lines below.
const XAI_API_KEY       = process.env.XAI_API_KEY || process.env.GROK_API_KEY || '';
const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY || '';

const REVIEW_INSTRUCTIONS = `You are a grant reviewer for XRPLHub, a community mutual-aid fund that gives small emergency grants ($25-$100) directly to people in need, paid to their XRPL wallet. Review the application below for legitimacy and need. Watch for: obvious fraud or spam, duplicate/templated text, requests that don't match the stated category, or amounts that seem inconsistent with the described need. You are advisory only — a human gives final approval before any funds move.

Respond with STRICT JSON only, no markdown, no preamble:
{"recommendation":"APPROVE"|"REVIEW"|"REJECT","confidence":0-100,"summary":"one or two sentence rationale for the human approver","flags":["short risk flags, empty array if none"]}`;

interface AppInput { name?: string; wallet?: string; email?: string; category?: string; need?: string; amount?: string | number; }
interface Verdict { recommendation: string; confidence: number; summary: string; flags: string[]; source: string; }

function buildPrompt(app: AppInput): string {
  return `${REVIEW_INSTRUCTIONS}

APPLICATION:
- Name: ${app.name || 'Anonymous'}
- Category: ${app.category || 'n/a'}
- Amount requested: $${app.amount || 'n/a'}
- XRPL wallet: ${app.wallet || 'n/a'}
- Situation described: ${app.need || 'n/a'}`;
}

function safeParse(text: string): Partial<Verdict> | null {
  if (!text) return null;
  const cleaned = text.replace(/```json/gi, '').replace(/```/g, '').trim();
  const start = cleaned.indexOf('{');
  const end = cleaned.lastIndexOf('}');
  if (start === -1 || end === -1) return null;
  try { return JSON.parse(cleaned.slice(start, end + 1)); } catch { return null; }
}

// ── Grok (xAI) ──
async function reviewWithGrok(app: AppInput): Promise<Partial<Verdict> | null> {
  if (!XAI_API_KEY) return null;
  try {
    const res = await fetch('https://api.x.ai/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${XAI_API_KEY}` },
      body: JSON.stringify({
        model: 'grok-2-latest',
        temperature: 0.2,
        messages: [{ role: 'user', content: buildPrompt(app) }],
      }),
    });
    if (!res.ok) return null;
    const data = await res.json();
    const text = data?.choices?.[0]?.message?.content || '';
    const parsed = safeParse(text);
    return parsed ? { ...parsed, source: 'grok' } : null;
  } catch { return null; }
}

// ── Anthropic (Claude) ──
async function reviewWithAnthropic(app: AppInput): Promise<Partial<Verdict> | null> {
  if (!ANTHROPIC_API_KEY) return null;
  try {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 400,
        messages: [{ role: 'user', content: buildPrompt(app) }],
      }),
    });
    if (!res.ok) return null;
    const data = await res.json();
    const text = Array.isArray(data?.content)
      ? data.content.map((b: { type: string; text?: string }) => (b.type === 'text' ? b.text : '')).join('')
      : '';
    const parsed = safeParse(text);
    return parsed ? { ...parsed, source: 'anthropic' } : null;
  } catch { return null; }
}

// Combine the two independent reviews. Most conservative recommendation wins;
// REJECT > REVIEW > APPROVE. Flags are merged.
function combine(grok: Partial<Verdict> | null, claude: Partial<Verdict> | null): Verdict {
  const reviews = [grok, claude].filter(Boolean) as Partial<Verdict>[];
  if (reviews.length === 0) {
    return { recommendation: 'REVIEW', confidence: 0, summary: 'AI reviewers unavailable — manual review required.', flags: ['ai_unavailable'], source: 'none' };
  }
  const rank: Record<string, number> = { REJECT: 3, REVIEW: 2, APPROVE: 1 };
  let worst = reviews[0];
  for (const r of reviews) {
    if ((rank[(r.recommendation || 'REVIEW').toUpperCase()] || 2) > (rank[(worst.recommendation || 'REVIEW').toUpperCase()] || 2)) worst = r;
  }
  const flags = Array.from(new Set(reviews.flatMap(r => r.flags || [])));
  const avgConf = Math.round(reviews.reduce((s, r) => s + (Number(r.confidence) || 0), 0) / reviews.length);
  const summaries = reviews.map(r => `${(r.source || 'ai').toUpperCase()}: ${r.summary || ''}`).join(' · ');
  return {
    recommendation: (worst.recommendation || 'REVIEW').toUpperCase(),
    confidence: avgConf,
    summary: summaries,
    flags,
    source: reviews.map(r => r.source).join('+'),
  };
}

// POST /api/grants/review — autonomous AI review (Grok + Anthropic)
export async function POST(req: Request) {
  try {
    const app: AppInput = await req.json().catch(() => ({}));

    const [grok, claude] = await Promise.all([reviewWithGrok(app), reviewWithAnthropic(app)]);
    const verdict = combine(grok, claude);

    // Attach AI verdict to the most recent matching PENDING application and move it to REVIEWING
    if (app.wallet) {
      try {
        const latest = await prisma.grantRequest.findFirst({
          where: { wallet: String(app.wallet), status: 'PENDING' },
          orderBy: { createdAt: 'desc' },
        });
        if (latest) {
          await prisma.grantRequest.update({
            where: { id: latest.id },
            data: {
              status: 'REVIEWING',
              aiRecommendation: verdict.recommendation,
              aiSummary: verdict.summary,
              aiConfidence: verdict.confidence,
              aiFlags: verdict.flags.join(', '),
            },
          });
        }
      } catch {
        // If these columns don't exist yet, the review still returns to the UI.
        // Add to prisma/schema.prisma on GrantRequest:
        //   aiRecommendation String?
        //   aiSummary        String?
        //   aiConfidence     Int?
        //   aiFlags          String?
        // then: npx prisma migrate dev (or db push) and redeploy.
      }
    }

    return NextResponse.json({
      recommendation: verdict.recommendation,
      confidence: verdict.confidence,
      summary: verdict.summary,
      flags: verdict.flags,
      reviewers: verdict.source,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'review failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
