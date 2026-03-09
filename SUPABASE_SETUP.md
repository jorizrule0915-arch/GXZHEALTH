# Supabase Email Setup Guide

## ✅ Step 1: Get Resend API Key (FREE)

1. Go to https://resend.com/signup
2. Sign up with any email
3. Verify your email
4. Go to API Keys section
5. Click "Create API Key"
6. Copy the key (starts with `re_`)

## ✅ Step 2: Add API Key to Supabase

1. Go to https://supabase.com/dashboard/project/iravlhlgjseiherjdcrz/settings/vault
2. Click "New secret"
3. Name: `RESEND_API_KEY`
4. Value: Paste your Resend API key
5. Click "Save"

## ✅ Step 3: Deploy Email Function

Open terminal in your project folder and run:

```bash
npx supabase login
npx supabase link --project-ref iravlhlgjseiherjdcrz
npx supabase functions deploy send-order-email --no-verify-jwt
```

## ✅ Step 4: Test It

1. Run your website: `npm run dev`
2. Add items to cart
3. Go to checkout and fill form
4. Click payment method
5. Click "I've Completed the Payment"
6. Check emails: jorizrule0@gmail.com and g@gxzpeptides.com

## Done! 🎉

Your order emails will now be sent automatically to both addresses.
