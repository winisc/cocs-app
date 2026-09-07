import type { FastifyPluginAsync } from 'fastify'
import { AnamneseController } from './controllers/anamnese.controller'
import { anamneseRepository } from './repositories/anamnese.repository'
import { AnamneseService } from './services/anamnese.service'
import { anamneseRoutes } from './routes/anamnese.routes'

export const anamneseService = new AnamneseService(anamneseRepository)

export const anamneseModule: FastifyPluginAsync = async (app) => {
  const controller = new AnamneseController(anamneseService)
  await app.register(anamneseRoutes(controller))
}
