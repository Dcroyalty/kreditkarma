// src/app/api/connect-wallet/route.ts
// Creates a Xaman SignIn payload — proves wallet ownership, moves NO funds.
// Requires env vars: XUMM_API_KEY, XUMM_API_SECRET

import { NextRequest, NextResponse } from 'next/server'

const XUMM_API = 'https://xumm.app/api/v1/platform/payload'

export async function POST(_req: NextRequest) {
  try {
    const apiKey    = process.env.XUMM_API_KEY
    const apiSecret = process.env.XUMM_API_SECRET
    if (!apiKey || !apiSecret) {
      return NextResponse.json({ error: 'Wallet gateway not configured. Contact support@xrplhub.io' }, { status: 503 })
    }

    const payload = {
      txjson: { TransactionType: 'SignIn' },
      options: { expire: 10 },
      custom_meta: {
        identifier: `xrplhub_connect_${Date.now()}`,
        instruction: 'XRPLHub — Connect your wallet\nNo transaction. No funds move.',
      },
    }

    const res = await fetch(XUMM_API, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-API-Key': apiKey, 'X-API-Secret': apiSecret },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(10_000),
    })
    const data = await res.json()

    if (!res.ok || !data?.uuid) {
      console.error('[connect-wallet] Xaman error:', JSON.stringify(data))
      return NextResponse.json({ error: data?.error?.reference || 'Wallet gateway error. Please try again.' }, { status: 502 })
    }

    return NextResponse.json({
      uuid:      data.uuid,
      qr_png:    data.refs?.qr_png,
      deep_link: data.next?.always,
    })
  } catch (err) {
    console.error('[connect-wallet]', err)
    return NextResponse.json({ error: 'Wallet connection failed. Please try again.' }, { status: 500 })
  }
}
