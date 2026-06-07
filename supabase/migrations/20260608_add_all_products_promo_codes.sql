-- Allow promo codes to apply to every product by linking them to the All Products bucket.
INSERT INTO public.promo_products (name, sku)
SELECT 'All Products', '__ALL__'
WHERE NOT EXISTS (
  SELECT 1
  FROM public.promo_products
  WHERE sku = '__ALL__' OR lower(name) = 'all products'
);

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
  normalized_product_name TEXT;
  normalized_product_sku TEXT;
  has_matching_item BOOLEAN := false;
  is_all_products_code BOOLEAN := false;
  customer_order_count INTEGER := 0;
  required_orders INTEGER := 0;
BEGIN
  IF normalized_code = '' THEN
    RETURN QUERY SELECT false, 'Please enter a promo code.', NULL::UUID, NULL::UUID, NULL::TEXT, NULL::TEXT, NULL::TEXT, NULL::NUMERIC, NULL::TIMESTAMPTZ, NULL::INTEGER, NULL::INTEGER, NULL::INTEGER;
    RETURN;
  END IF;

  SELECT *
  INTO matched_code
  FROM public.promo_codes AS pc
  WHERE upper(pc.code) = normalized_code;

  IF NOT FOUND THEN
    RETURN QUERY SELECT false, 'Promo code not found.', NULL::UUID, NULL::UUID, NULL::TEXT, NULL::TEXT, NULL::TEXT, NULL::NUMERIC, NULL::TIMESTAMPTZ, NULL::INTEGER, NULL::INTEGER, NULL::INTEGER;
    RETURN;
  END IF;

  SELECT *
  INTO matched_product
  FROM public.promo_products
  WHERE id = matched_code.promo_product_id;

  required_orders := coalesce(matched_code.minimum_order_requirement, 0);

  IF NOT FOUND THEN
    RETURN QUERY SELECT false, 'This promo code is not linked to a product.', matched_code.id, NULL::UUID, NULL::TEXT, matched_code.code, matched_code.influencer_name, matched_code.discount_percent, matched_code.expires_at, matched_code.usage_limit, matched_code.total_uses, required_orders;
    RETURN;
  END IF;

  is_all_products_code := matched_product.sku = '__ALL__' OR lower(matched_product.name) = 'all products';

  IF matched_code.expires_at IS NOT NULL AND matched_code.expires_at < NOW() THEN
    RETURN QUERY SELECT false, 'This promo code has expired.', matched_code.id, matched_product.id, matched_product.name, matched_code.code, matched_code.influencer_name, matched_code.discount_percent, matched_code.expires_at, matched_code.usage_limit, matched_code.total_uses, required_orders;
    RETURN;
  END IF;

  IF matched_code.usage_limit IS NOT NULL AND matched_code.total_uses >= matched_code.usage_limit THEN
    RETURN QUERY SELECT false, 'This promo code has reached its usage limit.', matched_code.id, matched_product.id, matched_product.name, matched_code.code, matched_code.influencer_name, matched_code.discount_percent, matched_code.expires_at, matched_code.usage_limit, matched_code.total_uses, required_orders;
    RETURN;
  END IF;

  IF required_orders > 0 THEN
    IF customer_email IS NULL OR btrim(customer_email) = '' THEN
      RETURN QUERY SELECT false, 'Please enter your email address before applying this promo code.', matched_code.id, matched_product.id, matched_product.name, matched_code.code, matched_code.influencer_name, matched_code.discount_percent, matched_code.expires_at, matched_code.usage_limit, matched_code.total_uses, required_orders;
      RETURN;
    END IF;

    SELECT COUNT(*)
    INTO customer_order_count
    FROM public.orders AS o
    WHERE lower(o.customer_email) = lower(customer_email)
      AND o.status IN ('complete', 'completed');

    IF customer_order_count < required_orders THEN
      RETURN QUERY SELECT
        false,
        format('This code requires %s completed order(s) to activate. You have %s completed order(s).', required_orders, customer_order_count),
        matched_code.id,
        matched_product.id,
        matched_product.name,
        matched_code.code,
        matched_code.influencer_name,
        matched_code.discount_percent,
        matched_code.expires_at,
        matched_code.usage_limit,
        matched_code.total_uses,
        required_orders;
      RETURN;
    END IF;
  END IF;

  IF is_all_products_code THEN
    has_matching_item := jsonb_typeof(cart_items) = 'array' AND jsonb_array_length(cart_items) > 0;
  ELSE
    normalized_product_name := regexp_replace(lower(coalesce(matched_product.name, '')), '[^a-z0-9]+', '', 'g');
    normalized_product_sku := regexp_replace(lower(coalesce(matched_product.sku, '')), '[^a-z0-9]+', '', 'g');

    IF jsonb_typeof(cart_items) = 'array' THEN
      SELECT EXISTS (
        SELECT 1
        FROM jsonb_array_elements(cart_items) AS item
        CROSS JOIN LATERAL (
          SELECT regexp_replace(lower(coalesce(item ->> 'name', '')), '[^a-z0-9]+', '', 'g') AS item_name
        ) AS normalized
        WHERE
          normalized.item_name LIKE '%' || normalized_product_name || '%'
          OR normalized_product_name LIKE '%' || normalized.item_name || '%'
          OR (
            normalized_product_sku <> ''
            AND (
              normalized.item_name LIKE '%' || normalized_product_sku || '%'
              OR normalized_product_sku LIKE '%' || normalized.item_name || '%'
            )
          )
      )
      INTO has_matching_item;
    END IF;
  END IF;

  IF NOT has_matching_item THEN
    RETURN QUERY SELECT
      false,
      CASE
        WHEN is_all_products_code THEN 'Add items to your cart before applying this code.'
        ELSE format('This code only works for %s.', matched_product.name)
      END,
      matched_code.id,
      matched_product.id,
      matched_product.name,
      matched_code.code,
      matched_code.influencer_name,
      matched_code.discount_percent,
      matched_code.expires_at,
      matched_code.usage_limit,
      matched_code.total_uses,
      required_orders;
    RETURN;
  END IF;

  RETURN QUERY SELECT true, 'Promo code applied successfully.', matched_code.id, matched_product.id, matched_product.name, matched_code.code, matched_code.influencer_name, matched_code.discount_percent, matched_code.expires_at, matched_code.usage_limit, matched_code.total_uses, required_orders;
END;
$$;
