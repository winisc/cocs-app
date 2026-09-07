import type { Role } from './roles'

export type AuthUser = {
  id: string
  nome: string
  email: string
  role: Role
}

export type JwtPayload = {
  sub: string
  nome: string
  email: string
  role: Role
}

declare module 'fastify' {
  interface FastifyRequest {
    usuario?: AuthUser
  }
}

declare module '@fastify/jwt' {
  interface FastifyJWT {
    payload: JwtPayload
    user: JwtPayload
  }
}
