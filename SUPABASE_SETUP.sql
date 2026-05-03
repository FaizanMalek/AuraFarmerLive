-- Aura Farmer — run entire file in Supabase SQL Editor (Dashboard → SQL → New query)

create extension if not exists "pgcrypto";

create table figures (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text unique not null,
  description text,
  avatar_initials text,
  avatar_color text,
  score bigint default 0,
  created_at timestamptz default now()
);

create table votes (
  id uuid primary key default gen_random_uuid(),
  figure_id uuid references figures (id),
  direction text check (direction in ('up', 'down')),
  created_at timestamptz default now()
);

alter table figures enable row level security;
alter table votes enable row level security;

create policy "public read figures"
  on figures for select using (true);

create policy "public read votes"
  on votes for select using (true);

-- No direct anon insert/update on votes or figures: voting goes through SECURITY DEFINER RPC below.

-- Atomically writes the vote row and adjusts score (+/- 100).
create or replace function public.submit_vote(p_figure_id uuid, p_direction text)
returns bigint
language plpgsql
security definer
set search_path = public
as $$
declare
  delta bigint;
  new_score bigint;
begin
  if p_direction is null or p_direction not in ('up', 'down') then
    raise exception 'invalid direction';
  end if;

  delta := case when p_direction = 'up' then 100 else -100 end;

  insert into votes (figure_id, direction)
  values (p_figure_id, p_direction);

  update figures
  set score = score + delta
  where id = p_figure_id
  returning score into new_score;

  if new_score is null then
    raise exception 'figure not found';
  end if;

  return new_score;
end;
$$;

revoke all on function public.submit_vote(uuid, text) from public;
grant execute on function public.submit_vote(uuid, text) to anon;
grant execute on function public.submit_vote(uuid, text) to authenticated;

insert into figures (name, slug, description, avatar_initials, avatar_color, score) values
  ('Elon Musk', 'elon-musk', 'CEO of Tesla, SpaceX, X', 'EM', '#1a3a5c', 1240),
  ('Taylor Swift', 'taylor-swift', 'Singer-Songwriter', 'TS', '#4a1a2c', 4800),
  ('LeBron James', 'lebron-james', 'NBA Legend', 'LJ', '#1a3a1a', 3600),
  ('Mark Zuckerberg', 'mark-zuckerberg', 'CEO of Meta', 'MZ', '#2a1a4a', 890),
  ('Billie Eilish', 'billie-eilish', 'Musician & Artist', 'BE', '#1a3a2a', 2900),
  ('Drake', 'drake', 'Rapper & Producer', 'DR', '#3a2a1a', 1500),
  ('Rihanna', 'rihanna', 'Musician & Entrepreneur', 'RI', '#3a1a1a', 3100),
  ('Jeff Bezos', 'jeff-bezos', 'Founder of Amazon', 'JB', '#2a2a1a', 600);
