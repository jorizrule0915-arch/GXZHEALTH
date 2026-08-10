alter table public.orders
  add column if not exists shipping_carrier text,
  add column if not exists tracking_number text,
  add column if not exists shipment_status text default 'awaiting_tracking',
  add column if not exists tracking_updated_at timestamptz;

create table if not exists public.email_history (
  id uuid primary key default gen_random_uuid(),
  order_id uuid references public.orders(id) on delete cascade,
  recipient text not null,
  event text not null,
  provider_message_id text,
  status text not null default 'sent',
  error_message text,
  created_at timestamptz not null default now()
);

alter table public.email_history enable row level security;

