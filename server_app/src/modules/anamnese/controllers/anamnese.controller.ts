import type { FastifyReply, FastifyRequest } from 'fastify'
import { badRequest, unauthorized } from '../../../shared/errors/http-error'
import { parseCriarAnamneseDto, parseResponderAnamneseDto } from '../dtos/anamnese.dto'
import { AnamneseService } from '../services/anamnese.service'

export class AnamneseController {
  constructor(private readonly service: AnamneseService) {}

  listar = async () => ({
    anamneses: await this.service.listar(),
  })

  listarPorPaciente = async (request: FastifyRequest) => {
    if (!request.usuario) throw unauthorized()

    return {
      anamneses: await this.service.listarPorPaciente(
        param(request.params, 'pacienteId'),
        request.usuario.role,
      ),
    }
  }

  criar = async (request: FastifyRequest, reply: FastifyReply) => {
    const anamnese = await this.service.criar(
      parseCriarAnamneseDto(request.body),
      request.usuario?.nome ?? null,
    )

    return reply.status(201).send({ anamnese })
  }

  buscarPublica = async (request: FastifyRequest) => ({
    anamnese: await this.service.buscarPublicaPorToken(param(request.params, 'token')),
  })

  responderPublica = async (request: FastifyRequest) => ({
    anamnese: await this.service.responderPorToken(
      param(request.params, 'token'),
      parseResponderAnamneseDto(request.body),
    ),
  })

  excluir = async (request: FastifyRequest, reply: FastifyReply) => {
    await this.service.excluir(param(request.params, 'id'))
    return reply.status(204).send()
  }
}

function param(params: unknown, name: string) {
  const value = (params as Record<string, unknown>)[name]
  if (typeof value !== 'string' || !value.trim()) throw badRequest(`Parametro ${name} obrigatorio.`)
  return value
}
