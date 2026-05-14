import { NextRequest, NextResponse } from 'next/server'
const TREASURY = 'rs59g3amo5iT6T64Cg96XXMAWuw3WPQcLF'
const XUMM_API = 'https://xumm.app/api/v1/platform/payload'
const RLUSD_ISSUER = process.env.RLUSD_ISSUER || 'rMxCKbEDwqr76QuheSUMdEGf4B9xJ8m5De'
const NAMES: Record<string,string> = { clawback:'Clawback Shield', escrow:'Escrow Vault', mutual:'Mutual Aid Pool', credit:'Credit Builder', amm:'DEX Liquidity Guard', nft:'NFT Vault Lock', multisig:'Multi-Sig Fortress', channel:'Payment Channel', identity:'On-Chain Identity', dex:'DEX Market Maker' }
export async function POST(req: NextRequest) {
  try {
    const { productId, currency, amount, email } = await req.json()
    const apiKey = process.env.XUMM_API_KEY, apiSecret = process.env.XUMM_API_SECRET
    if (!apiKey || !apiSecret) return NextResponse.json({ error: 'Payment gateway not configured' }, { status: 503 })
    const amtNum = parseFloat(amount)
    if (!amtNum || amtNum <= 0) return NextResponse.json({ error: 'Invalid amount' }, { status: 400 })
    const txjson: Record<string,unknown> = { TransactionType: 'Payment', Destination: TREASURY, Amount: currency === 'XRP' ? String(Math.round(amtNum * 1000000)) : { currency: 'RLUSD', issuer: RLUSD_ISSUER, value: String(amtNum) } }
    const payload = { txjson, options: { submit: true, expire: 15 }, custom_meta: { identifier: `kk_${productId}_${Date.now()}`, blob: JSON.stringify({ productId, amount: amtNum, currency, email: email || '' }), instruction: `KreditKarma - ${NAMES[productId] || productId}\nAmount: ${amtNum} ${currency}` } }
    const res = await fetch(XUMM_API, { method: 'POST', headers: { 'Content-Type': 'application/json', 'X-API-Key': apiKey, 'X-API-Secret': apiSecret }, body: JSON.stringify(payload), signal: AbortSignal.timeout(10000) })
    const data = await res.json()
    if (!res.ok || !data?.uuid) return NextResponse.json({ error: 'Payment gateway error' }, { status: 502 })
    return NextResponse.json({ uuid: data.uuid, qr_png: data.refs?.qr_png, deep_link: data.next?.always, expires_in: 900 })
  } catch (err) { console.error('[create-payment]', err); return NextResponse.json({ error: 'Payment initialization failed' }, { status: 500 }) }
}
