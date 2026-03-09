-- Create orders table
CREATE TABLE IF NOT EXISTS orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number TEXT NOT NULL,
  customer_name TEXT NOT NULL,
  customer_email TEXT NOT NULL,
  customer_phone TEXT NOT NULL,
  customer_address TEXT NOT NULL,
  customer_city TEXT,
  customer_state TEXT,
  customer_zip TEXT,
  items JSONB NOT NULL,
  total_price DECIMAL(10,2) NOT NULL,
  payment_method TEXT,
  status TEXT DEFAULT 'processing',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

-- Allow anyone to insert orders
CREATE POLICY "Allow insert orders" ON orders FOR INSERT WITH CHECK (true);

-- Allow anyone to read orders
CREATE POLICY "Allow read orders" ON orders FOR SELECT USING (true);

-- Allow anyone to update order status
CREATE POLICY "Allow update orders" ON orders FOR UPDATE USING (true);
