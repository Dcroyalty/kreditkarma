// src/app/api/notify-error/route.ts
// Silent error sink. Any 500 anywhere in the codebase can POST here.
// We forward to ERROR_WEBHOOK_URL (your Discord webhook, your Slack webhook, anything).
// If ERROR_WEBHOOK_URL is not set, we just log to Vercel console — never breaks anything.

import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const { route, message, stack, context } = await req.json().catch(() => ({}));
    const payload = {
      route:   String(route   || 'unknown'),
      message: String(message || 'no message'),
      stack:   String(stack   || '').slice(0, 1500),
      context: context || {},
      site:    'xrplhub.io',
      when:    new Date().toISOString(),
    };

    console.error('[xrplhub error]', JSON.stringify(payload));

    const hook = process.env.ERROR_WEBHOOK_URL;
    if (hook) {
      // Discord webhook format. Works with Slack incoming webhooks too if you adjust content key.
      const isDiscord = hook.includes('discord.com') || hook.includes('discordapp.com');
      const body = isDiscord
        ? { content: `🚨 **XRPLHub Error** \`${payload.route}\`\n\`\`\`${payload.message}\`\`\`\n${payload.stack ? '```\n'+payload.stack.slice(0, 800)+'\n```' : ''}` }
        : { text: `🚨 XRPLHub Error in ${payload.route}: ${payload.message}` };
      fetch(hook, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(5_000),
      }).catch(() => {}); // intentionally swallow — never let logging break the app
    }
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false }, { status: 200 }); // never break caller
  }
}
