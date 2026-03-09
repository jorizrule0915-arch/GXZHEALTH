# Fix Database Access Issue

## Run this SQL in Supabase to fix the "no access" error:

1. Go to https://supabase.com/dashboard/project/qbfvorogmdkwepdhrdok/sql/new
2. Paste this SQL and click RUN:

```sql
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

CREATE INDEX IF NOT EXISTS idx_orders_created_at ON public.orders(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_orders_status ON public.orders(status);

-- Enable Row Level Security
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any
DROP POLICY IF EXISTS "Allow anonymous insert" ON public.orders;
DROP POLICY IF EXISTS "Allow public read" ON public.orders;

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
```

3. You should see "Success. No rows returned"
4. Now try placing an order again - it will save to the database!
5. Go to `/admin` to view all orders

## Verify it worked:
- Go to Table Editor in Supabase
- You should see "orders" table
- Place a test order on your site
- Check admin dashboard at `/admin`
