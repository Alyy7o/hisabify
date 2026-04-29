-- Create Settlements Table
create table if not exists settlements (
  id uuid primary key,
  user_id uuid references auth.users not null,
  person_name text not null,
  title text not null,
  kind text not null,
  total_amount numeric not null,
  paid_amount numeric not null default 0,
  remaining_amount numeric not null default 0,
  status text not null,
  due_date timestamptz,
  wallet_id uuid,
  notes text,
  split_total_amount numeric,
  split_people_count integer,
  your_share numeric,
  movements jsonb default '[]'::jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Enable Row Level Security (RLS)
alter table settlements enable row level security;

-- Create Policies (Allow users to see/edit ONLY their own data)
create policy "Users can view their own settlements"
  on settlements for select
  using (auth.uid() = user_id);

create policy "Users can insert their own settlements"
  on settlements for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own settlements"
  on settlements for update
  using (auth.uid() = user_id);

create policy "Users can delete their own settlements"
  on settlements for delete
  using (auth.uid() = user_id);
