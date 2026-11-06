alter table public.student_enrollments
  add column if not exists training_time text
  check (training_time is null or training_time in ('18:00','19:00','20:00'));

create index if not exists student_enrollments_training_time_idx on public.student_enrollments(training_time);
