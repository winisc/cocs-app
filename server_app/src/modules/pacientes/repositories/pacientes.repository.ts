import { randomUUID } from 'node:crypto'
import { query } from '../../../shared/database/postgres'
import type { AtualizarPacienteDto, CriarPacienteDto } from '../dtos/pacientes.dto'
import type { Paciente } from '../types'

type PacienteRow = {
  id: string
  nome: string
  sobrenome: string
  criado_em: Date | string
  atualizado_em: Date | string
}

export class PacientesRepository {
  async listar() {
    const { rows } = await query<PacienteRow>(
      `select id, nome, sobrenome, criado_em, atualizado_em
       from pacientes
       order by nome, sobrenome`,
    )
    return rows.map(paciente)
  }

  async buscarPorId(id: string) {
    const { rows } = await query<PacienteRow>(
      `select id, nome, sobrenome, criado_em, atualizado_em
       from pacientes
       where id = $1`,
      [id],
    )
    return rows[0] ? paciente(rows[0]) : null
  }

  async buscarPorNomeCompleto(nome: string, sobrenome: string) {
    const { rows } = await query<PacienteRow>(
      `select id, nome, sobrenome, criado_em, atualizado_em
       from pacientes
       where nome_busca = $1 and sobrenome_busca = $2`,
      [normalizar(nome), normalizar(sobrenome)],
    )
    return rows[0] ? paciente(rows[0]) : null
  }

  async criar(dto: CriarPacienteDto) {
    const { rows } = await query<PacienteRow>(
      `insert into pacientes (id, nome, sobrenome, nome_busca, sobrenome_busca)
       values ($1, $2, $3, $4, $5)
       returning id, nome, sobrenome, criado_em, atualizado_em`,
      [randomUUID(), dto.nome, dto.sobrenome, normalizar(dto.nome), normalizar(dto.sobrenome)],
    )
    return paciente(rows[0]!)
  }

  async atualizar(id: string, dto: AtualizarPacienteDto) {
    const { rows } = await query<PacienteRow>(
      `update pacientes
       set nome = $2,
           sobrenome = $3,
           nome_busca = $4,
           sobrenome_busca = $5,
           atualizado_em = now()
       where id = $1
       returning id, nome, sobrenome, criado_em, atualizado_em`,
      [id, dto.nome, dto.sobrenome, normalizar(dto.nome), normalizar(dto.sobrenome)],
    )
    return rows[0] ? paciente(rows[0]) : null
  }

  async excluir(id: string) {
    const { rowCount } = await query('delete from pacientes where id = $1', [id])
    return Boolean(rowCount)
  }
}

function paciente(row: PacienteRow): Paciente {
  return {
    id: row.id,
    nome: row.nome,
    sobrenome: row.sobrenome,
    criadoEm: data(row.criado_em),
    atualizadoEm: data(row.atualizado_em),
  }
}

function data(value: Date | string) {
  return value instanceof Date ? value.toISOString() : new Date(value).toISOString()
}

function normalizar(value: string) {
  return value
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .trim()
    .toLowerCase()
}

export const pacientesRepository = new PacientesRepository()
