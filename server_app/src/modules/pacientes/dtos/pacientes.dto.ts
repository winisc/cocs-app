import { badRequest } from '../../../shared/errors/http-error'

const MAX_NOME = 80

export type CriarPacienteDto = {
  nome: string
  sobrenome: string
}

export type AtualizarPacienteDto = CriarPacienteDto

type Body = Record<string, unknown>

export function parseCriarPacienteDto(body: unknown): CriarPacienteDto {
  const data = asBody(body)
  return {
    nome: stringField(data, 'nome'),
    sobrenome: stringField(data, 'sobrenome'),
  }
}

export function parseAtualizarPacienteDto(body: unknown): AtualizarPacienteDto {
  return parseCriarPacienteDto(body)
}

function asBody(body: unknown): Body {
  if (!body || typeof body !== 'object') throw badRequest('Corpo da requisicao invalido.')
  return body as Body
}

function stringField(body: Body, field: string) {
  const value = body[field]
  if (typeof value !== 'string' || !value.trim()) {
    throw badRequest(`Campo obrigatorio: ${field}.`)
  }
  const trimmed = value.trim()
  if (trimmed.length > MAX_NOME) throw badRequest(`Campo ${field} excede ${MAX_NOME} caracteres.`)
  return trimmed
}
