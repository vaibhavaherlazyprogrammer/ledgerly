-- Expenses: one row per expense, owned by a user
create table public.expenses (
  id         bigint generated always as identity primary key,
  user_id    uuid not null default auth.uid()
             references auth.users(id) on delete cascade,
  amount     numeric(12,2) not null check (amount > 0),
  category   text not null,
  spent_on   date not null,
  note       text not null default '',
  created_at timestamptz not null default now()
);

create index expenses_user_date_idx on public.expenses (user_id, spent_on desc);

-- Settings: one row per user (holds the monthly budget)
create table public.settings (
  user_id uuid primary key default auth.uid()
          references auth.users(id) on delete cascade,
  budget  numeric(12,2) not null default 20000 check (budget > 0)
);

-- Privacy: turn on row level security
alter table public.expenses enable row level security;
alter table public.settings enable row level security;

-- Each user can only touch their own rows
create policy "own expenses select" on public.expenses
  for select using (auth.uid() = user_id);
create policy "own expenses insert" on public.expenses
  for insert with check (auth.uid() = user_id);
create policy "own expenses delete" on public.expenses
  for delete using (auth.uid() = user_id);

create policy "own settings select" on public.settings
  for select using (auth.uid() = user_id);
create policy "own settings insert" on public.settings
  for insert with check (auth.uid() = user_id);
create policy "own settings update" on public.settings
  for update using (auth.uid() = user_id);