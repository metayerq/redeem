-- À coller dans Supabase → SQL Editor → Run.
-- Crée la table des bons. RLS activé SANS policy : seule la clé secrète
-- (utilisée par les fonctions Vercel) peut lire/écrire — le navigateur
-- ne touche jamais la base directement.

create table if not exists public.vouchers (
  id bigint generated always as identity primary key,
  code text not null unique,
  email text not null unique,
  phone text not null default '',
  first_name text not null default '',
  marketing_opt_in boolean not null default false,
  created_at timestamptz not null default now(),
  redeemed_at timestamptz
);

alter table public.vouchers enable row level security;
