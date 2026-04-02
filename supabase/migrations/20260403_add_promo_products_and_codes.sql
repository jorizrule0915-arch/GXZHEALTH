-- Promo products and influencer promo codes
CREATE TABLE IF NOT EXISTS public.promo_products (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  sku TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.promo_codes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  promo_product_id UUID NOT NULL REFERENCES public.promo_products(id) ON DELETE CASCADE,
  code TEXT NOT NULL,
  influencer_name TEXT NOT NULL,
  discount_percent NUMERIC(5,2),
  expires_at TIMESTAMPTZ,
  usage_limit INTEGER,
  total_uses INTEGER NOT NULL DEFAULT 0,
  total_revenue NUMERIC(12,2) NOT NULL DEFAULT 0,
  last_used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT promo_codes_discount_percent_check CHECK (
    discount_percent IS NULL OR (discount_percent >= 0 AND discount_percent <= 100)
  ),
  CONSTRAINT promo_codes_usage_limit_check CHECK (
    usage_limit IS NULL OR usage_limit >= 1
  )
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_promo_codes_code_unique ON public.promo_codes (upper(code));
CREATE INDEX IF NOT EXISTS idx_promo_codes_product_id ON public.promo_codes (promo_product_id);
CREATE INDEX IF NOT EXISTS idx_promo_codes_expires_at ON public.promo_codes (expires_at);
CREATE INDEX IF NOT EXISTS idx_promo_codes_last_used_at ON public.promo_codes (last_used_at DESC);

ALTER TABLE public.promo_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.promo_codes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow anonymous read promo products" ON public.promo_products;
CREATE POLICY "Allow anonymous read promo products" ON public.promo_products
  FOR SELECT
  TO anon
  USING (true);

DROP POLICY IF EXISTS "Allow anonymous insert promo products" ON public.promo_products;
CREATE POLICY "Allow anonymous insert promo products" ON public.promo_products
  FOR INSERT
  TO anon
  WITH CHECK (true);

DROP POLICY IF EXISTS "Allow anonymous update promo products" ON public.promo_products;
CREATE POLICY "Allow anonymous update promo products" ON public.promo_products
  FOR UPDATE
  TO anon
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS "Allow anonymous delete promo products" ON public.promo_products;
CREATE POLICY "Allow anonymous delete promo products" ON public.promo_products
  FOR DELETE
  TO anon
  USING (true);

DROP POLICY IF EXISTS "Allow anonymous read promo codes" ON public.promo_codes;
CREATE POLICY "Allow anonymous read promo codes" ON public.promo_codes
  FOR SELECT
  TO anon
  USING (true);

DROP POLICY IF EXISTS "Allow anonymous insert promo codes" ON public.promo_codes;
CREATE POLICY "Allow anonymous insert promo codes" ON public.promo_codes
  FOR INSERT
  TO anon
  WITH CHECK (true);

DROP POLICY IF EXISTS "Allow anonymous update promo codes" ON public.promo_codes;
CREATE POLICY "Allow anonymous update promo codes" ON public.promo_codes
  FOR UPDATE
  TO anon
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS "Allow anonymous delete promo codes" ON public.promo_codes;
CREATE POLICY "Allow anonymous delete promo codes" ON public.promo_codes
  FOR DELETE
  TO anon
  USING (true);

ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS promo_code_id UUID REFERENCES public.promo_codes(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS promo_product_id UUID REFERENCES public.promo_products(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS promo_code TEXT,
  ADD COLUMN IF NOT EXISTS promo_discount_percent NUMERIC(5,2),
  ADD COLUMN IF NOT EXISTS promo_discount_amount NUMERIC(10,2) NOT NULL DEFAULT 0;

CREATE INDEX IF NOT EXISTS idx_orders_promo_code_id ON public.orders (promo_code_id);
CREATE INDEX IF NOT EXISTS idx_orders_promo_product_id ON public.orders (promo_product_id);

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.normalize_promo_code_value()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.code := upper(regexp_replace(coalesce(NEW.code, ''), '\s+', '', 'g'));
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.track_promo_code_usage()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.promo_code_id IS NULL THEN
    RETURN NEW;
  END IF;

  UPDATE public.promo_codes
  SET
    total_uses = total_uses + 1,
    total_revenue = total_revenue + GREATEST(COALESCE(NEW.total_price, 0), 0),
    last_used_at = COALESCE(NEW.created_at, NOW()),
    updated_at = NOW()
  WHERE id = NEW.promo_code_id;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS set_promo_products_updated_at ON public.promo_products;
CREATE TRIGGER set_promo_products_updated_at
  BEFORE UPDATE ON public.promo_products
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS set_promo_codes_updated_at ON public.promo_codes;
CREATE TRIGGER set_promo_codes_updated_at
  BEFORE UPDATE ON public.promo_codes
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS normalize_promo_code_before_save ON public.promo_codes;
CREATE TRIGGER normalize_promo_code_before_save
  BEFORE INSERT OR UPDATE ON public.promo_codes
  FOR EACH ROW
  EXECUTE FUNCTION public.normalize_promo_code_value();

DROP TRIGGER IF EXISTS track_promo_code_usage_on_insert ON public.orders;
CREATE TRIGGER track_promo_code_usage_on_insert
  AFTER INSERT ON public.orders
  FOR EACH ROW
  EXECUTE FUNCTION public.track_promo_code_usage();

CREATE OR REPLACE FUNCTION public.validate_promo_code(
  input_code TEXT,
  cart_items JSONB DEFAULT '[]'::jsonb
)
RETURNS TABLE (
  valid BOOLEAN,
  message TEXT,
  promo_code_id UUID,
  promo_product_id UUID,
  promo_product_name TEXT,
  code TEXT,
  influencer_name TEXT,
  discount_percent NUMERIC,
  expires_at TIMESTAMPTZ,
  usage_limit INTEGER,
  total_uses INTEGER
)
LANGUAGE plpgsql
STABLE
AS $$
DECLARE
  normalized_code TEXT := upper(regexp_replace(coalesce(input_code, ''), '\s+', '', 'g'));
  matched_code public.promo_codes%ROWTYPE;
  matched_product public.promo_products%ROWTYPE;
  has_matching_item BOOLEAN := false;
BEGIN
  IF normalized_code = '' THEN
    RETURN QUERY SELECT
      false,
      'Please enter a promo code.',
      NULL::UUID,
      NULL::UUID,
      NULL::TEXT,
      NULL::TEXT,
      NULL::TEXT,
      NULL::NUMERIC,
      NULL::TIMESTAMPTZ,
      NULL::INTEGER,
      NULL::INTEGER;
    RETURN;
  END IF;

  SELECT *
  INTO matched_code
  FROM public.promo_codes
  WHERE upper(code) = normalized_code;

  IF NOT FOUND THEN
    RETURN QUERY SELECT
      false,
      'Promo code not found.',
      NULL::UUID,
      NULL::UUID,
      NULL::TEXT,
      NULL::TEXT,
      NULL::TEXT,
      NULL::NUMERIC,
      NULL::TIMESTAMPTZ,
      NULL::INTEGER,
      NULL::INTEGER;
    RETURN;
  END IF;

  SELECT *
  INTO matched_product
  FROM public.promo_products
  WHERE id = matched_code.promo_product_id;

  IF NOT FOUND THEN
    RETURN QUERY SELECT
      false,
      'This promo code is not linked to a product.',
      matched_code.id,
      NULL::UUID,
      NULL::TEXT,
      matched_code.code,
      matched_code.influencer_name,
      matched_code.discount_percent,
      matched_code.expires_at,
      matched_code.usage_limit,
      matched_code.total_uses;
    RETURN;
  END IF;

  IF matched_code.expires_at IS NOT NULL AND matched_code.expires_at < NOW() THEN
    RETURN QUERY SELECT
      false,
      'This promo code has expired.',
      matched_code.id,
      matched_product.id,
      matched_product.name,
      matched_code.code,
      matched_code.influencer_name,
      matched_code.discount_percent,
      matched_code.expires_at,
      matched_code.usage_limit,
      matched_code.total_uses;
    RETURN;
  END IF;

  IF matched_code.usage_limit IS NOT NULL AND matched_code.total_uses >= matched_code.usage_limit THEN
    RETURN QUERY SELECT
      false,
      'This promo code has reached its usage limit.',
      matched_code.id,
      matched_product.id,
      matched_product.name,
      matched_code.code,
      matched_code.influencer_name,
      matched_code.discount_percent,
      matched_code.expires_at,
      matched_code.usage_limit,
      matched_code.total_uses;
    RETURN;
  END IF;

  IF jsonb_typeof(cart_items) = 'array' THEN
    SELECT EXISTS (
      SELECT 1
      FROM jsonb_array_elements(cart_items) AS item
      WHERE lower(coalesce(item ->> 'name', '')) LIKE '%' || lower(matched_product.name) || '%'
    )
    INTO has_matching_item;
  END IF;

  IF NOT has_matching_item THEN
    RETURN QUERY SELECT
      false,
      format('This code only works for %s.', matched_product.name),
      matched_code.id,
      matched_product.id,
      matched_product.name,
      matched_code.code,
      matched_code.influencer_name,
      matched_code.discount_percent,
      matched_code.expires_at,
      matched_code.usage_limit,
      matched_code.total_uses;
    RETURN;
  END IF;

  RETURN QUERY SELECT
    true,
    'Promo code applied successfully.',
    matched_code.id,
    matched_product.id,
    matched_product.name,
    matched_code.code,
    matched_code.influencer_name,
    matched_code.discount_percent,
    matched_code.expires_at,
    matched_code.usage_limit,
    matched_code.total_uses;
END;
$$;

INSERT INTO public.promo_products (name)
VALUES ('GXZ GLP-1')
ON CONFLICT (name) DO NOTHING;
