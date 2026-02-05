-- Create Wallets Table
create table if not exists wallets (
  id uuid primary key,
  user_id uuid references auth.users not null,
  name text not null,
  type text not null, -- stored as text to be flexible
  balance numeric not null default 0,
  currency text not null check (currency in ('PKR', 'USD')),
  icon text,
  color text,
  created_at timestamptz default now()
);

-- Create Transactions Table
create table if not exists transactions (
  id uuid primary key,
  user_id uuid references auth.users not null,
  wallet_id uuid references wallets(id) on delete cascade,
  amount numeric not null,
  type text not null check (type in ('income', 'expense')),
  category_id text not null,
  reason text,
  date timestamptz not null,
  notes text,
  created_at timestamptz default now()
);

-- Enable Row Level Security (RLS)
alter table wallets enable row level security;
alter table transactions enable row level security;

-- Create Policies (Allow users to see/edit ONLY their own data)
create policy "Users can view their own wallets"
  on wallets for select
  using (auth.uid() = user_id);

create policy "Users can insert their own wallets"
  on wallets for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own wallets"
  on wallets for update
  using (auth.uid() = user_id);

create policy "Users can delete their own wallets"
  on wallets for delete
  using (auth.uid() = user_id);

create policy "Users can view their own transactions"
  on transactions for select
  using (auth.uid() = user_id);

create policy "Users can insert their own transactions"
  on transactions for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own transactions"
  on transactions for update
  using (auth.uid() = user_id);

create policy "Users can delete their own transactions"
  on transactions for delete
  using (auth.uid() = user_id);
