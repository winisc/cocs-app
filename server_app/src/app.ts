import cors from '@fastify/cors'
import jwt from '@fastify/jwt'
import rateLimit from '@fastify/rate-limit'
import Fastify from 'fastify'
import { anamneseModule } from './modules/anamnese/anamnese.module'
import { pacientesModule } from './modules/pacientes/pacientes.module'
import { usuariosModule } from './modules/usuarios/usuarios.module'
import { env } from './shared/config/env'
import { errorHandler } from './shared/errors/error-handler'

export async function buildApp() {
  const app = Fastify({
    logger: {
      level: env.NODE_ENV === 'production' ? 'info' : 'debug',
    },
  })

  app.setErrorHandler(errorHandler)

  await app.register(cors, {
    origin: env.CORS_ORIGIN,
    credentials: true,
  })

  await app.register(jwt, {
    secret: env.JWT_SECRET,
    sign: { expiresIn: '8h' },
  })

  await app.register(rateLimit, {
    global: true,
    max: 240,
    timeWindow: '1 minute',
  })

  // A raiz existe para quem abre api.cocs.com.br no navegador e precisa saber
  // que chegou no lugar certo. Nada de ambiente ou versao aqui: e publica, e
  // detalhe de infraestrutura nao ajuda quem esta perdido nem quem esta
  // procurando brecha.
  app.get('/', async () => ({
    nome: 'COCS API',
    descricao: 'API do painel da COCS Odontologia',
    saude: '/health',
  }))

  app.get('/health', async () => ({
    ok: true,
    name: 'cocs-server',
  }))

  // Sem prefixo `/api`: quem diz que isto e a API e o dominio, api.cocs.com.br.
  // Repetir a palavra no caminho so alonga a URL sem separar nada.
  await app.register(usuariosModule)
  await app.register(pacientesModule, { prefix: '/pacientes' })
  await app.register(anamneseModule, { prefix: '/anamneses' })

  return app
}
