-- Numero de matricula em sequencia (MCM-AAAA-0001), usado ao aprovar o cadastro.
create sequence if not exists public.membership_seq;

create or replace function public.next_membership_number()
returns text language sql security definer set search_path = public
as $$ select 'MCM-' || to_char(now(), 'YYYY') || '-' || lpad(nextval('public.membership_seq')::text, 4, '0'); $$;

revoke all on function public.next_membership_number() from public, anon, authenticated;
grant execute on function public.next_membership_number() to service_role;
grant usage, select on sequence public.membership_seq to service_role;
