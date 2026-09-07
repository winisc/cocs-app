import type { FastifyError, FastifyReply, FastifyRequest } from 'fastify'
import { HttpError } from './http-error'

export function errorHandler(error: FastifyError, request: FastifyRequest, reply: FastifyReply) {
  if (error instanceof HttpError) {
    return reply.status(error.statusCode).send({
      erro: error.message,
    })
  }

  request.log.error(error)

  return reply.status(error.statusCode ?? 500).send({
    erro: error.statusCode && error.statusCode < 500 ? error.message : 'Erro interno do servidor.',
  })
}
