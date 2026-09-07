import type { FastifyReply, FastifyRequest } from 'fastify'
import { usuariosRepository } from '../../modules/usuarios/repositories/usuarios.repository'
import type { JwtPayload } from './auth.types'
import type { Role } from './roles'
import { forbidden, unauthorized } from '../errors/http-error'
import './auth.types'

export async function autenticar(request: FastifyRequest) {
  try {
    const payload = await request.jwtVerify<JwtPayload>()
    const usuario = await usuariosRepository.buscarPorId(payload.sub)
    if (!usuario || !usuario.ativo) throw unauthorized()

    request.usuario = {
      id: usuario.id,
      nome: usuario.nome,
      email: usuario.email,
      role: usuario.role,
    }
  } catch {
    throw unauthorized()
  }
}

export function exigirRoles(...roles: Role[]) {
  return async (request: FastifyRequest, _reply: FastifyReply) => {
    if (!request.usuario) throw unauthorized()
    if (!roles.includes(request.usuario.role)) throw forbidden()
  }
}
