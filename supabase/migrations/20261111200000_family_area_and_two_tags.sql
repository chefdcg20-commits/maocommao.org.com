-- Versao 1.1 do app: dois chips por aluno (carteirinha e faixa), area da familia, avisos e mensagens.
-- Nao altera dados existentes. As novas tabelas so sao acessadas pelas Edge Functions (service_role).

-- 1) Chip da carteirinha e chip da faixa: um ativo de cada tipo por aluno.
alter table public.nfc_cards add column if not exists kind text not null default 'card' check (kind in ('card', 'belt'));
drop index if exists public.nfc_cards_one_active_per_student;
create unique index if not exists nfc_cards_one_active_per_student_kind on public.nfc_cards(enrollment_id, kind) where status = 'active';

-- 2) Configuracoes simples (codigo de cadastro da familia, definido pelos mestres).
create table if not exists public.app_settings (
  key text primary key,
  value text not null,
  updated_at timestamptz not null default now()
);
insert into public.app_settings (key, value)
values ('family_signup_code', 'MCM-' || upper(substr(md5(random()::text), 1, 6)))
on conflict (key) do nothing;

-- 3) Contas da familia (pais/responsaveis e alunos adultos). Separadas da equipe.
create table if not exists public.family_accounts (
  user_id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.family_links (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.family_accounts(user_id) on delete cascade,
  enrollment_id uuid not null references public.student_enrollments(id),
  relationship text not null default 'responsavel' check (relationship in ('responsavel', 'proprio')),
  created_at timestamptz not null default now(),
  unique (user_id, enrollment_id)
);
create index if not exists family_links_enrollment_idx on public.family_links(enrollment_id);

-- 4) Mensagens da familia para os mestres, e avisos dos mestres para a familia.
create table if not exists public.family_messages (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.family_accounts(user_id) on delete cascade,
  enrollment_id uuid not null references public.student_enrollments(id),
  body text not null check (char_length(body) between 1 and 1000),
  created_at timestamptz not null default now(),
  read_at timestamptz,
  read_by uuid references auth.users(id)
);
create index if not exists family_messages_created_idx on public.family_messages(created_at desc);

create table if not exists public.announcements (
  id uuid primary key default gen_random_uuid(),
  title text not null check (char_length(title) between 1 and 120),
  body text not null check (char_length(body) between 1 and 2000),
  active boolean not null default true,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now()
);

-- 5) Limite de tentativas (codigo errado, matricula errada) para impedir adivinhacao.
create table if not exists public.rate_limits (
  id bigint generated always as identity primary key,
  bucket text not null,
  created_at timestamptz not null default now()
);
create index if not exists rate_limits_bucket_idx on public.rate_limits(bucket, created_at desc);

alter table public.app_settings enable row level security;
alter table public.family_accounts enable row level security;
alter table public.family_links enable row level security;
alter table public.family_messages enable row level security;
alter table public.announcements enable row level security;
alter table public.rate_limits enable row level security;

revoke all on public.app_settings, public.family_accounts, public.family_links, public.family_messages, public.announcements, public.rate_limits from anon, authenticated;
grant select, insert, update, delete on public.app_settings, public.family_accounts, public.family_links, public.family_messages, public.announcements, public.rate_limits to service_role;
grant usage, select on sequence public.rate_limits_id_seq to service_role;
