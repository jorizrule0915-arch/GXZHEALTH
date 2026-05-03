-- Add minimum order requirement to promo codes
ALTER TABLE public.promo_codes
ADD COLUMN IF NOT EXISTS minimum_order_requirement INTEGER DEFAULT 0;

-- Add constraint for minimum_order_requirement
ALTER TABLE public.promo_codes
ADD CONSTRAINT promo_codes_minimum_order_check CHECK (
    minimum_order_requirement >= 0
);

-- Update validate_promo_code function to check minimum order requirement
CREATE OR REPLACE FUNCTION public.validate_promo_code(
  input_code TEXT,
  cart_items JSONB DEFAULT '[]'::jsonb,
  customer_email TEXT DEFAULT NULL
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
  total_uses INTEGER,
  minimum_order_requirement INTEGER
)
LANGUAGE plpgsql
STABLE
AS $$
DECLARE
  normalized_code TEXT := upper(regexp_replace(coalesce(input_code, ''), '\s+', '', 'g'));
  matched_code public.promo_codes%ROWTYPE;
  matched_product public.promo_products%ROWTYPE;
  has_matching_item BOOLEAN := false;
  customer_order_count INTEGER := 0;
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
      NULL::INTEGER,
      NULL::INTEGER;
    RETURN;
  END IF;

  SELECT *
  INTO matched_code
  FROM public.promo_codes AS pc
  WHERE upper(pc.code) = normalized_code;

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
      matched_code.total_uses,
      matched_code.minimum_order_requirement;
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
      matched_code.total_uses,
      matched_code.minimum_order_requirement;
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
      matched_code.total_uses,
      matched_code.minimum_order_requirement;
    RETURN;
  END IF;

  -- Check minimum order requirement if customer email is provided
  IF customer_email IS NOT NULL THEN
    SELECT COUNT(*)
    INTO customer_order_count
    FROM public.orders
    WHERE lower(customer_email) = lower(customer_email);

    IF customer_order_count < matched_code.minimum_order_requirement THEN
      RETURN QUERY SELECT
        false,
        format('This code requires %s completed order(s) to activate. You have %s order(s).', 
               matched_code.minimum_order_requirement, 
               customer_order_count),
        matched_code.id,
        matched_product.id,
        matched_product.name,
        matched_code.code,
        matched_code.influencer_name,
        matched_code.discount_percent,
        matched_code.expires_at,
        matched_code.usage_limit,
        matched_code.total_uses,
        matched_code.minimum_order_requirement;
      RETURN;
    END IF;
  END IF;

  IF jsonb_typeof(cart_items) = 'array' THEN
    SELECT EXISTS (
      SELECT 1
      FROM jsonb_array_elements(cart_items) AS item
      WHERE
        regexp_replace(lower(coalesce(item ->> 'name', '')), '[^a-z0-9]+', '', 'g')
          LIKE '%' || regexp_replace(lower(coalesce(matched_product.name, '')), '[^a-z0-9]+', '', 'g') || '%'
        OR (
          matched_product.sku IS NOT NULL
          AND regexp_replace(lower(coalesce(item ->> 'name', '')), '[^a-z0-9]+', '', 'g')
            LIKE '%' || regexp_replace(lower(matched_product.sku), '[^a-z0-9]+', '', 'g') || '%'
        )
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
      matched_code.total_uses,
      matched_code.minimum_order_requirement;
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
    matched_code.total_uses,
    matched_code.minimum_order_requirement;
END;
$$;