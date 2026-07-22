declare const Deno: {
  env: {
    get: (name: string) => string | undefined
  }
  serve: (handler: (req: Request) => Response | Promise<Response>) => void
}

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY_NEW')
const RECAPTCHA_SECRET_KEY = Deno.env.get('RECAPTCHA_SECRET_KEY')

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

async function verifyRecaptchaToken(token: string, remoteIp: string | null) {
  if (!RECAPTCHA_SECRET_KEY) {
    throw new Error('Missing RECAPTCHA_SECRET_KEY')
  }

  const body = new URLSearchParams({
    secret: RECAPTCHA_SECRET_KEY,
    response: token,
  })

  if (remoteIp) {
    body.set('remoteip', remoteIp)
  }

  const verificationResponse = await fetch('https://www.google.com/recaptcha/api/siteverify', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: body.toString(),
  })

  const verificationResult = await verificationResponse.json()

  if (!verificationResponse.ok || !verificationResult.success) {
    console.error('❌ reCAPTCHA verification failed:', JSON.stringify(verificationResult))
    return false
  }

  return true
}

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : 'Unknown error'
}

function getErrorStack(error: unknown) {
  return error instanceof Error ? error.stack : undefined
}

function escapeHtml(value: unknown) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;')
}

function formatCurrency(value: number) {
  return `$${Number(value || 0).toFixed(2)}`
}

function formatCustomerAddress(customer: Record<string, unknown> | undefined) {
  const lines = [
    customer?.address,
    [customer?.city, customer?.state, customer?.zipCode].filter(Boolean).join(', '),
  ]
    .map((line) => String(line ?? '').trim())
    .filter(Boolean)

  return lines.length > 0 ? lines.map((line) => escapeHtml(line)).join('<br>') : 'Not provided'
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    console.log('📧 Function called')
    console.log('🔑 API Key loaded:', !!RESEND_API_KEY)
    
    const { orderData, paymentMethod, paymentProof, recaptchaToken } = await req.json()
    const remoteIp = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? null
    const siteUrl = req.headers.get('origin') || 'https://health.gxzhealth.com'

    if (!recaptchaToken || !(await verifyRecaptchaToken(recaptchaToken, remoteIp))) {
      return new Response(JSON.stringify({
        error: 'reCAPTCHA verification failed',
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }
    
    const orderNumber = orderData.orderNumber || `ORD-${Date.now()}`
    const subtotal = typeof orderData.subtotal === 'number'
      ? orderData.subtotal
      : orderData.items.reduce((sum: number, item: any) => sum + item.total, 0)
    const shippingCost = typeof orderData.shippingCost === 'number'
      ? orderData.shippingCost
      : Math.max(orderData.totalPrice - subtotal, 0)
    const promoDiscount = typeof orderData.promoDiscountAmount === 'number'
      ? Math.max(orderData.promoDiscountAmount, 0)
      : 0
    const promoCodeLabel = typeof orderData.promoCode === 'string'
      ? orderData.promoCode.trim()
      : ''
    const totalPrice = typeof orderData.totalPrice === 'number'
      ? orderData.totalPrice
      : subtotal + shippingCost
    const customer = orderData.customer ?? {}
    const customerEmailRaw = typeof customer.email === 'string' ? customer.email.trim() : ''
    const customerName = escapeHtml(customer.name || 'Unknown customer')
    const customerEmail = escapeHtml(customerEmailRaw || 'Not provided')
    const customerPhone = escapeHtml(customer.phone || 'Not provided')
    const paymentMethodLabel = escapeHtml(paymentMethod || 'Not specified')
    const itemCount = orderData.items.reduce((sum: number, item: any) => sum + Number(item.quantity ?? 0), 0)
    const addressHtml = formatCustomerAddress(customer)
    const canEmailCustomer = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(customerEmailRaw)
    const pipelineButtonsHtml = paymentMethod === 'Apple Pay' || paymentMethod === 'Zelle'
      ? `
                <tr>
                  <td style="padding: 0 30px 30px 30px;">
                    <table width="100%" cellpadding="0" cellspacing="0" style="background: linear-gradient(135deg, #0f172a 0%, #172554 100%); border: 1px solid #1e3a8a; border-radius: 20px; padding: 24px;">
                      <tr>
                        <td>
                          <p style="color: #bfdbfe; font-size: 12px; letter-spacing: 0.2em; text-transform: uppercase; margin: 0 0 10px 0; font-weight: 800;">Pipeline Actions</p>
                          <p style="color: #dbeafe; font-size: 14px; line-height: 1.7; margin: 0 0 18px 0;">This Apple Pay or Zelle order still needs manual attention. Open the pipeline or update its stage directly from this email.</p>
                          <a href="${siteUrl}/admin?view=pipeline&order=${encodeURIComponent(orderNumber)}" style="display: inline-block; margin-right: 10px; margin-bottom: 10px; padding: 12px 18px; border-radius: 999px; background: #2563eb; color: #ffffff; text-decoration: none; font-size: 14px; font-weight: 700;">Open Pipeline</a>
                          <a href="${siteUrl}/admin?view=pipeline&order=${encodeURIComponent(orderNumber)}&action=processing" style="display: inline-block; margin-right: 10px; margin-bottom: 10px; padding: 12px 18px; border-radius: 999px; background: #334155; color: #ffffff; text-decoration: none; font-size: 14px; font-weight: 700;">Mark Processing</a>
                          <a href="${siteUrl}/admin?view=pipeline&order=${encodeURIComponent(orderNumber)}&action=complete" style="display: inline-block; margin-bottom: 10px; padding: 12px 18px; border-radius: 999px; background: #059669; color: #ffffff; text-decoration: none; font-size: 14px; font-weight: 700;">Mark Paid</a>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
        `
      : ''
    const paymentProofHtml = paymentProof
      ? `
        <div style="margin-top: 18px; border: 1px solid #dbeafe; border-radius: 18px; background: #f8fbff; padding: 18px;">
          <p style="margin: 0 0 12px 0; color: #1d4ed8; font-size: 12px; font-weight: 800; letter-spacing: 0.18em; text-transform: uppercase;">Submitted Payment Proof</p>
          <table width="100%" cellpadding="0" cellspacing="0">
            <tr>
              <td style="padding: 8px 0; color: #64748b; font-size: 14px;">Reference ID</td>
              <td style="padding: 8px 0; color: #0f172a; font-size: 14px; font-weight: 700; text-align: right;">${escapeHtml(paymentProof.referenceId)}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #64748b; font-size: 14px;">Account Name</td>
              <td style="padding: 8px 0; color: #0f172a; font-size: 14px; font-weight: 700; text-align: right;">${escapeHtml(paymentProof.accountName)}</td>
            </tr>
          </table>
        </div>
        `
      : ''
    const promoSummaryRowHtml = promoDiscount > 0
      ? `
                      <tr>
                        <td style="color: #059669; font-size: 14px; padding-bottom: 16px;">Promo discount${promoCodeLabel ? ` (${escapeHtml(promoCodeLabel)})` : ''}</td>
                        <td style="color: #059669; font-size: 15px; font-weight: 700; text-align: right; padding-bottom: 16px;">- ${formatCurrency(promoDiscount)}</td>
                      </tr>
      `
      : ''
    const itemsListHtml = orderData.items.map((item: any) => 
      `<tr>
        <td style="padding: 16px; border-bottom: 1px solid #e2e8f0;">
          <div style="color: #0f172a; font-size: 15px; font-weight: 700;">${escapeHtml(item.name)}</div>
          ${item.selectedOptionLabel ? `<div style="margin-top: 5px; color: #2563eb; font-size: 13px; font-weight: 700;">Vial size / strength: ${escapeHtml(item.selectedOptionLabel)}</div>` : ''}
        </td>
        <td style="padding: 16px; border-bottom: 1px solid #e2e8f0; text-align: center; color: #0f172a; font-size: 14px; font-weight: 600;">${Number(item.quantity ?? 0)}</td>
        <td style="padding: 16px; border-bottom: 1px solid #e2e8f0; text-align: right; color: #0f172a; font-size: 14px; font-weight: 700;">${formatCurrency(Number(item.total ?? 0))}</td>
      </tr>`
    ).join('')

    const customerIntro = paymentProof
      ? 'We received your order and payment details. The GXZ Health team will manually review your payment before moving the order forward.'
      : 'We received your order and payment request. The GXZ Health team will contact you with the next steps for your selected payment method.'

    const customerEmailHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="margin: 0; padding: 0; font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #f8fafc;">
        <table width="100%" cellpadding="0" cellspacing="0" style="padding: 36px 16px;">
          <tr>
            <td align="center">
              <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 640px; background-color: #ffffff; border: 1px solid #dbeafe; border-radius: 28px; overflow: hidden; box-shadow: 0 24px 60px rgba(15, 23, 42, 0.10);">
                <tr>
                  <td style="background: linear-gradient(135deg, #2563eb 0%, #0f172a 100%); padding: 34px 30px 30px 30px;">
                    <p style="margin: 0 0 10px 0; color: #bfdbfe; font-size: 12px; letter-spacing: 0.24em; text-transform: uppercase; font-weight: 800;">GXZ Health</p>
                    <h1 style="color: #ffffff; margin: 0; font-size: 30px; line-height: 1.15; font-weight: 800;">Your order details</h1>
                    <p style="color: #dbeafe; margin: 12px 0 0 0; font-size: 15px; line-height: 1.7;">${customerIntro}</p>
                  </td>
                </tr>

                <tr>
                  <td style="padding: 24px 30px 0 30px;">
                    <table width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="padding-right: 8px; padding-bottom: 12px;">
                          <div style="border: 1px solid #dbeafe; border-radius: 18px; background: #f8fbff; padding: 16px;">
                            <p style="margin: 0 0 6px 0; color: #64748b; font-size: 11px; letter-spacing: 0.16em; text-transform: uppercase; font-weight: 800;">Order Number</p>
                            <p style="margin: 0; color: #0f172a; font-size: 16px; font-weight: 800;">${escapeHtml(orderNumber)}</p>
                          </div>
                        </td>
                        <td style="padding-left: 8px; padding-bottom: 12px;">
                          <div style="border: 1px solid #dbeafe; border-radius: 18px; background: #f8fbff; padding: 16px;">
                            <p style="margin: 0 0 6px 0; color: #64748b; font-size: 11px; letter-spacing: 0.16em; text-transform: uppercase; font-weight: 800;">Payment Method</p>
                            <p style="margin: 0; color: #0f172a; font-size: 16px; font-weight: 800;">${paymentMethodLabel}</p>
                          </div>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>

                <tr>
                  <td style="padding: 12px 30px 0 30px;">
                    <div style="border: 1px solid #e2e8f0; border-radius: 22px; background: #ffffff; padding: 24px;">
                      <p style="margin: 0 0 14px 0; color: #1d4ed8; font-size: 12px; letter-spacing: 0.18em; text-transform: uppercase; font-weight: 800;">Delivery Details</p>
                      <table width="100%" cellpadding="0" cellspacing="0">
                        <tr>
                          <td style="padding: 7px 0; color: #64748b; font-size: 14px; width: 110px;">Name</td>
                          <td style="padding: 7px 0; color: #0f172a; font-size: 14px; font-weight: 700;">${customerName}</td>
                        </tr>
                        <tr>
                          <td style="padding: 7px 0; color: #64748b; font-size: 14px; vertical-align: top;">Address</td>
                          <td style="padding: 7px 0; color: #0f172a; font-size: 14px; font-weight: 700;">${addressHtml}</td>
                        </tr>
                        <tr>
                          <td style="padding: 7px 0; color: #64748b; font-size: 14px;">Phone</td>
                          <td style="padding: 7px 0; color: #0f172a; font-size: 14px; font-weight: 700;">${customerPhone}</td>
                        </tr>
                      </table>
                    </div>
                  </td>
                </tr>

                <tr>
                  <td style="padding: 24px 30px 0 30px;">
                    <table width="100%" cellpadding="0" cellspacing="0" style="border: 1px solid #e2e8f0; border-radius: 24px; overflow: hidden; background: #ffffff;">
                      <tr>
                        <td style="padding: 24px 24px 10px 24px;">
                          <p style="margin: 0; color: #1d4ed8; font-size: 12px; letter-spacing: 0.18em; text-transform: uppercase; font-weight: 800;">Order Summary</p>
                          <p style="margin: 8px 0 0 0; color: #64748b; font-size: 14px;">${itemCount} item${itemCount === 1 ? '' : 's'} in this order</p>
                        </td>
                      </tr>
                      <thead>
                        <tr style="background-color: #f8fafc;">
                          <th style="padding: 12px 16px; text-align: left; color: #475569; font-size: 13px; font-weight: 700;">Product</th>
                          <th style="padding: 12px 16px; text-align: center; color: #475569; font-size: 13px; font-weight: 700;">Qty</th>
                          <th style="padding: 12px 16px; text-align: right; color: #475569; font-size: 13px; font-weight: 700;">Line Total</th>
                        </tr>
                      </thead>
                      <tbody>
                        ${itemsListHtml}
                      </tbody>
                    </table>
                  </td>
                </tr>

                <tr>
                  <td style="padding: 24px 30px 30px 30px;">
                    <table width="100%" cellpadding="0" cellspacing="0" style="background: #f8fbff; border: 1px solid #dbeafe; border-radius: 24px; padding: 24px;">
                      <tr>
                        <td style="color: #475569; font-size: 14px; padding-bottom: 12px;">Items subtotal</td>
                        <td style="color: #0f172a; font-size: 15px; font-weight: 700; text-align: right; padding-bottom: 12px;">${formatCurrency(subtotal)}</td>
                      </tr>
                      <tr>
                        <td style="color: #475569; font-size: 14px; padding-bottom: 16px;">Shipping fee</td>
                        <td style="color: #0f172a; font-size: 15px; font-weight: 700; text-align: right; padding-bottom: 16px;">${formatCurrency(shippingCost)}</td>
                      </tr>
                      ${promoSummaryRowHtml}
                      <tr>
                        <td style="border-top: 1px solid #bfdbfe; padding-top: 18px; color: #1d4ed8; font-size: 18px; font-weight: 800;">Total amount</td>
                        <td style="border-top: 1px solid #bfdbfe; padding-top: 18px; color: #2563eb; font-size: 30px; font-weight: 900; text-align: right;">${formatCurrency(totalPrice)}</td>
                      </tr>
                    </table>
                  </td>
                </tr>

                <tr>
                  <td style="background: #f8fafc; padding: 24px 30px 30px 30px; text-align: center; border-top: 1px solid #e2e8f0;">
                    <p style="color: #475569; font-size: 14px; margin: 0 0 8px 0; font-weight: 600;">Thank you for ordering from GXZ Health.</p>
                    <p style="color: #94a3b8; font-size: 12px; margin: 0; line-height: 1.7;">This confirmation was sent automatically after your payment method was selected on the website.</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
      </html>
    `
    
    const emailHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="margin: 0; padding: 0; font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: linear-gradient(180deg, #eff6ff 0%, #f8fafc 36%, #eef2ff 100%);">
        <table width="100%" cellpadding="0" cellspacing="0" style="padding: 36px 16px;">
          <tr>
            <td align="center">
              <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 640px; background-color: #ffffff; border: 1px solid #dbeafe; border-radius: 28px; overflow: hidden; box-shadow: 0 24px 60px rgba(15, 23, 42, 0.12);">
                <!-- Header -->
                <tr>
                  <td style="background: radial-gradient(circle at top left, #60a5fa 0%, #2563eb 38%, #0f172a 100%); padding: 34px 30px 28px 30px;">
                    <table width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="vertical-align: top;">
                          <p style="margin: 0 0 10px 0; color: #bfdbfe; font-size: 12px; letter-spacing: 0.24em; text-transform: uppercase; font-weight: 800;">GXZ Health Order Desk</p>
                          <h1 style="color: #ffffff; margin: 0; font-size: 30px; line-height: 1.1; font-weight: 800;">New order received</h1>
                          <p style="color: #dbeafe; margin: 10px 0 0 0; font-size: 15px; line-height: 1.7;">A fresh order just came through the store. Review the customer details, shipping fee, and total below.</p>
                        </td>
                        <td align="right" style="vertical-align: top;">
                          <div style="display: inline-block; border: 1px solid rgba(191, 219, 254, 0.35); border-radius: 18px; background: rgba(15, 23, 42, 0.3); padding: 14px 16px; text-align: left;">
                            <p style="margin: 0 0 6px 0; color: #bfdbfe; font-size: 11px; letter-spacing: 0.16em; text-transform: uppercase; font-weight: 800;">Order Number</p>
                            <p style="margin: 0; color: #ffffff; font-size: 18px; line-height: 1.4; font-weight: 800;">${escapeHtml(orderNumber)}</p>
                          </div>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>

                <tr>
                  <td style="padding: 22px 30px 8px 30px;">
                    <table width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="padding-right: 8px; padding-bottom: 12px;">
                          <div style="border: 1px solid #dbeafe; border-radius: 18px; background: #f8fbff; padding: 16px;">
                            <p style="margin: 0 0 6px 0; color: #64748b; font-size: 11px; letter-spacing: 0.16em; text-transform: uppercase; font-weight: 800;">Customer</p>
                            <p style="margin: 0; color: #0f172a; font-size: 16px; font-weight: 800;">${customerName}</p>
                          </div>
                        </td>
                        <td style="padding-left: 8px; padding-right: 8px; padding-bottom: 12px;">
                          <div style="border: 1px solid #dbeafe; border-radius: 18px; background: #f8fbff; padding: 16px;">
                            <p style="margin: 0 0 6px 0; color: #64748b; font-size: 11px; letter-spacing: 0.16em; text-transform: uppercase; font-weight: 800;">Payment</p>
                            <p style="margin: 0; color: #0f172a; font-size: 16px; font-weight: 800;">${paymentMethodLabel}</p>
                          </div>
                        </td>
                        <td style="padding-left: 8px; padding-bottom: 12px;">
                          <div style="border: 1px solid #dbeafe; border-radius: 18px; background: #f8fbff; padding: 16px;">
                            <p style="margin: 0 0 6px 0; color: #64748b; font-size: 11px; letter-spacing: 0.16em; text-transform: uppercase; font-weight: 800;">Shipping Fee</p>
                            <p style="margin: 0; color: #0f172a; font-size: 16px; font-weight: 800;">${formatCurrency(shippingCost)}</p>
                          </div>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
                
                <tr>
                  <td style="padding: 8px 30px 0 30px;">
                    <table width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="width: 50%; padding-right: 10px; vertical-align: top;">
                          <div style="border: 1px solid #e2e8f0; border-radius: 22px; background: #ffffff; padding: 24px;">
                            <p style="margin: 0 0 14px 0; color: #1d4ed8; font-size: 12px; letter-spacing: 0.18em; text-transform: uppercase; font-weight: 800;">Customer Information</p>
                            <table width="100%" cellpadding="0" cellspacing="0">
                              <tr>
                                <td style="padding: 7px 0; color: #64748b; font-size: 14px; width: 90px;">Name</td>
                                <td style="padding: 7px 0; color: #0f172a; font-size: 14px; font-weight: 700;">${customerName}</td>
                              </tr>
                              <tr>
                                <td style="padding: 7px 0; color: #64748b; font-size: 14px;">Email</td>
                                <td style="padding: 7px 0; color: #0f172a; font-size: 14px; font-weight: 700;">${customerEmail}</td>
                              </tr>
                              <tr>
                                <td style="padding: 7px 0; color: #64748b; font-size: 14px;">Phone</td>
                                <td style="padding: 7px 0; color: #0f172a; font-size: 14px; font-weight: 700;">${customerPhone}</td>
                              </tr>
                            </table>
                          </div>
                        </td>
                        <td style="width: 50%; padding-left: 10px; vertical-align: top;">
                          <div style="border: 1px solid #e2e8f0; border-radius: 22px; background: #ffffff; padding: 24px;">
                            <p style="margin: 0 0 14px 0; color: #1d4ed8; font-size: 12px; letter-spacing: 0.18em; text-transform: uppercase; font-weight: 800;">Delivery & Payment</p>
                            <table width="100%" cellpadding="0" cellspacing="0">
                              <tr>
                                <td style="padding: 7px 0; color: #64748b; font-size: 14px; width: 90px; vertical-align: top;">Address</td>
                                <td style="padding: 7px 0; color: #0f172a; font-size: 14px; font-weight: 700;">${addressHtml}</td>
                              </tr>
                              <tr>
                                <td style="padding: 7px 0; color: #64748b; font-size: 14px;">Method</td>
                                <td style="padding: 7px 0; color: #0f172a; font-size: 14px; font-weight: 700;">${paymentMethodLabel}</td>
                              </tr>
                              <tr>
                                <td style="padding: 7px 0; color: #64748b; font-size: 14px;">Shipping</td>
                                <td style="padding: 7px 0; color: #0f172a; font-size: 14px; font-weight: 700;">${formatCurrency(shippingCost)}</td>
                              </tr>
                            </table>
                            ${paymentProofHtml}
                          </div>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
                
                <tr>
                  <td style="padding: 24px 30px 0 30px;">
                    <table width="100%" cellpadding="0" cellspacing="0" style="border: 1px solid #e2e8f0; border-radius: 24px; overflow: hidden; background: #ffffff;">
                      <tr>
                        <td style="padding: 24px 24px 10px 24px;">
                          <div style="display: flex; align-items: center; justify-content: space-between; gap: 14px;">
                            <div>
                              <p style="margin: 0; color: #1d4ed8; font-size: 12px; letter-spacing: 0.18em; text-transform: uppercase; font-weight: 800;">Order Items</p>
                              <p style="margin: 8px 0 0 0; color: #64748b; font-size: 14px;">${itemCount} item${itemCount === 1 ? '' : 's'} in this order</p>
                            </div>
                            <div style="border-radius: 999px; background: #eff6ff; padding: 10px 14px; color: #1d4ed8; font-size: 13px; font-weight: 800;">
                              Total ${formatCurrency(totalPrice)}
                            </div>
                          </div>
                        </td>
                      </tr>
                      <thead>
                        <tr style="background-color: #f8fafc;">
                          <th style="padding: 12px 16px; text-align: left; color: #475569; font-size: 13px; font-weight: 700;">Product</th>
                          <th style="padding: 12px 16px; text-align: center; color: #475569; font-size: 13px; font-weight: 700;">Qty</th>
                          <th style="padding: 12px 16px; text-align: right; color: #475569; font-size: 13px; font-weight: 700;">Line Total</th>
                        </tr>
                      </thead>
                      <tbody>
                        ${itemsListHtml}
                      </tbody>
                    </table>
                  </td>
                </tr>
                
                <tr>
                  <td style="padding: 24px 30px 30px 30px;">
                    <table width="100%" cellpadding="0" cellspacing="0" style="background: linear-gradient(180deg, #eff6ff 0%, #f8fbff 100%); border: 1px solid #dbeafe; border-radius: 24px; padding: 24px;">
                      <tr>
                        <td style="color: #475569; font-size: 14px; padding-bottom: 12px;">Items subtotal</td>
                        <td style="color: #0f172a; font-size: 15px; font-weight: 700; text-align: right; padding-bottom: 12px;">${formatCurrency(subtotal)}</td>
                      </tr>
                      <tr>
                        <td style="color: #475569; font-size: 14px; padding-bottom: 16px;">Shipping fee</td>
                        <td style="color: #0f172a; font-size: 15px; font-weight: 700; text-align: right; padding-bottom: 16px;">${formatCurrency(shippingCost)}</td>
                      </tr>
                      ${promoSummaryRowHtml}
                      <tr>
                        <td style="border-top: 1px solid #bfdbfe; padding-top: 18px; color: #1d4ed8; font-size: 18px; font-weight: 800;">Total amount</td>
                        <td style="border-top: 1px solid #bfdbfe; padding-top: 18px; color: #2563eb; font-size: 30px; font-weight: 900; text-align: right;">${formatCurrency(totalPrice)}</td>
                      </tr>
                    </table>
                  </td>
                </tr>
                ${pipelineButtonsHtml}
                
                <tr>
                  <td style="background: #f8fafc; padding: 24px 30px 30px 30px; text-align: center; border-top: 1px solid #e2e8f0;">
                    <p style="color: #475569; font-size: 14px; margin: 0 0 8px 0; font-weight: 600;">GXZ Health order notification</p>
                    <p style="color: #94a3b8; font-size: 12px; margin: 0; line-height: 1.7;">This email was sent automatically when a customer completed checkout or submitted payment details on your website.</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
      </html>
    `

    console.log('📤 Sending to Resend API...')
    
    const resendResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${RESEND_API_KEY}`
      },
      body: JSON.stringify({
        from: 'orders@gxzhealth.com',
        to: ['jorizrule0@gmail.com', 'g@gxzhealth.com', 'g@gxzpeptides.com', 'jorizrule0915@gmail.com'],
        subject: `New Order ${orderNumber} from ${orderData.customer.name}`,
        html: emailHtml
      })
    })

    console.log('📨 Resend HTTP Status:', resendResponse.status)
    const responseData = await resendResponse.json()
    console.log('📨 Resend Response:', JSON.stringify(responseData, null, 2))
    
    if (!resendResponse.ok) {
      console.error('❌ Resend API failed!')
      return new Response(JSON.stringify({ 
        error: 'Failed to send email',
        resendError: responseData,
        status: resendResponse.status
      }), {
        status: resendResponse.status,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    console.log('✅ Email sent successfully!')
    let customerResponseData = null

    if (canEmailCustomer) {
      console.log('Sending customer confirmation email...')

      const customerResendResponse = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${RESEND_API_KEY}`
        },
        body: JSON.stringify({
          from: 'orders@gxzhealth.com',
          to: [customerEmailRaw],
          subject: `GXZ Health order confirmation ${orderNumber}`,
          html: customerEmailHtml
        })
      })

      console.log('Customer Resend HTTP Status:', customerResendResponse.status)
      customerResponseData = await customerResendResponse.json()
      console.log('Customer Resend Response:', JSON.stringify(customerResponseData, null, 2))

      if (!customerResendResponse.ok) {
        console.error('Customer confirmation email failed!')
        return new Response(JSON.stringify({
          error: 'Failed to send customer confirmation email',
          resendError: customerResponseData,
          status: customerResendResponse.status
        }), {
          status: customerResendResponse.status,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
      }
    } else {
      console.log('Customer confirmation skipped because customer email is missing or invalid')
    }

    return new Response(JSON.stringify({
      adminEmail: responseData,
      customerEmail: customerResponseData,
      customerEmailSent: canEmailCustomer,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })

  } catch (error) {
    console.error('💥 Function crashed:', error)
    return new Response(JSON.stringify({ 
      error: getErrorMessage(error),
      stack: getErrorStack(error),
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})
