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

-- Um administrador, e só. É o suficiente para entrar no painel e cadastrar o
-- resto: os outros usuários nascem pelo fluxo de solicitação de acesso, e
-- paciente e anamnese são dados de clínica, não de migration.
--
-- A senha é `admin123`. Troque no primeiro acesso: este hash está no
-- repositório, então quem lê o código sabe a senha.
insert into usuarios (id, nome, email, email_normalizado, role, ativo, criado_em, senha_hash)
values
  (
    'u_admin',
    'Admin COCS',
    'admin@cocs.com.br',
    'admin@cocs.com.br',
    'admin',
    true,
    now(),
    '$2b$10$1yOMCCvTNQT3m9HUJanRHeIOLZ5nP528fTv1xVsUlLLgg2kaBqTKm'
  )
on conflict (id) do nothing;

commit;
