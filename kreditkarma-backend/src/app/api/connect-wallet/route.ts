import { NextRequest, NextResponse } from 'next/server'
const XUMM_API = 'https://xumm.app/api/v1/platform/payload'
export async function POST(req: NextRequest) {
  try {
    const apiKey = process.env.XUMM_API_KEY
    const apiSecret = process.env.XUMM_API_SECRET
    if (!apiKey || !apiSecret) return NextResponse.json({ error: 'Wallet connection not configured' }, { status: 503 })
    const body = await req.json().catch(() => ({}))
    const payload = {
      txjson: { TransactionType: 'SignIn' },
      options: { submit: false, expire: 10 },
      custom_meta: { identifier: `kk_connect_${Date.now()}`, instruction: 'Connect your wallet to KreditKarma.us\nNo transaction is sent. No funds leave your wallet.', blob: JSON.stringify({ action: 'connect', ...body }) },
    }
    const res = await fetch(XUMM_API, { method: 'POST', headers: { 'Content-Type': 'application/json', 'X-API-Key': apiKey, 'X-API-Secret': apiSecret }, body: JSON.stringify(payload), signal: AbortSignal.timeout(10000) })
    const data = await res.json()
    if (!res.ok || !data?.uuid) return NextResponse.json({ error: 'Failed to create connection request' }, { status: 502 })
    return NextResponse.json({ uuid: data.uuid, qr_png: data.refs?.qr_png, deep_link: data.next?.always })
  } catch (err) { console.error('[connect-wallet]', err); return NextResponse.json({ error: 'Connection failed' }, { status: 500 }) }
}
