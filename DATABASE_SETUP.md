# Database Setup Instructions

## To see orders in admin dashboard, you need to create the orders table in Supabase:

1. Go to https://supabase.com/dashboard
2. Select your project: qbfvorogmdkwepdhrdok
3. Click on "SQL Editor" in the left sidebar
4. Click "New Query"
5. Copy and paste this SQL:

```sql
CREATE TABLE IF NOT EXISTS orders (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  order_number TEXT UNIQUE NOT NULL,
  items JSONB NOT NULL,
  total_items INTEGER NOT NULL,
  total_price DECIMAL(10,2) NOT NULL,
  payment_method TEXT,
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_orders_created_at ON orders(created_at DESC);
CREATE INDEX idx_orders_status ON orders(status);
```

6. Click "Run" button
7. You should see "Success. No rows returned"

Now orders will be saved and visible in the admin dashboard!
