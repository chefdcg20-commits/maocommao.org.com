create extension if not exists pgcrypto;

create table if not exists public.admin_profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  email text not null unique,
  full_name text,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.enrollment_invites (
  id uuid primary key default gen_random_uuid(),
  token_hash text not null unique,
  label text not null,
  expires_at timestamptz,
  max_uses integer check (max_uses is null or max_uses > 0),
  uses_count integer not null default 0 check (uses_count >= 0),
  active boolean not null default true,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now()
);

create table if not exists public.student_enrollments (
  id uuid primary key default gen_random_uuid(),
  protocol text not null unique default ('MCM-' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 10))),
  status text not null default 'pending' check (status in ('pending','under_review','changes_requested','approved','rejected')),
  student_full_name text not null,
  birth_date date not null,
  photo_path text not null,
  guardian_full_name text not null,
  guardian_relationship text not null,
  guardian_email text,
  guardian_phone text not null,
  address_postal_code text not null,
  address_street text not null,
  address_number text not null,
  address_complement text,
  address_neighborhood text not null,
  address_city text not null,
  address_state text not null,
  emergency_contact_name text,
  emergency_contact_phone text,
  health_notes text,
  image_consent boolean not null,
  image_consent_scope text not null default 'projeto_redes_sociais',
  consent_text_version text not null default '2026-11-06-v1',
  guardian_signature_path text not null,
  guardian_signed_at timestamptz not null,
  invite_id uuid references public.enrollment_invites(id),
  internal_notes text,
  approved_at timestamptz,
  approved_by uuid references auth.users(id),
  sensei_name text not null default 'Joaquim Guedes',
  sensei_signature_path text,
  sensei_signed_at timestamptz,
  membership_number text unique,
  card_valid_until date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (birth_date <= current_date),
  check ((status <> 'approved') or (approved_at is not null and approved_by is not null))
);

create table if not exists public.enrollment_events (
  id bigint generated always as identity primary key,
  enrollment_id uuid not null references public.student_enrollments(id) on delete cascade,
  actor_id uuid references auth.users(id),
  event_type text not null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.waitlist_entries (
  id uuid primary key default gen_random_uuid(),
  guardian_full_name text not null,
  guardian_phone text not null,
  student_first_name text not null,
  student_age integer not null check (student_age between 3 and 99),
  notes text,
  status text not null default 'new' check (status in ('new','contacted','invited','closed')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create or replace function public.is_admin()
returns boolean language sql stable security definer set search_path = public
as $$ select exists (select 1 from public.admin_profiles where user_id = auth.uid() and active); $$;

create or replace function public.set_updated_at()
returns trigger language plpgsql set search_path = public
as $$ begin new.updated_at = now(); return new; end; $$;

drop trigger if exists set_student_enrollments_updated_at on public.student_enrollments;
create trigger set_student_enrollments_updated_at before update on public.student_enrollments
for each row execute function public.set_updated_at();

drop trigger if exists set_waitlist_entries_updated_at on public.waitlist_entries;
create trigger set_waitlist_entries_updated_at before update on public.waitlist_entries
for each row execute function public.set_updated_at();

create or replace function public.register_initial_admin()
returns trigger language plpgsql security definer set search_path = public
as $$
begin
  if lower(new.email) = 'chef.dcg20@gmail.com' then
    insert into public.admin_profiles(user_id, email, full_name)
    values (new.id, lower(new.email), coalesce(new.raw_user_meta_data->>'full_name', 'Daniel Guedes'))
    on conflict (user_id) do nothing;
  end if;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created_register_admin on auth.users;
create trigger on_auth_user_created_register_admin after insert on auth.users
for each row execute function public.register_initial_admin();

alter table public.admin_profiles enable row level security;
alter table public.enrollment_invites enable row level security;
alter table public.student_enrollments enable row level security;
alter table public.enrollment_events enable row level security;
alter table public.waitlist_entries enable row level security;

create policy "admins_read_profiles" on public.admin_profiles for select to authenticated using (public.is_admin());
create policy "admins_manage_invites" on public.enrollment_invites for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "admins_manage_enrollments" on public.student_enrollments for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "admins_manage_events" on public.enrollment_events for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "admins_manage_waitlist" on public.waitlist_entries for all to authenticated using (public.is_admin()) with check (public.is_admin());

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('student-photos', 'student-photos', false, 5242880, array['image/jpeg','image/png','image/webp']),
  ('guardian-signatures', 'guardian-signatures', false, 2097152, array['image/png','image/jpeg','image/webp']),
  ('sensei-signatures', 'sensei-signatures', false, 2097152, array['image/png','image/jpeg','image/webp'])
on conflict (id) do update set public = excluded.public, file_size_limit = excluded.file_size_limit, allowed_mime_types = excluded.allowed_mime_types;

create policy "admins_read_private_files" on storage.objects for select to authenticated using (bucket_id in ('student-photos','guardian-signatures','sensei-signatures') and public.is_admin());
create policy "admins_manage_private_files" on storage.objects for all to authenticated using (bucket_id in ('student-photos','guardian-signatures','sensei-signatures') and public.is_admin()) with check (bucket_id in ('student-photos','guardian-signatures','sensei-signatures') and public.is_admin());

create index if not exists student_enrollments_status_created_idx on public.student_enrollments(status, created_at desc);
create index if not exists enrollment_events_enrollment_created_idx on public.enrollment_events(enrollment_id, created_at desc);
create index if not exists waitlist_entries_status_created_idx on public.waitlist_entries(status, created_at desc);

revoke all on public.admin_profiles, public.enrollment_invites, public.student_enrollments, public.enrollment_events, public.waitlist_entries from anon;
grant select, insert, update, delete on public.admin_profiles, public.enrollment_invites, public.student_enrollments, public.enrollment_events, public.waitlist_entries to authenticated;
grant usage, select on sequence public.enrollment_events_id_seq to authenticated;
