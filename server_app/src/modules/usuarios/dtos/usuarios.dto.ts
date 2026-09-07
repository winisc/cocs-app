import type { Role } from '../../../shared/auth/roles'
import { TODAS_AS_ROLES } from '../../../shared/auth/roles'
import { badRequest } from '../../../shared/errors/http-error'

const MIN_SENHA = 8
const MAX_SENHA = 128
const MAX_NOME = 120
const MAX_EMAIL = 180
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export type LoginDto = {
  email: string
  senha: string
}

export type CriarUsuarioDto = {
  nome: string
  email: string
  senha: string
  role: Role
}

export type AtualizarUsuarioDto = {
  nome: string
  email: string
  role: Role
}

export type RegistrarUsuarioDto = {
  nome: string
  email: string
  senha: string
}

export type AprovarSolicitacaoDto = {
  role: Role
}

type Body = Record<string, unknown>

export function parseLoginDto(body: unknown): LoginDto {
  const data = asBody(body)
  const email = emailField(data, 'email')
  const senha = stringField(data, 'senha', MAX_SENHA)

  return { email, senha }
}

export function parseCriarUsuarioDto(body: unknown): CriarUsuarioDto {
  const data = asBody(body)
  const nome = stringField(data, 'nome', MAX_NOME)
  const email = emailField(data, 'email')
  const senha = stringField(data, 'senha', MAX_SENHA)
  const role = stringField(data, 'role') as Role

  if (!TODAS_AS_ROLES.includes(role)) throw badRequest('Perfil de usuario invalido.')
  if (senha.length < MIN_SENHA) throw badRequest(`A senha deve ter pelo menos ${MIN_SENHA} caracteres.`)

  return { nome, email, senha, role }
}

export function parseRegistrarUsuarioDto(body: unknown): RegistrarUsuarioDto {
  const data = asBody(body)
  const nome = stringField(data, 'nome', MAX_NOME)
  const email = emailField(data, 'email')
  const senha = stringField(data, 'senha', MAX_SENHA)

  if (senha.length < MIN_SENHA) throw badRequest(`A senha deve ter pelo menos ${MIN_SENHA} caracteres.`)

  return { nome, email, senha }
}

export function parseAtualizarUsuarioDto(body: unknown): AtualizarUsuarioDto {
  const data = asBody(body)
  const nome = stringField(data, 'nome', MAX_NOME)
  const email = emailField(data, 'email')
  const role = stringField(data, 'role') as Role

  if (!TODAS_AS_ROLES.includes(role)) throw badRequest('Perfil de usuario invalido.')

  return { nome, email, role }
}

export function parseAprovarSolicitacaoDto(body: unknown): AprovarSolicitacaoDto {
  const data = asBody(body)
  const role = (data.role ?? data.papel) as Role

  if (typeof role !== 'string' || !TODAS_AS_ROLES.includes(role)) {
    throw badRequest('Perfil de usuario invalido.')
  }

  return { role }
}

function asBody(body: unknown): Body {
  if (!body || typeof body !== 'object') throw badRequest('Corpo da requisicao invalido.')
  return body as Body
}

function emailField(body: Body, field: string) {
  const email = stringField(body, field, MAX_EMAIL).toLowerCase()
  if (!EMAIL_RE.test(email)) throw badRequest('E-mail invalido.')
  return email
}

function stringField(body: Body, field: string, max = 200) {
  const value = body[field]
  if (typeof value !== 'string' || !value.trim()) {
    throw badRequest(`Campo obrigatorio: ${field}.`)
  }
  const trimmed = value.trim()
  if (trimmed.length > max) throw badRequest(`Campo ${field} excede ${max} caracteres.`)
  return trimmed
}

export type RedefinirSenhaDto = {
  senha: string
}

export function parseRedefinirSenhaDto(body: unknown): RedefinirSenhaDto {
  const data = asBody(body)
  const senha = stringField(data, 'senha', MAX_SENHA)

  if (senha.length < MIN_SENHA) {
    throw badRequest(`A senha deve ter pelo menos ${MIN_SENHA} caracteres.`)
  }

  return { senha }
}
