-- Camisa 10: A Trilha do Craque — schema do Supabase (Postgres)
-- Rode este arquivo inteiro no SQL Editor do Supabase (uma vez).

-- Base de fatos curada manualmente (RAG). A IA nunca inventa o fato, só a dinâmica.
create table if not exists facts (
  id bigint generated always as identity primary key,
  categoria text not null check (categoria in ('regras','historia','craques','estatisticas')),
  dificuldade int not null check (dificuldade between 1 and 3),
  fato text not null
);

-- Cache de perguntas já geradas pela IA: usado como fallback quando o LLM está indisponível.
create table if not exists questions (
  id bigint generated always as identity primary key,
  fact_id bigint not null references facts(id) on delete cascade,
  formato text not null,
  payload jsonb not null,
  created_at timestamptz not null default now()
);
create index if not exists questions_fact_idx on questions(fact_id);

-- Ranking global (sobrevivência e campanha).
create table if not exists scores (
  id bigint generated always as identity primary key,
  nome text not null check (char_length(nome) between 1 and 20),
  modo text not null check (modo in ('sobrevivencia','campanha','quem')),
  pontos int not null check (pontos between 0 and 1000000),
  created_at timestamptz not null default now()
);

-- Salas PvP: o backend gera o lote de perguntas e todos jogam o mesmo lote (estilo Kahoot).
create table if not exists rooms (
  code text primary key,
  categoria text,
  dificuldade int,
  questions jsonb not null,
  created_at timestamptz not null default now()
);

create table if not exists room_results (
  id bigint generated always as identity primary key,
  code text not null references rooms(code) on delete cascade,
  nome text not null check (char_length(nome) between 1 and 20),
  acertos int not null check (acertos >= 0),
  pontos int not null check (pontos >= 0),
  tempo_ms int not null check (tempo_ms >= 0),
  created_at timestamptz not null default now()
);

-- RLS: o navegador (chave anon) só lê ranking/salas e grava resultados.
-- facts e questions só são acessados pelo backend (service role, que ignora RLS).
alter table facts enable row level security;
alter table questions enable row level security;
alter table scores enable row level security;
alter table rooms enable row level security;
alter table room_results enable row level security;

drop policy if exists "ler ranking" on scores;
drop policy if exists "gravar ranking" on scores;
drop policy if exists "ler salas" on rooms;
drop policy if exists "ler resultados" on room_results;
drop policy if exists "gravar resultados" on room_results;
create policy "ler ranking" on scores for select to anon using (true);
create policy "gravar ranking" on scores for insert to anon with check (true);
create policy "ler salas" on rooms for select to anon using (true);
create policy "ler resultados" on room_results for select to anon using (true);
create policy "gravar resultados" on room_results for insert to anon with check (true);

-- Realtime: placar PvP atualiza ao vivo quando alguém termina.
do $$ begin
  alter publication supabase_realtime add table room_results;
exception when duplicate_object then null; end $$;
