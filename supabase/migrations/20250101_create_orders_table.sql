-- Create orders table with public access
CREATE TABLE IF NOT EXISTS public.orders (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  order_number TEXT UNIQUE NOT NULL,
  items JSONB NOT NULL,
  total_items INTEGER NOT NULL,
  total_price DECIMAL(10,2) NOT NULL,
  payment_method TEXT,
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_orders_created_at ON public.orders(created_at DESC);
CREATE INDEX idx_orders_status ON public.orders(status);

-- Enable Row Level Security
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

-- Allow anonymous inserts (for customers placing orders)
CREATE POLICY "Allow anonymous insert" ON public.orders
  FOR INSERT
  TO anon
  WITH CHECK (true);

-- Allow public read access (for admin dashboard)
CREATE POLICY "Allow public read" ON public.orders
  FOR SELECT
  TO anon
  USING (true);
