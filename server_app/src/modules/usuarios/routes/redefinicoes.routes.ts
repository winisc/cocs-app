import type { FastifyPluginAsync } from 'fastify'
import { RedefinicoesController } from '../controllers/redefinicoes.controller'

/**
 * Abrir e concluir uma redefinição de senha. Sem sessão: quem chega aqui é
 * justamente quem não consegue entrar.
 *
 * O limite é apertado porque o token é a única credencial. Sem ele, dava para
 * varrer tokens à vontade — 32 bytes não se adivinham, mas não há razão para
 * deixar alguém tentando.
 */
export function redefinicoesRoutes(controller: RedefinicoesController): FastifyPluginAsync {
  return async (app) => {
    const limite = { config: { rateLimit: { max: 20, timeWindow: '1 minute' } } }

    app.get('/:token', limite, controller.abrir)
    app.post('/:token', limite, controller.concluir)
  }
}
