ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

DROP POLICY IF EXISTS "Allow anonymous delete orders" ON public.orders;
CREATE POLICY "Allow anonymous delete orders" ON public.orders
  FOR DELETE
  TO anon
  USING (true);

CREATE TABLE IF NOT EXISTS public.products (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  slug TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  long_description TEXT,
  category TEXT NOT NULL,
  price NUMERIC(10,2) NOT NULL DEFAULT 0,
  image_url TEXT,
  gallery JSONB NOT NULL DEFAULT '[]'::jsonb,
  features JSONB NOT NULL DEFAULT '[]'::jsonb,
  highlights JSONB NOT NULL DEFAULT '[]'::jsonb,
  options JSONB NOT NULL DEFAULT '[]'::jsonb,
  in_stock BOOLEAN NOT NULL DEFAULT true,
  is_active BOOLEAN NOT NULL DEFAULT true,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_products_sort_order ON public.products(sort_order ASC, created_at ASC);
CREATE INDEX IF NOT EXISTS idx_products_active ON public.products(is_active);

ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow anonymous read products" ON public.products;
CREATE POLICY "Allow anonymous read products" ON public.products
  FOR SELECT
  TO anon
  USING (true);

DROP POLICY IF EXISTS "Allow anonymous insert products" ON public.products;
CREATE POLICY "Allow anonymous insert products" ON public.products
  FOR INSERT
  TO anon
  WITH CHECK (true);

DROP POLICY IF EXISTS "Allow anonymous update products" ON public.products;
CREATE POLICY "Allow anonymous update products" ON public.products
  FOR UPDATE
  TO anon
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS "Allow anonymous delete products" ON public.products;
CREATE POLICY "Allow anonymous delete products" ON public.products
  FOR DELETE
  TO anon
  USING (true);

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS set_products_updated_at ON public.products;
CREATE TRIGGER set_products_updated_at
  BEFORE UPDATE ON public.products
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS set_orders_updated_at ON public.orders;
CREATE TRIGGER set_orders_updated_at
  BEFORE UPDATE ON public.orders
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

INSERT INTO public.products (
  slug,
  name,
  description,
  long_description,
  category,
  price,
  features,
  highlights,
  options,
  sort_order
)
VALUES
  (
    'syringe',
    'Syringe',
    'Available in Small (1ml 30g), Mini (0.5ml 30g), and Large (3ml 23g) with sterile packaging.',
    'GXZ syringes are designed for clean, precise handling with dependable sterile packaging. Choose from multiple sizes depending on the application, with each box including 100 pieces for consistent lab or wellness support use.',
    'Accessory',
    15.00,
    '["Sterile packaging","Multiple sizes","100 per box"]'::jsonb,
    '["Small, mini, and large sizes","Easy-to-read barrel markings","Individually prepared for reliable handling"]'::jsonb,
    '[{"label":"Small (1ml 30g)","value":"small","price":15},{"label":"Mini (0.5ml 30g)","value":"mini","price":15},{"label":"Large (3ml 23g)","value":"large","price":15}]'::jsonb,
    1
  ),
  (
    'cartridge',
    'Disposable 3mL Cartridges',
    'Standard 3mL cartridges compatible with GXZ reusable pens.',
    'GXZ disposable cartridges are built for a clean fit inside reusable GXZ injection pens. Each set includes 10 cartridges with a stable 3mL capacity to keep replacements easy and consistent.',
    'Cartridge',
    10.00,
    '["3mL capacity","Universal GXZ fit","10 per set"]'::jsonb,
    '["Reliable replacement option","Built for GXZ reusable pens","Compact set for easy stocking"]'::jsonb,
    '[]'::jsonb,
    2
  ),
  (
    'pen',
    'Reusable Injection Pens',
    'Precision-engineered metal injection pen with adjustable dosing dial.',
    'The GXZ reusable injection pen is built for repeat use with a durable metal body and a comfortable adjustable dosing dial. It is designed to feel premium in hand while keeping daily use simple and dependable.',
    'Pen',
    20.00,
    '["Metal construction","Adjustable dial","Reusable design"]'::jsonb,
    '["Premium metal finish","Smooth dose control","Designed for long-term use"]'::jsonb,
    '[{"label":"Matte Black","value":"matte-black","price":20},{"label":"Silver","value":"silver","price":20},{"label":"Rose Gold","value":"rose-gold","price":20}]'::jsonb,
    3
  ),
  (
    'needles',
    'Single-Use Pen Needles',
    'Standard micro-tip pen needles with a smooth sterile finish.',
    'GXZ single-use pen needles are designed for a smoother, more comfortable attachment experience. Every box includes 100 ultra-fine needles, making them a convenient staple alongside reusable pens.',
    'Needle',
    8.00,
    '["Ultra-fine micro-tip","100 per box","Clean sterile finish"]'::jsonb,
    '["Works with GXZ pens","Designed for controlled use","Compact, easy-to-store packaging"]'::jsonb,
    '[{"label":"Standard Micro-Tip (32g x 4mm)","value":"32g-4mm","price":8},{"label":"Standard Micro-Tip (31g x 8mm)","value":"31g-8mm","price":8}]'::jsonb,
    4
  ),
  (
    'body-balm',
    'GXZ Health Nourishing Body Balm',
    'Deeply moisturizing body balm with cocoa butter, shea butter, and squalane.',
    'GXZ Health Nourishing Body Balm is a deeply moisturizing skin treatment formulated with cocoa butter, shea butter, and squalane. Its lightweight, fast-absorbing formula leaves skin silky smooth all day long without grease or heavy residue.',
    'Skincare',
    16.99,
    '["Cocoa butter","Shea butter","Squalane"]'::jsonb,
    '["Deep moisture for dry skin","Lightweight and non-greasy","Comfortable daily-use finish"]'::jsonb,
    '[{"label":"Aloe Scent","value":"aloe","price":16.99},{"label":"Unscented","value":"unscented","price":16.99},{"label":"Pack (Both)","value":"pack","price":23.99}]'::jsonb,
    5
  ),
  (
    'creatine',
    'GXZ Health Creatine Performance Matrix Powder',
    'Micronized creatine blend to support strength, endurance, and recovery.',
    'GXZ Health Creatine Performance Matrix Powder is built to support strength output, workout endurance, and hydration support during training. The formula mixes cleanly and fits easily into a daily performance routine.',
    'Supplement',
    29.99,
    '["Boosts strength","Enhances endurance","Supports recovery"]'::jsonb,
    '["Easy daily performance support","Mixes smoothly","Clean supplement profile"]'::jsonb,
    '[]'::jsonb,
    6
  )
ON CONFLICT (slug) DO UPDATE
SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  long_description = EXCLUDED.long_description,
  category = EXCLUDED.category,
  price = EXCLUDED.price,
  features = EXCLUDED.features,
  highlights = EXCLUDED.highlights,
  options = EXCLUDED.options,
  sort_order = EXCLUDED.sort_order;
