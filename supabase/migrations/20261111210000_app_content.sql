-- Conteudo informativo do hall do app (editavel pelos mestres, sem precisar de novo APK).
-- Textos iniciais vindos do site institucional; a secao de lei de incentivo e um marcador para a diretoria preencher.
create table if not exists public.app_content (
  slug text primary key,
  title text not null check (char_length(title) between 1 and 120),
  body text not null check (char_length(body) <= 6000),
  sort_order int not null default 100,
  updated_by uuid references auth.users(id),
  updated_at timestamptz not null default now()
);

alter table public.app_content enable row level security;
revoke all on public.app_content from anon, authenticated;
grant select, insert, update, delete on public.app_content to service_role;

insert into public.app_content (slug, title, body, sort_order) values
('quem-somos', 'Quem somos',
 E'O Projeto Social Mão com Mão oferece aulas sociais de jiu-jítsu para crianças, adolescentes e adultos, fortalecendo valores que acompanham os alunos para toda a vida.\n\nO trabalho também alcança famílias em situação de vulnerabilidade por meio de arrecadações, apoio alimentar, mobilização comunitária e parcerias responsáveis.\n\nMissão: transformar por meio do esporte e da solidariedade.\nVisão: ampliar o atendimento e conquistar um espaço próprio.\nValores: respeito, disciplina, transparência e acolhimento.', 10),
('aulas', 'Aulas e horários',
 E'Quintas-feiras, no Ginásio Poliesportivo Rômulo Duncan Arantes — Av. Casa Grande, 485, Diadema, SP.\n\nInfantil, turma 1: 18h\nInfantil, turma 2: 19h\nAdulto: 20h\n\nAs turmas são organizadas por faixa etária e nível de desenvolvimento dos alunos.', 20),
('metodologia', 'Como funcionam as aulas',
 E'Cada quinta-feira do mês tem um fundamento do jiu-jítsu, para os alunos aprenderem uma habilidade por vez e aplicarem tudo no fim do mês.\n\n1ª quinta-feira — Quedas: entrada, desequilíbrio, projeção e queda segura.\n2ª quinta-feira — Finalizações: técnicas de controle e finalização com responsabilidade.\n3ª quinta-feira — Raspagens: alavancas e transições para sair da posição inferior.\n4ª quinta-feira — Combate livre e lutas casadas: aplicação dos conteúdos em situações reais de luta.\n\nA metodologia respeita a idade, o nível técnico e as necessidades de cada turma.', 30),
('alimentos', 'Arrecadação de alimentos',
 E'O projeto mobiliza doações e parceiros para apoiar alunos e famílias em situação de vulnerabilidade, fortalecendo segurança alimentar, dignidade e cidadania.\n\nAcompanhe os avisos do aplicativo e o grupo do WhatsApp para saber as próximas campanhas e como participar.', 40),
('incentivo', 'Lei de incentivo fiscal',
 E'Esta seção será atualizada pela diretoria com os planos do projeto para a lei de incentivo fiscal e como empresas e pessoas podem apoiar.', 50),
('transparencia', 'Transparência e documentos',
 E'Associação Mão Com Mão\nCNPJ: 66.660.999/0001-03\nSite: https://maocommao-org-com.vercel.app\n\nO estatuto social está disponível no site. Atas, prestação de contas e demais documentos estão em preparação.', 60),
('equipe', 'Equipe e diretoria',
 E'Joaquim Guedes — presidente e mestre\nDaniel Guedes — secretário e professor\nThamires Guedes — tesoureira\nMarconi Zovico — professor\nLuizão — professor\nMarcos — professor', 70)
on conflict (slug) do nothing;
