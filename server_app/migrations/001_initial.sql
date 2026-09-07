begin;

create table if not exists usuarios (
  id text primary key,
  nome text not null,
  email text not null,
  email_normalizado text not null unique,
  role text not null check (role in ('admin', 'dentista', 'recepcao')),
  ativo boolean not null default true,
  criado_em timestamptz not null default now(),
  senha_hash text not null
);

create table if not exists solicitacoes_acesso (
  id text primary key,
  nome text not null,
  email text not null,
  email_normalizado text not null unique,
  pedido_em timestamptz not null default now(),
  senha_hash text not null
);

create table if not exists pacientes (
  id text primary key,
  nome text not null,
  sobrenome text not null,
  nome_busca text not null,
  sobrenome_busca text not null,
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now(),
  unique (nome_busca, sobrenome_busca)
);

create table if not exists anamneses (
  id text primary key,
  paciente_id text not null references pacientes(id) on delete cascade,
  status text not null check (status in ('pendente', 'concluida')),
  token text not null unique,
  criada_em timestamptz not null default now(),
  respondida_em timestamptz,
  criada_por text,
  respostas jsonb not null default '[]'::jsonb
);

create index if not exists idx_anamneses_paciente_criada
  on anamneses (paciente_id, criada_em desc);

create index if not exists idx_anamneses_status_criada
  on anamneses (status, criada_em desc);

insert into usuarios (id, nome, email, email_normalizado, role, ativo, criado_em, senha_hash)
values
  (
    'u_admin',
    'Admin COCS',
    'admin@cocs.com.br',
    'admin@cocs.com.br',
    'admin',
    true,
    '2026-08-20T12:00:00.000Z',
    '$2b$10$1yOMCCvTNQT3m9HUJanRHeIOLZ5nP528fTv1xVsUlLLgg2kaBqTKm'
  ),
  (
    'u_recepcao',
    'Recepcao COCS',
    'recepcao@cocs.com.br',
    'recepcao@cocs.com.br',
    'recepcao',
    true,
    '2026-08-20T12:00:00.000Z',
    '$2b$10$MkMl18/d/W2bnB.ZHGzAke6U83..u5RTqu3Tq1uIeYOgyWIaGLYhe'
  )
on conflict (id) do nothing;

insert into pacientes (id, nome, sobrenome, nome_busca, sobrenome_busca, criado_em, atualizado_em)
values
  ('p1', 'Joana', 'Ribeiro', 'joana', 'ribeiro', '2026-08-20T12:00:00.000Z', '2026-08-20T12:00:00.000Z'),
  ('p2', 'Tiago', 'Mendes', 'tiago', 'mendes', '2026-08-20T12:00:00.000Z', '2026-08-20T12:00:00.000Z'),
  ('p3', 'Lucia', 'Fernandes', 'lucia', 'fernandes', '2026-08-20T12:00:00.000Z', '2026-08-20T12:00:00.000Z'),
  ('p4', 'Bruno', 'Carvalho', 'bruno', 'carvalho', '2026-08-20T12:00:00.000Z', '2026-08-20T12:00:00.000Z')
on conflict (id) do nothing;

insert into anamneses (
  id,
  paciente_id,
  status,
  token,
  criada_em,
  respondida_em,
  criada_por,
  respostas
)
values
  (
    'a1',
    'p1',
    'concluida',
    'tok-a1',
    '2026-08-20T12:00:00.000Z',
    '2026-08-21T12:00:00.000Z',
    'Admin COCS',
    '[
      {"id":"nome","pergunta":"Nome e sobrenome","resposta":"Joana Ribeiro"},
      {"id":"apelido","pergunta":"Como você gosta de ser chamado?","resposta":"Jô"},
      {"id":"musica","pergunta":"Qual música ou vídeo musical você gosta de ouvir?","resposta":"MPB tranquila"},
      {"id":"bebida","pergunta":"O que você gostaria que servíssemos aqui na clínica?","resposta":"Água · Sem gás"}
    ]'::jsonb
  ),
  (
    'a2',
    'p3',
    'pendente',
    'tok-a2',
    '2026-08-28T12:00:00.000Z',
    null,
    'Recepcao COCS',
    '[]'::jsonb
  ),
  (
    'a3',
    'p4',
    'pendente',
    'tok-a3',
    '2026-08-05T12:00:00.000Z',
    null,
    'Recepcao COCS',
    '[]'::jsonb
  )
on conflict (id) do nothing;

commit;
