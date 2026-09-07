import type { FastifyPluginAsync } from 'fastify'
import { autenticar, exigirRoles } from '../../../shared/auth/auth.guard'
import {
  ROLES_ATENDIMENTO,
  ROLES_CRIAM_ANAMNESE,
  ROLES_EXCLUEM_ANAMNESE,
  ROLES_LISTAM_ANAMNESES,
} from '../../../shared/auth/roles'
import { AnamneseController } from '../controllers/anamnese.controller'

export function anamneseRoutes(controller: AnamneseController): FastifyPluginAsync {
  return async (app) => {
    const podeVer = [autenticar, exigirRoles(...ROLES_ATENDIMENTO)]
    const podeListar = [autenticar, exigirRoles(...ROLES_LISTAM_ANAMNESES)]
    const podeCriar = [autenticar, exigirRoles(...ROLES_CRIAM_ANAMNESE)]
    const podeExcluir = [autenticar, exigirRoles(...ROLES_EXCLUEM_ANAMNESE)]

    app.get('/', { preHandler: podeListar }, controller.listar)
    app.post('/', { preHandler: podeCriar }, controller.criar)
    app.delete('/:id', { preHandler: podeExcluir }, controller.excluir)
    app.get('/paciente/:pacienteId', { preHandler: podeVer }, controller.listarPorPaciente)

    app.get('/publica/:token', { config: { rateLimit: { max: 60, timeWindow: '1 minute' } } }, controller.buscarPublica)
    app.post(
      '/publica/:token/respostas',
      { config: { rateLimit: { max: 12, timeWindow: '1 minute' } } },
      controller.responderPublica,
    )
  }
}
