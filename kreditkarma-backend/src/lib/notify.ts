// src/lib/notify.ts
// Drop-in helper: import { notifyError } from '@/lib/notify' in any route.
// Fire-and-forget — never awaits, never throws, never blocks the customer response.

export function notifyError(route: string, err: unknown, context?: Record<string, unknown>) {
  const message = err instanceof Error ? err.message : String(err);
  const stack   = err instanceof Error ? err.stack   : '';
  const base = process.env.NEXT_PUBLIC_API_URL || '';
  fetch(`${base}/api/notify-error`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ route, message, stack, context }),
  }).catch(() => {}); // never throw from logger
}
