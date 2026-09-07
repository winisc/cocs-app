import { randomUUID } from 'node:crypto'
import { query } from '../../../shared/database/postgres'
import type { Anamnese, RespostaAnamnese, StatusAnamnese } from '../types'

type AnamneseRow = {
  id: string
  paciente_id: string
  status: StatusAnamnese
  token: string
  criada_em: Date | string
  respondida_em: Date | string | null
  criada_por: string | null
  respostas: RespostaAnamnese[] | string
}

export class AnamneseRepository {
  async listar() {
    const { rows } = await query<AnamneseRow>(
      `select id, paciente_id, status, token, criada_em, respondida_em, criada_por, respostas
       from anamneses
       order by criada_em desc`,
    )
    return rows.map(anamnese)
  }

  async buscarPorId(id: string) {
    const { rows } = await query<AnamneseRow>(
      `select id, paciente_id, status, token, criada_em, respondida_em, criada_por, respostas
       from anamneses
       where id = $1`,
      [id],
    )
    return rows[0] ? anamnese(rows[0]) : null
  }

  async buscarPorToken(token: string) {
    const { rows } = await query<AnamneseRow>(
      `select id, paciente_id, status, token, criada_em, respondida_em, criada_por, respostas
       from anamneses
       where token = $1`,
      [token],
    )
    return rows[0] ? anamnese(rows[0]) : null
  }

  async listarPorPaciente(pacienteId: string) {
    const { rows } = await query<AnamneseRow>(
      `select id, paciente_id, status, token, criada_em, respondida_em, criada_por, respostas
       from anamneses
       where paciente_id = $1
       order by criada_em desc`,
      [pacienteId],
    )
    return rows.map(anamnese)
  }

  async criar(pacienteId: string, criadaPor: string | null) {
    const { rows } = await query<AnamneseRow>(
      `insert into anamneses (id, paciente_id, status, token, criada_por, respostas)
       values ($1, $2, 'pendente', $3, $4, '[]'::jsonb)
       returning id, paciente_id, status, token, criada_em, respondida_em, criada_por, respostas`,
      [randomUUID(), pacienteId, randomUUID().replaceAll('-', ''), criadaPor],
    )
    return anamnese(rows[0]!)
  }

  async salvarRespostas(id: string, respostas: RespostaAnamnese[]) {
    const { rows } = await query<AnamneseRow>(
      `update anamneses
       set status = 'concluida',
           respondida_em = now(),
           respostas = $2::jsonb
       where id = $1
       returning id, paciente_id, status, token, criada_em, respondida_em, criada_por, respostas`,
      [id, JSON.stringify(respostas)],
    )
    return rows[0] ? anamnese(rows[0]) : null
  }

  async excluir(id: string) {
    const { rowCount } = await query('delete from anamneses where id = $1', [id])
    return Boolean(rowCount)
  }
}

function anamnese(row: AnamneseRow): Anamnese {
  return {
    id: row.id,
    pacienteId: row.paciente_id,
    status: row.status,
    token: row.token,
    criadaEm: data(row.criada_em),
    respondidaEm: row.respondida_em ? data(row.respondida_em) : null,
    criadaPor: row.criada_por,
    respostas: Array.isArray(row.respostas) ? row.respostas : JSON.parse(row.respostas),
  }
}

function data(value: Date | string) {
  return value instanceof Date ? value.toISOString() : new Date(value).toISOString()
}

export const anamneseRepository = new AnamneseRepository()
