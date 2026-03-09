# Email Notification Setup

## You need to set up Resend API for email notifications:

### Step 1: Get Resend API Key
1. Go to https://resend.com/signup
2. Sign up for free account
3. Go to API Keys section
4. Create new API key
5. Copy the API key

### Step 2: Add API Key to Supabase
1. Go to https://supabase.com/dashboard/project/qbfvorogmdkwepdhrdok/settings/functions
2. Click "Edge Functions" → "Manage secrets"
3. Add new secret:
   - Name: `RESEND_API_KEY`
   - Value: (paste your Resend API key)

### Step 3: Deploy Email Function
Run this command in terminal:
```bash
npx supabase functions deploy send-order-email
```

### Step 4: Test
1. Place a test order on your website
2. Click "I've Completed Payment"
3. Check your emails: jorizrule0@gmail.com and g@gxzpeptides.com

## What happens when customer places order:
- Customer fills shipping info on checkout page
- Customer name appears on payment page
- When they click "I've Completed Payment":
  - Email sent to both your emails with:
    - Order number
    - Customer name, email, phone, address
    - Items ordered
    - Total amount
    - Payment method used
  - Cart is cleared
  - Thank you message shown

## Alternative: Use EmailJS (No Supabase needed)
If you prefer simpler setup, I can switch to EmailJS which works directly from the browser.
