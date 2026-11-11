-- Biblioteca Mao Com Mao: videoaulas, tecnicas, defesa pessoal, documentos e material para professores.
-- Acesso so para quem entra com login (familia ou equipe); itens "equipe" so a equipe ve.
-- A pulseira, a faixa e a carteirinha apenas abrem a pagina: o login e que libera o conteudo.
create table if not exists public.library_items (
  id uuid primary key default gen_random_uuid(),
  category text not null check (category in ('videoaulas', 'tecnicas', 'defesa-pessoal', 'documentos', 'professores')),
  title text not null check (char_length(title) between 1 and 160),
  description text check (description is null or char_length(description) <= 2000),
  url text check (url is null or url ~* '^https://'),
  audience text not null default 'todos' check (audience in ('todos', 'equipe')),
  sort_order int not null default 100,
  active boolean not null default true,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists library_items_category_idx on public.library_items(category, sort_order, created_at);

alter table public.library_items enable row level security;
revoke all on public.library_items from anon, authenticated;
grant select, insert, update, delete on public.library_items to service_role;

-- Texto informativo (aparece em "O projeto" no app): destino do dinheiro das pulseiras.
insert into public.app_content (slug, title, body, sort_order) values
('pulseiras', 'Pulseiras e apoio ao projeto',
 E'Quando as pulseiras forem vendidas, tudo o que for arrecadado será destinado ao Projeto Social Mão com Mão, para sustentar e fazer crescer o projeto.\n\nAo encostar o celular na pulseira, na faixa ou na carteirinha, a pessoa chega à Biblioteca Mão com Mão (videoaulas, técnicas, defesa pessoal e documentos), entrando com o seu login.', 55)
on conflict (slug) do nothing;
