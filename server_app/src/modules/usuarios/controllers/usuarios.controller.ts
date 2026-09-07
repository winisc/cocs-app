import type { FastifyReply, FastifyRequest } from 'fastify'
import type { JwtPayload } from '../../../shared/auth/auth.types'
import { badRequest, unauthorized } from '../../../shared/errors/http-error'
import {
  parseAprovarSolicitacaoDto,
  parseAtualizarUsuarioDto,
  parseCriarUsuarioDto,
  parseLoginDto,
  parseRegistrarUsuarioDto,
} from '../dtos/usuarios.dto'
import { UsuariosService } from '../services/usuarios.service'

export class UsuariosController {
  constructor(private readonly service: UsuariosService) {}

  login = async (request: FastifyRequest, reply: FastifyReply) => {
    const usuario = await this.service.validarLogin(parseLoginDto(request.body))
    const payload: JwtPayload = {
      sub: usuario.id,
      nome: usuario.nome,
      email: usuario.email,
      role: usuario.role,
    }

    return reply.send({
      token: await reply.jwtSign(payload),
      usuario,
    })
  }

  registrar = async (request: FastifyRequest, reply: FastifyReply) => {
    const solicitacao = await this.service.solicitarAcesso(parseRegistrarUsuarioDto(request.body))
    return reply.status(201).send({ solicitacao })
  }

  me = async (request: FastifyRequest) => {
    if (!request.usuario) throw unauthorized()
    return {
      usuario: await this.service.buscarPorId(request.usuario.id),
    }
  }

  listar = async () => ({
    usuarios: await this.service.listar(),
  })

  criar = async (request: FastifyRequest, reply: FastifyReply) => {
    const usuario = await this.service.criar(parseCriarUsuarioDto(request.body))
    return reply.status(201).send({ usuario })
  }

  atualizar = async (request: FastifyRequest) => ({
    usuario: await this.service.atualizar(paramId(request.params), parseAtualizarUsuarioDto(request.body)),
  })

  excluir = async (request: FastifyRequest, reply: FastifyReply) => {
    if (!request.usuario) throw unauthorized()
    await this.service.excluir(paramId(request.params), request.usuario.id)
    return reply.status(204).send()
  }

  listarSolicitacoes = async () => ({
    solicitacoes: await this.service.listarSolicitacoes(),
  })

  aprovarSolicitacao = async (request: FastifyRequest, reply: FastifyReply) => {
    const usuario = await this.service.aprovarSolicitacao(
      paramId(request.params),
      parseAprovarSolicitacaoDto(request.body),
    )
    return reply.status(201).send({ usuario })
  }

  recusarSolicitacao = async (request: FastifyRequest, reply: FastifyReply) => {
    await this.service.recusarSolicitacao(paramId(request.params))
    return reply.status(204).send()
  }
}

function paramId(params: unknown) {
  const id = (params as { id?: unknown }).id
  if (typeof id !== 'string' || !id.trim()) throw badRequest('Parametro id obrigatorio.')
  return id
}
