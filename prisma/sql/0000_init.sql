create extension if not exists pgcrypto;

create table if not exists listings (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  address text not null,
  rent_amount numeric(10, 2) not null,
  rooms integer not null,
  created_at timestamptz not null default now()
);

create table if not exists applications (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid not null references listings (id) on delete cascade,
  applicant_name text not null,
  income numeric(10, 2) not null,
  has_permanent_contract boolean not null,
  household_size integer not null,
  has_mietschuldenfrei boolean not null,
  has_schufa boolean not null,
  raw_message text not null,
  score numeric(5, 2),
  risk_flags jsonb not null default '[]'::jsonb,
  status text not null default 'pending',
  created_at timestamptz not null default now(),
  constraint applications_status_check check (
    status in ('pending', 'shortlisted', 'rejected')
  )
);

create index if not exists applications_listing_id_idx on applications (listing_id);
