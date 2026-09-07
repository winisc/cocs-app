# server_app

API Node + TypeScript do painel COCS.

## Stack

- Fastify
- TypeScript
- JWT para sessao
- bcryptjs para senha
- PostgreSQL para persistencia

## Estrutura

```text
src/
  app.ts
  server.ts
  shared/
    auth/
    config/
    errors/
  modules/
    usuarios/
      routes/
      controllers/
      dtos/
      services/
      repositories/
    pacientes/
      routes/
      controllers/
      dtos/
      services/
      repositories/
    anamnese/
      routes/
      controllers/
      dtos/
      services/
      repositories/
```

## Comandos

```bash
npm install
npm run db:up
npm run dev
npm run build
npm start
```

## Migrations

`migrations/001_initial.sql` cria as quatro tabelas e um unico usuario: o
administrador `admin@cocs.com.br`, senha `admin123`. **Troque essa senha no
primeiro acesso** — o hash esta neste repositorio, entao quem le o codigo sabe
a senha.

Nao ha semente de paciente nem de anamnese. Os demais usuarios nascem pelo
fluxo de solicitacao de acesso.

O arquivo e idempotente (`create table if not exists`, `on conflict do
nothing`), entao roda de novo sem estragar nada.

### Local

Ao subir o Docker pela primeira vez, o Postgres aplica sozinho o que estiver em
`migrations/` — mas so quando o volume `cocs_postgres_data` nasce. Num banco que
ja existe, aplique na mao:

```powershell
cmd /c "docker exec -i cocs-pg psql -U cocs -d cocs -v ON_ERROR_STOP=1 < migrations\001_initial.sql"
```

O `cmd /c` nao e frescura. `Get-Content ... | docker exec` reescreve o arquivo
em ANSI no caminho, e todo acento chega quebrado no banco — "Agua" vira
"Ãgua". O redirecionamento do `cmd` passa os bytes como estao.

No Git Bash, o equivalente:

```bash
cat migrations/001_initial.sql | docker exec -i cocs-pg psql -U cocs -d cocs -v ON_ERROR_STOP=1
```

Para recriar o banco local do zero:

```powershell
npm run db:down
docker volume rm cocs_postgres_data
npm run db:up
```

### Railway

O Postgres do Railway sobe vazio: `docker-entrypoint-initdb.d` e coisa do
compose local. Aplique uma vez, apontando para a `DATABASE_PUBLIC_URL` do
servico de banco (a `DATABASE_URL` usa a rede interna e nao responde da sua
maquina):

```bash
docker run --rm -i postgres:16-alpine psql "<DATABASE_PUBLIC_URL>" -v ON_ERROR_STOP=1 < migrations/001_initial.sql
```

Usa a imagem do Postgres como cliente, entao nao precisa de `psql` instalado.
Se voce tiver o `psql` no PATH, `psql "<DATABASE_PUBLIC_URL>" -f
migrations/001_initial.sql` faz o mesmo.

Sem isso a API sobe normalmente e todo endpoint quebra com "relation does not
exist".

## Variaveis

Copie `.env.example` para `.env` e ajuste:

```text
PORT=3333
HOST=127.0.0.1
JWT_SECRET=troque-este-segredo-em-producao
CORS_ORIGIN=http://127.0.0.1:5180,http://localhost:5180,http://localhost:5173
DATABASE_URL=postgres://cocs:cocs@127.0.0.1:5432/cocs
```

## Login local

```text
admin@cocs.com.br / admin123
recepcao@cocs.com.br / recepcao123
```

## Fluxo de cadastro

`POST /auth/register` cria uma solicitacao de acesso. Ele nao cria sessao
nem devolve JWT. Um administrador aprova em `POST /usuarios/solicitacoes/:id/aprovar`
e, depois disso, a pessoa consegue entrar pelo login.

## Permissoes

- `admin`: usuarios, pacientes e anamnese
- `recepcao`: pacientes e anamnese; pode criar anamnese
- `dentista`: pacientes e anamnese somente para consulta

## Rotas principais

- `GET /health`
- `POST /auth/login`
- `GET /auth/me`
- `GET /usuarios`
- `POST /usuarios`
- `GET /pacientes`
- `POST /pacientes`
- `GET /pacientes/:id`
- `PUT /pacientes/:id`
- `DELETE /pacientes/:id`
- `GET /anamneses`
- `POST /anamneses`
- `GET /anamneses/paciente/:pacienteId`
- `GET /anamneses/publica/:token`
- `POST /anamneses/publica/:token/respostas`
