-- Jornal do Jiu-Jitsu: noticias, resultados, calendario de competicoes e alertas para atletas.
-- Escritas feitas so pelos mestres (Edge Function, service_role). O texto e um resumo proprio, com link da fonte.
create table if not exists public.news_posts (
  id uuid primary key default gen_random_uuid(),
  category text not null check (category in ('resultados', 'calendario', 'alertas', 'noticias')),
  title text not null check (char_length(title) between 1 and 160),
  summary text check (summary is null or char_length(summary) <= 1200),
  source_name text check (source_name is null or char_length(source_name) <= 80),
  source_url text check (source_url is null or source_url ~* '^https://'),
  event_date date,
  pinned boolean not null default false,
  active boolean not null default true,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists news_posts_feed_idx on public.news_posts(active, pinned desc, created_at desc);

alter table public.news_posts enable row level security;
revoke all on public.news_posts from anon, authenticated;
grant select, insert, update, delete on public.news_posts to service_role;
