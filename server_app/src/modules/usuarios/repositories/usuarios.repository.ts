import { randomUUID } from 'node:crypto'
import { query, transaction } from '../../../shared/database/postgres'
import type { Role } from '../../../shared/auth/roles'
import type { AtualizarUsuarioDto, CriarUsuarioDto, RegistrarUsuarioDto } from '../dtos/usuarios.dto'
import type { SolicitacaoDeAcesso, UsuarioComSenha } from '../types'

type UsuarioRow = {
  id: string
  nome: string
  email: string
  role: Role
  ativo: boolean
  criado_em: Date | string
  senha_hash: string
}

type SolicitacaoRow = {
  id: string
  nome: string
  email: string
  pedido_em: Date | string
  senha_hash: string
}

export class UsuariosRepository {
  async listar() {
    const { rows } = await query<UsuarioRow>(
      `select id, nome, email, role, ativo, criado_em, senha_hash
       from usuarios
       order by criado_em desc`,
    )
    return rows.map(usuario)
  }

  async buscarPorId(id: string) {
    const { rows } = await query<UsuarioRow>(
      `select id, nome, email, role, ativo, criado_em, senha_hash
       from usuarios
       where id = $1`,
      [id],
    )
    return rows[0] ? usuario(rows[0]) : null
  }

  async buscarPorEmail(email: string) {
    const { rows } = await query<UsuarioRow>(
      `select id, nome, email, role, ativo, criado_em, senha_hash
       from usuarios
       where email_normalizado = $1`,
      [normalizarEmail(email)],
    )
    return rows[0] ? usuario(rows[0]) : null
  }

  async criar(dto: CriarUsuarioDto, senhaHash: string) {
    const { rows } = await query<UsuarioRow>(
      `insert into usuarios (id, nome, email, email_normalizado, role, ativo, senha_hash)
       values ($1, $2, $3, $4, $5, true, $6)
       returning id, nome, email, role, ativo, criado_em, senha_hash`,
      [randomUUID(), dto.nome, dto.email, normalizarEmail(dto.email), dto.role, senhaHash],
    )
    return usuario(rows[0]!)
  }

  async criarComHash(
    dto: Pick<CriarUsuarioDto, 'nome' | 'email' | 'role'>,
    senhaHash: string,
  ) {
    const { rows } = await query<UsuarioRow>(
      `insert into usuarios (id, nome, email, email_normalizado, role, ativo, senha_hash)
       values ($1, $2, $3, $4, $5, true, $6)
       returning id, nome, email, role, ativo, criado_em, senha_hash`,
      [randomUUID(), dto.nome, dto.email, normalizarEmail(dto.email), dto.role, senhaHash],
    )
    return usuario(rows[0]!)
  }

  async criarComHashERemoverSolicitacao(
    solicitacao: SolicitacaoDeAcesso,
    role: Role,
  ) {
    return transaction(async (client) => {
      const { rows } = await client.query<UsuarioRow>(
        `insert into usuarios (id, nome, email, email_normalizado, role, ativo, senha_hash)
         values ($1, $2, $3, $4, $5, true, $6)
         returning id, nome, email, role, ativo, criado_em, senha_hash`,
        [
          randomUUID(),
          solicitacao.nome,
          solicitacao.email,
          normalizarEmail(solicitacao.email),
          role,
          solicitacao.senhaHash,
        ],
      )

      await client.query('delete from solicitacoes_acesso where id = $1', [solicitacao.id])
      return usuario(rows[0]!)
    })
  }

  async atualizar(id: string, dto: AtualizarUsuarioDto) {
    const { rows } = await query<UsuarioRow>(
      `update usuarios
       set nome = $2, email = $3, email_normalizado = $4, role = $5
       where id = $1
       returning id, nome, email, role, ativo, criado_em, senha_hash`,
      [id, dto.nome, dto.email, normalizarEmail(dto.email), dto.role],
    )
    return rows[0] ? usuario(rows[0]) : null
  }

  async excluir(id: string) {
    const { rowCount } = await query('delete from usuarios where id = $1', [id])
    return Boolean(rowCount)
  }

  async listarSolicitacoes() {
    const { rows } = await query<SolicitacaoRow>(
      `select id, nome, email, pedido_em, senha_hash
       from solicitacoes_acesso
       order by pedido_em desc`,
    )
    return rows.map(solicitacao)
  }

  async buscarSolicitacaoPorId(id: string) {
    const { rows } = await query<SolicitacaoRow>(
      `select id, nome, email, pedido_em, senha_hash
       from solicitacoes_acesso
       where id = $1`,
      [id],
    )
    return rows[0] ? solicitacao(rows[0]) : null
  }

  async buscarSolicitacaoPorEmail(email: string) {
    const { rows } = await query<SolicitacaoRow>(
      `select id, nome, email, pedido_em, senha_hash
       from solicitacoes_acesso
       where email_normalizado = $1`,
      [normalizarEmail(email)],
    )
    return rows[0] ? solicitacao(rows[0]) : null
  }

  async criarSolicitacao(dto: RegistrarUsuarioDto, senhaHash: string) {
    const { rows } = await query<SolicitacaoRow>(
      `insert into solicitacoes_acesso (id, nome, email, email_normalizado, senha_hash)
       values ($1, $2, $3, $4, $5)
       on conflict (email_normalizado) do nothing
       returning id, nome, email, pedido_em, senha_hash`,
      [randomUUID(), dto.nome, dto.email, normalizarEmail(dto.email), senhaHash],
    )
    return rows[0] ? solicitacao(rows[0]) : null
  }

  async removerSolicitacao(id: string) {
    const { rowCount } = await query('delete from solicitacoes_acesso where id = $1', [id])
    return Boolean(rowCount)
  }
}

function usuario(row: UsuarioRow): UsuarioComSenha {
  return {
    id: row.id,
    nome: row.nome,
    email: row.email,
    role: row.role,
    ativo: row.ativo,
    criadoEm: data(row.criado_em),
    senhaHash: row.senha_hash,
  }
}

function solicitacao(row: SolicitacaoRow): SolicitacaoDeAcesso {
  return {
    id: row.id,
    nome: row.nome,
    email: row.email,
    pedidoEm: data(row.pedido_em).slice(0, 10),
    senhaHash: row.senha_hash,
  }
}

function data(value: Date | string) {
  return value instanceof Date ? value.toISOString() : new Date(value).toISOString()
}

function normalizarEmail(email: string) {
  return email.trim().toLowerCase()
}

export const usuariosRepository = new UsuariosRepository()
