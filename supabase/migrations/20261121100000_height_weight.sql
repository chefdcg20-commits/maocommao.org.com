-- Altura (cm) e peso (kg) do aluno: usados para escolher a faixa e a categoria na graduacao.
-- Opcionais no banco (cadastros antigos ficam em branco ate alguem preencher).
alter table public.student_enrollments
  add column if not exists height_cm smallint,
  add column if not exists weight_kg numeric(5,1),
  add column if not exists body_updated_at timestamptz;

alter table public.student_enrollments
  drop constraint if exists student_height_range,
  drop constraint if exists student_weight_range;
alter table public.student_enrollments
  add constraint student_height_range check (height_cm is null or height_cm between 50 and 230),
  add constraint student_weight_range check (weight_kg is null or weight_kg between 10 and 250);
