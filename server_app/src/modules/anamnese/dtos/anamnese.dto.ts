import { badRequest } from '../../../shared/errors/http-error'
import type { RespostaAnamnese } from '../types'

const MAX_RESPOSTAS = 20
const MAX_ID = 60
const MAX_PERGUNTA = 180
const MAX_RESPOSTA = 800

export type CriarAnamneseDto = {
  pacienteId: string
}

export type ResponderAnamneseDto = {
  respostas: RespostaAnamnese[]
}

type Body = Record<string, unknown>

export function parseCriarAnamneseDto(body: unknown): CriarAnamneseDto {
  const data = asBody(body)
  return {
    pacienteId: stringField(data, 'pacienteId'),
  }
}

export function parseResponderAnamneseDto(body: unknown): ResponderAnamneseDto {
  const data = asBody(body)
  const respostas = data.respostas

  if (!Array.isArray(respostas)) throw badRequest('Campo obrigatorio: respostas.')
  if (respostas.length > MAX_RESPOSTAS) {
    throw badRequest(`A anamnese aceita no maximo ${MAX_RESPOSTAS} respostas.`)
  }

  return {
    respostas: respostas.map((resposta, index) => parseResposta(resposta, index)),
  }
}

function parseResposta(value: unknown, index: number): RespostaAnamnese {
  const data = asBody(value)
  return {
    id: stringField(data, 'id', `respostas[${index}].id`, MAX_ID),
    pergunta: stringField(data, 'pergunta', `respostas[${index}].pergunta`, MAX_PERGUNTA),
    resposta: stringField(data, 'resposta', `respostas[${index}].resposta`, MAX_RESPOSTA),
  }
}

function asBody(body: unknown): Body {
  if (!body || typeof body !== 'object') throw badRequest('Corpo da requisicao invalido.')
  return body as Body
}

function stringField(body: Body, field: string, label = field, max = 200) {
  const value = body[field]
  if (typeof value !== 'string' || !value.trim()) {
    throw badRequest(`Campo obrigatorio: ${label}.`)
  }
  const trimmed = value.trim()
  if (trimmed.length > max) throw badRequest(`Campo ${label} excede ${max} caracteres.`)
  return trimmed
}
