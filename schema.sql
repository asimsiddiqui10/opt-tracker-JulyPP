-- OPT EAD Tracker — Supabase schema
-- Run this whole file once in Supabase Studio → SQL Editor → New query → Run.
-- Safe to re-run: it drops and recreates everything.

drop function if exists public.add_entry cascade;
drop function if exists public.update_entry cascade;
drop function if exists public.delete_entry cascade;
drop function if exists public.save_entry cascade;
drop view if exists public.entries_public cascade;
drop table if exists public.entries cascade;

create table public.entries (
  username   text primary key,
  pp_date    date not null,
  status     text not null default 'waiting',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint status_valid check (status in
    ('waiting','api_update','approved','card_produced','delivered')),
  constraint pp_date_sane check (pp_date between date '2025-01-01' and date '2027-12-31'),
  constraint username_sane check (char_length(username) between 2 and 30)
);

-- Table is fully locked: RLS on, no policies, no grants. All access goes
-- through the view (read) and the function (write) below.
alter table public.entries enable row level security;
revoke all on public.entries from anon, authenticated;

create view public.entries_public as
  select username, pp_date, status, created_at, updated_at from public.entries;

alter view public.entries_public set (security_invoker = off);
grant select on public.entries_public to anon, authenticated;

-- One write path: insert if the username is new, update it if it already exists.
create or replace function public.save_entry(
  p_username text,
  p_pp_date  date,
  p_status   text
) returns void
language plpgsql security definer set search_path = public as $$
declare
  u text := lower(regexp_replace(trim(p_username), '^(/?u/)', ''));
begin
  if char_length(u) < 2 then
    raise exception 'bad_username';
  end if;

  insert into public.entries (username, pp_date, status)
  values (u, p_pp_date, p_status)
  on conflict (username) do update
    set pp_date = excluded.pp_date,
        status  = excluded.status,
        updated_at = now();
end $$;

grant execute on function public.save_entry to anon, authenticated;
