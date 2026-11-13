-- Impede cadastro duplicado: mesmo nome (sem acento/maiuscula/espaco extra) com a mesma data de nascimento.
-- Cadastros recusados nao contam (assim um duplicado retirado da lista nao bloqueia nada).

-- Limpeza do unico duplicado exato existente: Miguel de Farias Andrade (mesma data, mesmo responsavel).
-- Fica o cadastro mais antigo (MCM-07E3F30AFC, matricula 0007, com faixa); o repetido (MCM-FBD3D187F9) sai da lista.
-- Nada e apagado: o registro fica com status "recusado" e uma anotacao.
update public.student_enrollments
set status = 'rejected', approved_at = null, approved_by = null,
    internal_notes = 'Cadastro duplicado de MCM-07E3F30AFC, retirado da lista em 2026-11-13.',
    updated_at = now()
where protocol = 'MCM-FBD3D187F9' and status = 'approved';

create or replace function public.normalize_student_name(value text)
returns text language sql immutable as $$
  select lower(regexp_replace(trim(translate(value,
    'ÁÀÂÃÄáàâãäÉÈÊËéèêëÍÌÎÏíìîïÓÒÔÕÖóòôõöÚÙÛÜúùûüÇçÑñ',
    'AAAAAaaaaaEEEEeeeeIIIIiiiiOOOOOoooooUUUUuuuuCcNn')), '\s+', ' ', 'g'))
$$;

create unique index if not exists student_unique_name_birth
  on public.student_enrollments (public.normalize_student_name(student_full_name), birth_date)
  where status <> 'rejected';
