ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS payment_reference_id TEXT,
  ADD COLUMN IF NOT EXISTS payer_account_name TEXT,
  ADD COLUMN IF NOT EXISTS payment_submitted_at TIMESTAMPTZ;
