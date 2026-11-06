-- A Edge Function submit-enrollment usa a chave service_role e precisa destas permissoes.
grant select, insert, update on public.enrollment_invites, public.student_enrollments, public.enrollment_events to service_role;
grant usage, select on sequence public.enrollment_events_id_seq to service_role;
