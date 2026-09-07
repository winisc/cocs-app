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

  app.get('/api/health', async () => ({
    ok: true,
    name: 'cocs-server',
  }))

  await app.register(usuariosModule, { prefix: '/api' })
  await app.register(pacientesModule, { prefix: '/api/pacientes' })
  await app.register(anamneseModule, { prefix: '/api/anamneses' })

  return app
}
