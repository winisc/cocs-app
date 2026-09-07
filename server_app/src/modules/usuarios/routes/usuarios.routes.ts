import type { FastifyPluginAsync } from 'fastify'
import { autenticar, exigirRoles } from '../../../shared/auth/auth.guard'
import { ROLES } from '../../../shared/auth/roles'
import { UsuariosController } from '../controllers/usuarios.controller'

export function usuariosRoutes(controller: UsuariosController): FastifyPluginAsync {
  return async (app) => {
    app.post('/auth/login', { config: { rateLimit: { max: 8, timeWindow: '1 minute' } } }, controller.login)
    app.post('/auth/register', { config: { rateLimit: { max: 5, timeWindow: '1 hour' } } }, controller.registrar)
    app.get('/auth/me', { preHandler: [autenticar] }, controller.me)

    app.get('/usuarios', { preHandler: [autenticar, exigirRoles(ROLES.ADMIN)] }, controller.listar)
    app.post('/usuarios', { preHandler: [autenticar, exigirRoles(ROLES.ADMIN)] }, controller.criar)
    app.get(
      '/usuarios/solicitacoes',
      { preHandler: [autenticar, exigirRoles(ROLES.ADMIN)] },
      controller.listarSolicitacoes,
    )
    app.post(
      '/usuarios/solicitacoes/:id/aprovar',
      { preHandler: [autenticar, exigirRoles(ROLES.ADMIN)] },
      controller.aprovarSolicitacao,
    )
    app.delete(
      '/usuarios/solicitacoes/:id',
      { preHandler: [autenticar, exigirRoles(ROLES.ADMIN)] },
      controller.recusarSolicitacao,
    )
    app.put('/usuarios/:id', { preHandler: [autenticar, exigirRoles(ROLES.ADMIN)] }, controller.atualizar)
    app.delete('/usuarios/:id', { preHandler: [autenticar, exigirRoles(ROLES.ADMIN)] }, controller.excluir)
  }
}
