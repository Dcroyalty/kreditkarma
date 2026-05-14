import { NextRequest, NextResponse } from 'next/server'
const XUMM_STATUS = 'https://xumm.app/api/v1/platform/payload'
export async function GET(req: NextRequest) {
  try {
    const uuid = req.nextUrl.searchParams.get('uuid')
    if (!uuid) return NextResponse.json({ status: 'error', reason: 'Missing uuid' }, { status: 400 })
    const apiKey = process.env.XUMM_API_KEY
    const apiSecret = process.env.XUMM_API_SECRET
    if (!apiKey || !apiSecret) return NextResponse.json({ status: 'error', reason: 'Not configured' }, { status: 503 })
    const res = await fetch(`${XUMM_STATUS}/${uuid}`, { headers: { 'X-API-Key': apiKey, 'X-API-Secret': apiSecret }, signal: AbortSignal.timeout(8000) })
    const data = await res.json()
    const meta = data?.meta
    if (!meta?.exists) return NextResponse.json({ status: 'error', reason: 'Not found' })
    if (meta?.expired) return NextResponse.json({ status: 'expired' })
    if (meta?.cancelled) return NextResponse.json({ status: 'rejected' })
    if (!meta?.signed) return NextResponse.json({ status: 'pending' })
    const account = data?.response?.account || data?.payload?.response?.account || data?.payload?.response?.signer || null
    if (!account) return NextResponse.json({ status: 'pending' })
    return NextResponse.json({ status: 'connected', address: account })
  } catch (err) { console.error('[check-wallet]', err); return NextResponse.json({ status: 'error', reason: 'Check failed' }, { status: 500 }) }
}
