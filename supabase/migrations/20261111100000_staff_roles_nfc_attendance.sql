-- Fase 1 e 2: papeis (mestre/professor), cartoes NFC e presenca.
-- Nao altera dados existentes: os administradores atuais viram "mestre".

alter table public.admin_profiles
  add column if not exists role text not null default 'mestre' check (role in ('mestre', 'professor'));

-- is_admin() passa a significar "mestre" (acesso total). Professores nao leem tabelas diretamente.
create or replace function public.is_admin()
returns boolean language sql stable security definer set search_path = public
as $$ select exists (select 1 from public.admin_profiles where user_id = auth.uid() and active and role = 'mestre'); $$;

create or replace function public.is_staff()
returns boolean language sql stable security definer set search_path = public
as $$ select exists (select 1 from public.admin_profiles where user_id = auth.uid() and active); $$;

-- Cartao fisico ligado a um aluno. Guarda apenas o hash do identificador do chip.
create table if not exists public.nfc_cards (
  id uuid primary key default gen_random_uuid(),
  enrollment_id uuid not null references public.student_enrollments(id),
  tag_hash text not null,
  status text not null default 'active' check (status in ('active', 'revoked')),
  linked_by uuid references auth.users(id),
  linked_at timestamptz not null default now(),
  revoked_by uuid references auth.users(id),
  revoked_at timestamptz,
  revoke_reason text
);
create unique index if not exists nfc_cards_one_active_per_student on public.nfc_cards(enrollment_id) where status = 'active';
create unique index if not exists nfc_cards_one_active_per_tag on public.nfc_cards(tag_hash) where status = 'active';

-- Presenca: um registro por aluno por dia de treino.
create table if not exists public.attendance (
  id uuid primary key default gen_random_uuid(),
  enrollment_id uuid not null references public.student_enrollments(id),
  session_date date not null,
  training_time text check (training_time is null or training_time in ('18:00', '19:00', '20:00')),
  method text not null check (method in ('nfc', 'qr', 'manual')),
  recorded_by uuid references auth.users(id),
  recorded_at timestamptz not null default now(),
  unique (enrollment_id, session_date)
);
create index if not exists attendance_date_idx on public.attendance(session_date desc);

alter table public.nfc_cards enable row level security;
alter table public.attendance enable row level security;
create policy "mestres_manage_nfc_cards" on public.nfc_cards for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "mestres_manage_attendance" on public.attendance for all to authenticated using (public.is_admin()) with check (public.is_admin());

revoke all on public.nfc_cards, public.attendance from anon;
grant select, insert, update, delete on public.nfc_cards, public.attendance to authenticated;
grant select, insert, update, delete on public.nfc_cards, public.attendance to service_role;
