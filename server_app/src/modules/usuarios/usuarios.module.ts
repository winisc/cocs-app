import type { FastifyPluginAsync } from 'fastify'
import { UsuariosController } from './controllers/usuarios.controller'
import { usuariosRepository } from './repositories/usuarios.repository'
import { UsuariosService } from './services/usuarios.service'
import { usuariosRoutes } from './routes/usuarios.routes'

export const usuariosService = new UsuariosService(usuariosRepository)

export const usuariosModule: FastifyPluginAsync = async (app) => {
  const controller = new UsuariosController(usuariosService)
  await app.register(usuariosRoutes(controller))
}
