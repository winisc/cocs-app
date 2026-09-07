import type { FastifyPluginAsync } from 'fastify'
import { autenticar, exigirRoles } from '../../../shared/auth/auth.guard'
import { ROLES, ROLES_ATENDIMENTO, ROLES_GERENCIAM_PACIENTES } from '../../../shared/auth/roles'
import { PacientesController } from '../controllers/pacientes.controller'

export function pacientesRoutes(controller: PacientesController): FastifyPluginAsync {
  return async (app) => {
    const podeVer = [autenticar, exigirRoles(...ROLES_ATENDIMENTO)]
    const podeGerenciar = [autenticar, exigirRoles(...ROLES_GERENCIAM_PACIENTES)]

    app.get('/', { preHandler: podeVer }, controller.listar)
    app.get('/:id', { preHandler: podeVer }, controller.buscar)
    app.post('/', { preHandler: podeGerenciar }, controller.criar)
    app.put('/:id', { preHandler: podeGerenciar }, controller.atualizar)
    app.delete('/:id', { preHandler: [autenticar, exigirRoles(ROLES.ADMIN)] }, controller.excluir)
  }
}
