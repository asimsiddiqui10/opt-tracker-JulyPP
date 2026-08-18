-- OPT EAD Tracker — Supabase schema
-- Run once in Supabase Studio → SQL Editor → New query → Run.
-- Safe to re-run: it drops and recreates the table.

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

-- RLS on with zero policies = the anon/publishable key can do nothing at all.
-- Only the server-side secret key (which bypasses RLS) can read or write, and
-- that key lives in Vercel's environment variables, never in the browser.
alter table public.entries enable row level security;
