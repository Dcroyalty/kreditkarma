import { NextRequest, NextResponse } from 'next/server'
const XUMM_STATUS = 'https://xumm.app/api/v1/platform/payload'
const XRPL_API = 'https://xrplcluster.com/'
const TREASURY = 'rs59g3amo5iT6T64Cg96XXMAWuw3WPQcLF'
async function fetchTx(hash: string) { try { const r = await fetch(XRPL_API, { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({method:'tx',params:[{transaction:hash,binary:false}]}), signal: AbortSignal.timeout(8000) }); const d = await r.json(); return d?.result?.Account ? d.result : null } catch { return null } }
export async function GET(req: NextRequest) {
  try {
    const p = req.nextUrl.searchParams
const p = req.nextUrl.searchParams
    const uuid = p.get('uuid'), productId = p.get('productId') || '', amount = parseFloat(p.get('amount') || '0'), currency = p.get('currency') || 'XRP', email = p.get('email') || ''
    if (!uuid) return NextResponse.json({ status: 'error', reason: 'Missing payment ID' }, { status: 400 })
    const apiKey = process.env.XUMM_API_KEY, apiSecret = process.env.XUMM_API_SECRET
    if (!apiKey || !apiSecret) return NextResponse.json({ status: 'error', reason: 'Not configured' }, { status: 503 })
    const res = await fetch(`${XUMM_STATUS}/${uuid}`, { headers: { 'X-API-Key': apiKey, 'X-API-Secret': apiSecret }, signal: AbortSignal.timeout(8000) })
    const data = await res.json()
    const meta = data?.meta
    if (!meta?.exists) return NextResponse.json({ status: 'error', reason: 'Not found' })
    if (meta?.expired) return NextResponse.json({ status: 'expired' })
    if (meta?.cancelled) return NextResponse.json({ status: 'rejected', reason: 'Payment cancelled' })
    if (!meta?.signed) return NextResponse.json({ status: 'pending' })
    const txHash = data?.payload?.response?.txid as string | undefined
    if (!txHash) return NextResponse.json({ status: 'pending' })
    const tx = await fetchTx(txHash)
    if (!tx) return NextResponse.json({ status: 'pending' })
    const txMeta = tx.meta as Record<string,unknown>
    if (txMeta?.TransactionResult !== 'tesSUCCESS') return NextResponse.json({ status: 'rejected', reason: `TX failed: ${txMeta?.TransactionResult}` })
    if (tx.Destination !== TREASURY) return NextResponse.json({ status: 'rejected', reason: 'Wrong destination' })
    const TOL = 0.95
    if (currency === 'XRP') { const xrp = parseInt(tx.Amount as string) / 1e6; if (xrp < amount * TOL) return NextResponse.json({ status: 'rejected', reason: `Amount too low: ${xrp} XRP` }) }
    else { const a = tx.Amount as Record<string,string>; if (parseFloat(a?.value||'0') < amount * TOL) return NextResponse.json({ status: 'rejected', reason: 'Amount too low' }) }
    const base = process.env.NEXT_PUBLIC_API_URL || ''
    Promise.allSettled([ fetch(`${base}/api/purchase`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({productId,currency,amount:String(amount),email,txHash,sender:tx.Account,verifiedAt:new Date().toISOString()})}), email ? fetch(`${base}/api/send-email`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({to:email,type:'purchase',productId,txHash,amount:String(amount),currency})}) : Promise.resolve() ]).catch(()=>{})
    return NextResponse.json({ status: 'verified', txHash, sender: tx.Account, message: `${amount} ${currency} confirmed` })
  } catch (err) { console.error('[check-payment]', err); return NextResponse.json({ status: 'error', reason: 'Verification failed' }, { status: 500 }) }
}
