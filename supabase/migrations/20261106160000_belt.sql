-- Faixa do aluno (opcional; preenchida pelo painel, nao pelo formulario de cadastro).
alter table public.student_enrollments
  add column if not exists belt text
    check (belt is null or belt in ('white','grey_white','grey','grey_black','yellow_white','yellow','yellow_black','orange_white','orange','orange_black','green_white','green','green_black','blue','purple','brown','black')),
  add column if not exists belt_stripes smallint not null default 0 check (belt_stripes between 0 and 4);
