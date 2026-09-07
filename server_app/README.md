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

O Docker local sobe um PostgreSQL em `127.0.0.1:5432` e aplica as migrations de
`server_app/migrations/` quando o volume `cocs_postgres_data` e criado.

Para reaplicar a migration manualmente em um banco ja criado:

```powershell
Get-Content .\migrations\001_initial.sql | docker exec -i cocs-pg psql -U cocs -d cocs
```

Se quiser recriar o banco local do zero:

```powershell
npm run db:down
docker volume rm cocs_postgres_data
npm run db:up
```

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

`POST /api/auth/register` cria uma solicitacao de acesso. Ele nao cria sessao
nem devolve JWT. Um administrador aprova em `POST /api/usuarios/solicitacoes/:id/aprovar`
e, depois disso, a pessoa consegue entrar pelo login.

## Permissoes

- `admin`: usuarios, pacientes e anamnese
- `recepcao`: pacientes e anamnese; pode criar anamnese
- `dentista`: pacientes e anamnese somente para consulta

## Rotas principais

- `GET /api/health`
- `POST /api/auth/login`
- `GET /api/auth/me`
- `GET /api/usuarios`
- `POST /api/usuarios`
- `GET /api/pacientes`
- `POST /api/pacientes`
- `GET /api/pacientes/:id`
- `PUT /api/pacientes/:id`
- `DELETE /api/pacientes/:id`
- `GET /api/anamneses`
- `POST /api/anamneses`
- `GET /api/anamneses/paciente/:pacienteId`
- `GET /api/anamneses/publica/:token`
- `POST /api/anamneses/publica/:token/respostas`
