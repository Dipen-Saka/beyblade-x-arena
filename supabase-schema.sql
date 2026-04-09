-- ============================================================
--  BEYBLADE X TOURNAMENT ARENA — SUPABASE SQL SCHEMA
--  Paste this entire file into:
--  Supabase Dashboard → SQL Editor → New query → Run
-- ============================================================

-- 1. PROFILES (mirrors auth.users, stores role + email)
create table public.profiles (
  id         uuid primary key references auth.users(id) on delete cascade,
  email      text not null,
  role       text not null default 'user' check (role in ('admin','user')),
  created_at timestamptz default now()
);

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into public.profiles (id, email, role)
  values (
    new.id,
    new.email,
    case when new.email = current_setting('app.admin_email', true) then 'admin' else 'user' end
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- 2. PARTS
create table public.parts (
  id              uuid primary key default gen_random_uuid(),
  name            text not null,
  type            text not null check (type in ('blade','ratchet','bit')),
  image_url       text,
  total_stock     integer not null default 1 check (total_stock >= 0),
  available_stock integer not null default 1 check (available_stock >= 0),
  created_at      timestamptz default now()
);

-- 3. RENTALS
create table public.rentals (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users(id) on delete cascade,
  status     text not null default 'active' check (status in ('active','returned')),
  created_at timestamptz default now()
);

-- 4. RENTAL_ITEMS (junction: rental ↔ part)
create table public.rental_items (
  id        uuid primary key default gen_random_uuid(),
  rental_id uuid not null references public.rentals(id) on delete cascade,
  part_id   uuid not null references public.parts(id) on delete restrict,
  created_at timestamptz default now()
);

-- ============================================================
--  ROW LEVEL SECURITY
-- ============================================================

alter table public.profiles    enable row level security;
alter table public.parts       enable row level security;
alter table public.rentals     enable row level security;
alter table public.rental_items enable row level security;

-- PROFILES: users see their own, admins see all
create policy "Users can view own profile"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Admins can view all profiles"
  on public.profiles for select
  using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role = 'admin'
    )
  );

-- PARTS: everyone can read, only admins can write
create policy "Anyone can read parts"
  on public.parts for select
  using (true);

create policy "Admins can insert parts"
  on public.parts for insert
  with check (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );

create policy "Admins can update parts"
  on public.parts for update
  using (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );

create policy "Admins can delete parts"
  on public.parts for delete
  using (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );

-- RENTALS: users see/create their own, admins see all
create policy "Users can view own rentals"
  on public.rentals for select
  using (auth.uid() = user_id);

create policy "Users can insert own rentals"
  on public.rentals for insert
  with check (auth.uid() = user_id);

create policy "Users can update own rentals"
  on public.rentals for update
  using (auth.uid() = user_id);

create policy "Admins can view all rentals"
  on public.rentals for select
  using (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );

create policy "Admins can update all rentals"
  on public.rentals for update
  using (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );

-- RENTAL_ITEMS: users see their own, admins see all
create policy "Users can view own rental items"
  on public.rental_items for select
  using (
    exists (
      select 1 from public.rentals r
      where r.id = rental_id and r.user_id = auth.uid()
    )
  );

create policy "Users can insert own rental items"
  on public.rental_items for insert
  with check (
    exists (
      select 1 from public.rentals r
      where r.id = rental_id and r.user_id = auth.uid()
    )
  );

create policy "Admins can view all rental items"
  on public.rental_items for select
  using (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );

-- ============================================================
--  STOCK MANAGEMENT FUNCTIONS (called from the app via rpc)
-- ============================================================

-- Decrement available_stock by 1 (called when a part is rented)
create or replace function public.decrement_stock(part_id uuid)
returns void language plpgsql security definer as $$
begin
  update public.parts
  set available_stock = greatest(0, available_stock - 1)
  where id = part_id;
end;
$$;

-- Increment available_stock by 1 (called when a part is returned)
create or replace function public.increment_stock(part_id uuid)
returns void language plpgsql security definer as $$
begin
  update public.parts
  set available_stock = least(total_stock, available_stock + 1)
  where id = part_id;
end;
$$;

-- ============================================================
--  SAMPLE SEED DATA (optional — delete if you want a clean start)
-- ============================================================

insert into public.parts (name, type, image_url, total_stock, available_stock) values
  ('Dran Sword',    'blade',   null, 3, 3),
  ('Hell Scythe',   'blade',   null, 2, 2),
  ('Wizard Arrow',  'blade',   null, 3, 3),
  ('Knight Shield', 'blade',   null, 2, 2),
  ('Cobalt Drake',  'blade',   null, 3, 3),
  ('Viper Tail',    'blade',   null, 2, 2),
  ('3-60 Ratchet',  'ratchet', null, 4, 4),
  ('4-60 Ratchet',  'ratchet', null, 3, 3),
  ('5-60 Ratchet',  'ratchet', null, 3, 3),
  ('3-80 Ratchet',  'ratchet', null, 3, 3),
  ('5-70 Ratchet',  'ratchet', null, 2, 2),
  ('Point Bit',     'bit',     null, 3, 3),
  ('Flat Bit',      'bit',     null, 2, 2),
  ('Ball Bit',      'bit',     null, 3, 3),
  ('Needle Bit',    'bit',     null, 2, 2),
  ('Taper Bit',     'bit',     null, 3, 3);
