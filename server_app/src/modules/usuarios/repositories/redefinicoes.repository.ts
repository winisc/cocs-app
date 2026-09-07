import { randomUUID } from 'node:crypto'
import { query, transaction } from '../../../shared/database/postgres'
import type { RedefinicaoDeSenha } from '../types'

type RedefinicaoRow = {
  id: string
  usuario_id: string
  expira_em: Date | string
  usada_em: Date | string | null
  usuario_nome: string
  usuario_email: string
}

export class RedefinicoesRepository {
  /**
   * Registra um pedido e derruba os anteriores da mesma pessoa.
   *
   * Dois links válidos ao mesmo tempo é pedir confusão: o administrador manda
   * um segundo porque o primeiro "não chegou", e aí os dois funcionam. Marcar
   * os antigos como usados deixa valendo só o último.
   */
  async criar(usuarioId: string, tokenHash: string, expiraEm: Date, criadaPor: string | null) {
    return transaction(async (client) => {
      await client.query(
        `update redefinicoes_senha
            set usada_em = now()
          where usuario_id = $1 and usada_em is null`,
        [usuarioId],
      )

      const { rows } = await client.query<{ id: string }>(
        `insert into redefinicoes_senha (id, usuario_id, token_hash, expira_em, criada_por)
         values ($1, $2, $3, $4, $5)
         returning id`,
        [randomUUID(), usuarioId, tokenHash, expiraEm.toISOString(), criadaPor],
      )

      return rows[0]!.id
    })
  }

  async buscarPorTokenHash(tokenHash: string): Promise<RedefinicaoDeSenha | null> {
    const { rows } = await query<RedefinicaoRow>(
      `select r.id, r.usuario_id, r.expira_em, r.usada_em, u.nome as usuario_nome, u.email as usuario_email
         from redefinicoes_senha r
         join usuarios u on u.id = r.usuario_id
        where r.token_hash = $1`,
      [tokenHash],
    )
    return rows[0] ? redefinicao(rows[0]) : null
  }

  /**
   * Troca a senha e queima o link, ou não faz nem uma coisa nem outra.
   *
   * A cláusula `usada_em is null` no update é o que impede dois envios
   * simultâneos de valerem: o segundo não encontra linha para atualizar.
   */
  async usar(id: string, usuarioId: string, senhaHash: string) {
    return transaction(async (client) => {
      const { rowCount } = await client.query(
        `update redefinicoes_senha
            set usada_em = now()
          where id = $1 and usada_em is null and expira_em > now()`,
        [id],
      )
      if (!rowCount) return false

      await client.query(`update usuarios set senha_hash = $1 where id = $2`, [senhaHash, usuarioId])
      return true
    })
  }
}

function redefinicao(row: RedefinicaoRow): RedefinicaoDeSenha {
  return {
    id: row.id,
    usuarioId: row.usuario_id,
    usuarioNome: row.usuario_nome,
    usuarioEmail: row.usuario_email,
    expiraEm: data(row.expira_em),
    usadaEm: row.usada_em ? data(row.usada_em) : null,
  }
}

function data(value: Date | string) {
  return value instanceof Date ? value.toISOString() : new Date(value).toISOString()
}

export const redefinicoesRepository = new RedefinicoesRepository()
