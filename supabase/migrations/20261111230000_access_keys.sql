-- Chaves de acesso a Biblioteca: a pulseira (ou o QR da carteirinha do aluno) e a "chave".
-- Cada chave tem um codigo secreto longo. Quem abre o link com o codigo entra na biblioteca, sem login.
-- Chamada, cadastros e dados de alunos continuam exigindo login. Tabela so acessivel pelas Edge Functions.
create table if not exists public.access_keys (
  id uuid primary key default gen_random_uuid(),
  kind text not null check (kind in ('bracelet', 'student')),
  token text not null unique check (char_length(token) >= 20),
  tag_hash text,                                   -- hash do UID do chip (pulseira), para nao liberar o mesmo chip duas vezes
  enrollment_id uuid references public.student_enrollments(id),  -- so para kind = student
  label text,
  status text not null default 'active' check (status in ('active', 'revoked')),
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  last_used_at timestamptz,
  uses integer not null default 0,
  revoked_at timestamptz,
  revoked_by uuid references auth.users(id)
);
create unique index if not exists access_keys_one_active_per_tag on public.access_keys(tag_hash) where status = 'active' and tag_hash is not null;
create unique index if not exists access_keys_one_active_per_student on public.access_keys(enrollment_id) where status = 'active' and kind = 'student';

alter table public.access_keys enable row level security;
revoke all on public.access_keys from anon, authenticated;
grant select, insert, update, delete on public.access_keys to service_role;

-- Numeracao amigavel das pulseiras (Pulseira nº N).
create sequence if not exists public.bracelet_seq;
grant usage, select on sequence public.bracelet_seq to service_role;
