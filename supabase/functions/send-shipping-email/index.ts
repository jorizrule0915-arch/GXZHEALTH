import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

// Keep shipping notifications aligned with the existing order-confirmation
// recipients. BCC prevents exposing internal GXZ addresses to customers.
const adminRecipients = [
  'jorizrule0@gmail.com',
  'g@gxzhealth.com',
  'g@gxzpeptides.com',
  'jorizrule0915@gmail.com',
]

const escapeHtml = (value: unknown) => String(value ?? '')
  .replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;')
  .replaceAll('"', '&quot;').replaceAll("'", '&#39;')

function trackingUrl(carrier: string, tracking: string) {
  const encoded = encodeURIComponent(tracking)
  const urls: Record<string, string> = {
    USPS: `https://tools.usps.com/go/TrackConfirmAction?tLabels=${encoded}`,
    UPS: `https://www.ups.com/track?tracknum=${encoded}`,
    DHL: `https://www.dhl.com/global-en/home/tracking.html?tracking-id=${encoded}`,
    FedEx: `https://www.fedex.com/fedextrack/?trknbr=${encoded}`,
  }
  return urls[carrier] ?? `https://www.google.com/search?q=${encodeURIComponent(`${carrier} ${tracking}`)}`
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders })
  try {
    const { orderId, carrier, trackingNumber, shipmentStatus, latestUpdate, shipmentLocation, eventDate } = await req.json()
    if (!orderId || !carrier || !trackingNumber) throw new Error('Order, carrier, and tracking number are required.')

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    )
    const { data: order, error: orderError } = await supabase.from('orders').select('*').eq('id', orderId).single()
    if (orderError || !order) throw new Error(orderError?.message ?? 'Order not found.')
    if (!order.customer_email) throw new Error('This order has no customer email address.')

    const apiKey = Deno.env.get('RESEND_API_KEY_NEW')
    if (!apiKey) throw new Error('RESEND_API_KEY_NEW is not configured.')
    const link = trackingUrl(carrier, trackingNumber)
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: 'GXZ Health <orders@gxzhealth.com>',
        to: [order.customer_email],
        bcc: adminRecipients,
        subject: `Your GXZ Health order ${order.order_number} has shipped`,
        html: `<div style="background:#f4f7f6;padding:40px 16px;font-family:Arial,sans-serif;color:#13231f"><div style="max-width:600px;margin:auto;background:white;border-radius:18px;overflow:hidden"><div style="padding:28px;background:#103f35;color:white"><div style="font-size:22px;font-weight:800">GXZ Health</div><div style="margin-top:8px;color:#cde7de">Your order is on the way</div></div><div style="padding:32px"><p>Hi ${escapeHtml(order.customer_name || 'there')},</p><p style="line-height:1.7;color:#52605c">Your order <strong>${escapeHtml(order.order_number)}</strong> has a new ${escapeHtml(carrier)} shipping update.</p><div style="background:#f3f7f5;padding:18px;border-radius:12px;margin:24px 0"><div style="font-size:12px;color:#73817d;text-transform:uppercase;letter-spacing:.08em">Latest update</div><div style="font-size:18px;font-weight:800;margin-top:8px;color:#145844">${escapeHtml(shipmentStatus || 'In transit')}</div>${latestUpdate ? `<p style="line-height:1.6;color:#52605c">${escapeHtml(latestUpdate)}</p>` : ''}${shipmentLocation ? `<div style="font-weight:700">${escapeHtml(shipmentLocation)}</div>` : ''}${eventDate ? `<div style="margin-top:5px;color:#73817d;font-size:13px">${escapeHtml(new Date(eventDate).toLocaleString('en-US'))}</div>` : ''}<div style="font-size:12px;color:#73817d;text-transform:uppercase;letter-spacing:.08em;margin-top:18px">Tracking number</div><div style="font-size:17px;font-weight:700;margin-top:7px">${escapeHtml(trackingNumber)}</div></div><a href="${link}" style="display:inline-block;background:#145844;color:white;text-decoration:none;padding:14px 24px;border-radius:9px;font-weight:700">Track My Order</a><p style="margin-top:28px;font-size:12px;color:#89938f">You’ll only receive updates at major shipping milestones.</p></div></div></div>`,
      }),
    })
    const result = await response.json()
    if (!response.ok) throw new Error(result?.message ?? 'Resend rejected the email.')

    const { error: updateError } = await supabase.from('orders').update({
      shipping_carrier: carrier, tracking_number: trackingNumber,
      shipment_status: 'in_transit', tracking_updated_at: new Date().toISOString(),
    }).eq('id', orderId)
    if (updateError) console.warn('Shipping fields are not available yet:', updateError.message)
    const { error: historyError } = await supabase.from('email_history').insert({ order_id: orderId, recipient: order.customer_email, event: 'shipping_confirmation', provider_message_id: result.id, status: 'sent' })
    if (historyError) console.warn('Email history table is not available yet:', historyError.message)

    return new Response(JSON.stringify({ sent: true, messageId: result.id }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  } catch (error) {
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : 'Unable to send email.' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  }
})
