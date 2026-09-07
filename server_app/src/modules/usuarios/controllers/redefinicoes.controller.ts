import type { FastifyReply, FastifyRequest } from 'fastify'
import { parseRedefinirSenhaDto } from '../dtos/usuarios.dto'
import { RedefinicoesService } from '../services/redefinicoes.service'

export class RedefinicoesController {
  constructor(private readonly service: RedefinicoesService) {}

  criar = async (request: FastifyRequest, reply: FastifyReply) => {
    const { id } = request.params as { id: string }
    const criada = await this.service.criar(id, request.user?.nome ?? null)
    return reply.status(201).send({ redefinicao: criada })
  }

  abrir = async (request: FastifyRequest) => {
    const { token } = request.params as { token: string }
    return { redefinicao: await this.service.abrir(token) }
  }

  concluir = async (request: FastifyRequest) => {
    const { token } = request.params as { token: string }
    const dto = parseRedefinirSenhaDto(request.body)
    await this.service.concluir(token, dto.senha)
    return { ok: true }
  }
}
