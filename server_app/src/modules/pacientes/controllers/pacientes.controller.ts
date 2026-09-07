import type { FastifyReply, FastifyRequest } from 'fastify'
import { badRequest } from '../../../shared/errors/http-error'
import { parseAtualizarPacienteDto, parseCriarPacienteDto } from '../dtos/pacientes.dto'
import { PacientesService } from '../services/pacientes.service'

export class PacientesController {
  constructor(private readonly service: PacientesService) {}

  listar = async () => ({
    pacientes: await this.service.listar(),
  })

  buscar = async (request: FastifyRequest) => ({
    paciente: await this.service.buscarPorId(paramId(request.params)),
  })

  criar = async (request: FastifyRequest, reply: FastifyReply) => {
    const paciente = await this.service.criar(parseCriarPacienteDto(request.body))
    return reply.status(201).send({ paciente })
  }

  atualizar = async (request: FastifyRequest) => ({
    paciente: await this.service.atualizar(
      paramId(request.params),
      parseAtualizarPacienteDto(request.body),
    ),
  })

  excluir = async (request: FastifyRequest, reply: FastifyReply) => {
    await this.service.excluir(paramId(request.params))
    return reply.status(204).send()
  }
}

function paramId(params: unknown) {
  const id = (params as { id?: unknown }).id
  if (typeof id !== 'string' || !id.trim()) throw badRequest('Parametro id obrigatorio.')
  return id
}
