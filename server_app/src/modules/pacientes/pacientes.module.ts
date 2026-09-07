import type { FastifyPluginAsync } from 'fastify'
import { PacientesController } from './controllers/pacientes.controller'
import { pacientesRepository } from './repositories/pacientes.repository'
import { PacientesService } from './services/pacientes.service'
import { pacientesRoutes } from './routes/pacientes.routes'

export const pacientesService = new PacientesService(pacientesRepository)

export const pacientesModule: FastifyPluginAsync = async (app) => {
  const controller = new PacientesController(pacientesService)
  await app.register(pacientesRoutes(controller))
}
