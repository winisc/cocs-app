begin;

-- Redefinição de senha por link temporário.
--
-- Guarda o hash do token, nunca o token. Ele é uma credencial: quem o tem
-- troca a senha de alguém. Se o banco vazar, um token em texto puro seria
-- conta tomada; um hash não serve para nada.
--
-- SHA-256 e não bcrypt de propósito. Bcrypt existe para segredo que uma
-- pessoa escolheu, e por isso é fraco e precisa ser caro de testar. Este
-- token nasce de 32 bytes aleatórios — não há dicionário que o alcance, e
-- pagar bcrypt em cada abertura do link só deixaria a tela lenta.
create table if not exists redefinicoes_senha (
  id text primary key,
  usuario_id text not null references usuarios(id) on delete cascade,
  token_hash text not null unique,
  criada_em timestamptz not null default now(),
  expira_em timestamptz not null,
  usada_em timestamptz,
  criada_por text
);

-- Buscar as pendentes de alguém, para invalidar ao gerar um link novo.
create index if not exists idx_redefinicoes_usuario
  on redefinicoes_senha (usuario_id, criada_em desc);

commit;
