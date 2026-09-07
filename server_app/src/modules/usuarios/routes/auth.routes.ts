import type { FastifyPluginAsync } from 'fastify'
import { autenticar } from '../../../shared/auth/auth.guard'
import { UsuariosController } from '../controllers/usuarios.controller'

/**
 * Entrar, pedir acesso e saber quem sou.
 *
 * Separado de `/usuarios` porque responde a outra pergunta: aquele é o
 * cadastro que um administrador gerencia, este é a sessão de quem está
 * chegando. Os limites de tentativa também são de outra ordem.
 */
export function authRoutes(controller: UsuariosController): FastifyPluginAsync {
  return async (app) => {
    app.post('/login', { config: { rateLimit: { max: 8, timeWindow: '1 minute' } } }, controller.login)
    app.post(
      '/register',
      { config: { rateLimit: { max: 5, timeWindow: '1 hour' } } },
      controller.registrar,
    )
    app.get('/me', { preHandler: [autenticar] }, controller.me)
  }
}
