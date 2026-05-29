// src/app/api/check-wallet/route.ts
// Polled every 3s after the connect QR is shown.
// Returns: pending | connected (+address) | expired | rejected
// Requires env vars: XUMM_API_KEY, XUMM_API_SECRET

import { NextRequest, NextResponse } from 'next/server'

const XUMM_STATUS = 'https://xumm.app/api/v1/platform/payload'

export async function GET(req: NextRequest) {
  try {
    const uuid = req.nextUrl.searchParams.get('uuid')
    if (!uuid) return NextResponse.json({ status: 'error', reason: 'Missing connection ID' }, { status: 400 })

    const apiKey    = process.env.XUMM_API_KEY
    const apiSecret = process.env.XUMM_API_SECRET
    if (!apiKey || !apiSecret)
      return NextResponse.json({ status: 'error', reason: 'Wallet gateway not configured' }, { status: 503 })

    const res  = await fetch(`${XUMM_STATUS}/${uuid}`, {
      headers: { 'X-API-Key': apiKey, 'X-API-Secret': apiSecret },
      signal: AbortSignal.timeout(8_000),
    })
    const data = await res.json()
    const meta = data?.meta

    if (!meta?.exists)   return NextResponse.json({ status: 'error', reason: 'Connection request not found' })
    if (meta?.expired)   return NextResponse.json({ status: 'expired' })
    if (meta?.cancelled) return NextResponse.json({ status: 'rejected' })
    if (!meta?.signed)   return NextResponse.json({ status: 'pending' })

    // Signed — the resolved account is the connected wallet address
    const address = data?.response?.account || data?.payload?.response?.account
    if (!address) return NextResponse.json({ status: 'pending' })

    return NextResponse.json({ status: 'connected', address })
  } catch (err) {
    console.error('[check-wallet]', err)
    return NextResponse.json({ status: 'error', reason: 'Connection check failed — retry' }, { status: 500 })
  }
}
