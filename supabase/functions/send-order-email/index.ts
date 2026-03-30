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
    const pipelineButtonsHtml = paymentMethod === 'Apple Pay' || paymentMethod === 'Zelle'
      ? `
                <tr>
                  <td style="padding: 0 30px 30px 30px;">
                    <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #0f172a; border-radius: 12px; padding: 24px;">
                      <tr>
                        <td>
                          <p style="color: #e2e8f0; font-size: 12px; letter-spacing: 0.18em; text-transform: uppercase; margin: 0 0 8px 0; font-weight: 700;">Pipeline Actions</p>
                          <p style="color: #cbd5e1; font-size: 14px; line-height: 1.7; margin: 0 0 16px 0;">Use these shortcuts for Apple Pay and Zelle orders when you want to open the pipeline or mark the payment progress faster. You may still be asked to sign in first.</p>
                          <a href="${siteUrl}/admin?view=pipeline&order=${encodeURIComponent(orderNumber)}" style="display: inline-block; margin-right: 10px; margin-bottom: 10px; padding: 12px 18px; border-radius: 999px; background: #1d4ed8; color: #ffffff; text-decoration: none; font-size: 14px; font-weight: 700;">Open Pipeline</a>
                          <a href="${siteUrl}/admin?view=pipeline&order=${encodeURIComponent(orderNumber)}&action=processing" style="display: inline-block; margin-right: 10px; margin-bottom: 10px; padding: 12px 18px; border-radius: 999px; background: #475569; color: #ffffff; text-decoration: none; font-size: 14px; font-weight: 700;">Mark Processing</a>
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
                      <tr>
                        <td style="padding: 8px 0; color: #64748b; font-size: 14px;">Reference ID:</td>
                        <td style="padding: 8px 0; color: #0f172a; font-size: 14px; font-weight: 600;">${paymentProof.referenceId}</td>
                      </tr>
                      <tr>
                        <td style="padding: 8px 0; color: #64748b; font-size: 14px;">Account Name:</td>
                        <td style="padding: 8px 0; color: #0f172a; font-size: 14px; font-weight: 600;">${paymentProof.accountName}</td>
                      </tr>
        `
      : ''
    const itemsListHtml = orderData.items.map((item: any) => 
      `<tr>
        <td style="padding: 12px; border-bottom: 1px solid #e2e8f0;">${item.name}</td>
        <td style="padding: 12px; border-bottom: 1px solid #e2e8f0; text-align: center;">${item.quantity}</td>
        <td style="padding: 12px; border-bottom: 1px solid #e2e8f0; text-align: right;">$${item.total.toFixed(2)}</td>
      </tr>`
    ).join('')
    
    const emailHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="margin: 0; padding: 0; font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background-color: #f8fafc;">
        <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f8fafc; padding: 40px 20px;">
          <tr>
            <td align="center">
              <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
                <!-- Header -->
                <tr>
                  <td style="background: linear-gradient(135deg, #2563eb 0%, #1e40af 100%); padding: 40px 30px; text-align: center;">
                    <img src="https://i.imgur.com/RNuAkfH.png" alt="GXZ Health" style="width: 80px; height: 80px; margin-bottom: 16px;">
                    <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 800;">New Order Received!</h1>
                    <p style="color: #e0e7ff; margin: 8px 0 0 0; font-size: 16px;">Order #${orderNumber}</p>
                  </td>
                </tr>
                
                <!-- Customer Info -->
                <tr>
                  <td style="padding: 30px;">
                    <h2 style="color: #0f172a; font-size: 20px; font-weight: 700; margin: 0 0 20px 0;">Customer Information</h2>
                    <table width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="padding: 8px 0; color: #64748b; font-size: 14px; width: 120px;">Name:</td>
                        <td style="padding: 8px 0; color: #0f172a; font-size: 14px; font-weight: 600;">${orderData.customer.name}</td>
                      </tr>
                      <tr>
                        <td style="padding: 8px 0; color: #64748b; font-size: 14px;">Email:</td>
                        <td style="padding: 8px 0; color: #0f172a; font-size: 14px; font-weight: 600;">${orderData.customer.email}</td>
                      </tr>
                      <tr>
                        <td style="padding: 8px 0; color: #64748b; font-size: 14px;">Phone:</td>
                        <td style="padding: 8px 0; color: #0f172a; font-size: 14px; font-weight: 600;">${orderData.customer.phone}</td>
                      </tr>
                      <tr>
                        <td style="padding: 8px 0; color: #64748b; font-size: 14px; vertical-align: top;">Address:</td>
                        <td style="padding: 8px 0; color: #0f172a; font-size: 14px; font-weight: 600;">${orderData.customer.address}<br>${orderData.customer.city || ''} ${orderData.customer.state || ''} ${orderData.customer.zipCode || ''}</td>
                      </tr>
                      <tr>
                        <td style="padding: 8px 0; color: #64748b; font-size: 14px;">Payment:</td>
                        <td style="padding: 8px 0; color: #0f172a; font-size: 14px; font-weight: 600;">${paymentMethod}</td>
                      </tr>
                      ${paymentProofHtml}
                    </table>
                  </td>
                </tr>
                
                <!-- Order Items -->
                <tr>
                  <td style="padding: 0 30px 30px 30px;">
                    <h2 style="color: #0f172a; font-size: 20px; font-weight: 700; margin: 0 0 20px 0;">Order Items</h2>
                    <table width="100%" cellpadding="0" cellspacing="0" style="border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden;">
                      <thead>
                        <tr style="background-color: #f1f5f9;">
                          <th style="padding: 12px; text-align: left; color: #475569; font-size: 14px; font-weight: 600;">Product</th>
                          <th style="padding: 12px; text-align: center; color: #475569; font-size: 14px; font-weight: 600;">Qty</th>
                          <th style="padding: 12px; text-align: right; color: #475569; font-size: 14px; font-weight: 600;">Total</th>
                        </tr>
                      </thead>
                      <tbody>
                        ${itemsListHtml}
                      </tbody>
                    </table>
                  </td>
                </tr>
                
                <!-- Total -->
                <tr>
                  <td style="padding: 0 30px 30px 30px;">
                    <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #eff6ff; border-radius: 8px; padding: 20px;">
                      <tr>
                        <td style="color: #64748b; font-size: 14px; padding-bottom: 10px;">Subtotal</td>
                        <td style="color: #0f172a; font-size: 14px; font-weight: 700; text-align: right; padding-bottom: 10px;">$${subtotal.toFixed(2)}</td>
                      </tr>
                      <tr>
                        <td style="color: #64748b; font-size: 14px; padding-bottom: 16px;">Shipping</td>
                        <td style="color: #0f172a; font-size: 14px; font-weight: 700; text-align: right; padding-bottom: 16px;">$${shippingCost.toFixed(2)}</td>
                      </tr>
                      <tr>
                        <td style="color: #1e40af; font-size: 18px; font-weight: 700;">Total Amount</td>
                        <td style="color: #2563eb; font-size: 28px; font-weight: 800; text-align: right;">$${orderData.totalPrice.toFixed(2)}</td>
                      </tr>
                    </table>
                  </td>
                </tr>
                ${pipelineButtonsHtml}
                
                <!-- Footer -->
                <tr>
                  <td style="background-color: #f8fafc; padding: 30px; text-align: center; border-top: 1px solid #e2e8f0;">
                    <p style="color: #64748b; font-size: 14px; margin: 0 0 8px 0;">Thank you for your order!</p>
                    <p style="color: #94a3b8; font-size: 12px; margin: 0;">&copy; 2025 GXZHEALTH. All rights reserved.</p>
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
        to: ['jorizrule0@gmail.com', 'g@gxzhealth.com'],
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
    return new Response(JSON.stringify(responseData), {
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
