import type { FastifyPluginAsync } from 'fastify'
import { UsuariosController } from './controllers/usuarios.controller'
import { usuariosRepository } from './repositories/usuarios.repository'
import { UsuariosService } from './services/usuarios.service'
import { authRoutes } from './routes/auth.routes'
import { usuariosRoutes } from './routes/usuarios.routes'
import { RedefinicoesController } from './controllers/redefinicoes.controller'
import { redefinicoesRepository } from './repositories/redefinicoes.repository'
import { RedefinicoesService } from './services/redefinicoes.service'
import { redefinicoesRoutes } from './routes/redefinicoes.routes'

export const usuariosService = new UsuariosService(usuariosRepository)
export const redefinicoesService = new RedefinicoesService(redefinicoesRepository, usuariosRepository)

export const usuariosModule: FastifyPluginAsync = async (app) => {
  const controller = new UsuariosController(usuariosService)
  const redefinicoes = new RedefinicoesController(redefinicoesService)

  await app.register(authRoutes(controller), { prefix: '/auth' })
  await app.register(usuariosRoutes(controller, redefinicoes), { prefix: '/usuarios' })
  await app.register(redefinicoesRoutes(redefinicoes), { prefix: '/redefinicoes' })
}
