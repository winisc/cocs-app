export class HttpError extends Error {
  constructor(
    public readonly statusCode: number,
    message: string,
  ) {
    super(message)
    this.name = 'HttpError'
  }
}

export const badRequest = (message: string) => new HttpError(400, message)
export const unauthorized = (message = 'Sessao invalida ou expirada.') => new HttpError(401, message)
export const forbidden = (message = 'Acesso nao permitido para este perfil.') =>
  new HttpError(403, message)
export const notFound = (message: string) => new HttpError(404, message)
export const conflict = (message: string) => new HttpError(409, message)
