-- ╔══════════════════════════════════════════════════════╗
-- ║  Vorratsverwaltung – Supabase Schema                 ║
-- ║  In der Supabase SQL-Konsole ausführen               ║
-- ╚══════════════════════════════════════════════════════╝

-- ── Items ────────────────────────────────────────────────
create table if not exists public.items (
  id          bigint generated always as identity primary key,
  user_id     uuid references auth.users(id) on delete cascade not null,
  name        text not null,
  qty         numeric,
  unit        text default 'Stück',
  location    text not null,
  stored_at   date default current_date,
  expires_at  date,
  category    text,
  note        text,
  ean         text,
  created_at  timestamptz default now(),
  updated_at  timestamptz default now()
);

-- Auto-update timestamp
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end; $$;

create trigger items_updated_at
  before update on public.items
  for each row execute procedure public.set_updated_at();

-- Row Level Security: jeder Nutzer sieht/bearbeitet nur seine eigenen Daten
alter table public.items enable row level security;

create policy "Eigene Artikel lesen"
  on public.items for select
  using (auth.uid() = user_id);

create policy "Eigene Artikel erstellen"
  on public.items for insert
  with check (auth.uid() = user_id);

create policy "Eigene Artikel aktualisieren"
  on public.items for update
  using (auth.uid() = user_id);

create policy "Eigene Artikel löschen"
  on public.items for delete
  using (auth.uid() = user_id);

-- ── Stammdaten (geteilt zwischen allen Nutzern) ──────────
create table if not exists public.locations (
  id         bigint generated always as identity primary key,
  name       text not null,
  icon       text default '📦',
  note       text,
  created_at timestamptz default now()
);

create table if not exists public.foods (
  id           bigint generated always as identity primary key,
  name         text not null,
  category     text,
  default_unit text default 'Stück',
  note         text,
  created_at   timestamptz default now()
);

create table if not exists public.units (
  id         bigint generated always as identity primary key,
  name       text not null,
  abbr       text,
  note       text,
  created_at timestamptz default now()
);

-- Stammdaten öffentlich lesbar (kein Login nötig für Dropdowns)
alter table public.locations enable row level security;
alter table public.foods      enable row level security;
alter table public.units      enable row level security;

create policy "Lesen" on public.locations for select using (true);
create policy "Schreiben" on public.locations for all using (auth.role() = 'authenticated');
create policy "Lesen" on public.foods for select using (true);
create policy "Schreiben" on public.foods for all using (auth.role() = 'authenticated');
create policy "Lesen" on public.units for select using (true);
create policy "Schreiben" on public.units for all using (auth.role() = 'authenticated');
