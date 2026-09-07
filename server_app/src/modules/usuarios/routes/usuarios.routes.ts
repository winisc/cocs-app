import type { FastifyPluginAsync } from 'fastify'
import { autenticar, exigirRoles } from '../../../shared/auth/auth.guard'
import { ROLES } from '../../../shared/auth/roles'
import { UsuariosController } from '../controllers/usuarios.controller'

/** O cadastro de quem tem acesso ao painel. Tudo aqui é de administrador. */
export function usuariosRoutes(controller: UsuariosController): FastifyPluginAsync {
  return async (app) => {
    const soAdmin = { preHandler: [autenticar, exigirRoles(ROLES.ADMIN)] }

    app.get('/', soAdmin, controller.listar)
    app.post('/', soAdmin, controller.criar)

    app.get('/solicitacoes', soAdmin, controller.listarSolicitacoes)
    app.post('/solicitacoes/:id/aprovar', soAdmin, controller.aprovarSolicitacao)
    app.delete('/solicitacoes/:id', soAdmin, controller.recusarSolicitacao)

    app.put('/:id', soAdmin, controller.atualizar)
    app.delete('/:id', soAdmin, controller.excluir)
  }
}
