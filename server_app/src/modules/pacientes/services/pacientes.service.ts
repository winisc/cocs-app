import { conflict, notFound } from '../../../shared/errors/http-error'
import type { AtualizarPacienteDto, CriarPacienteDto } from '../dtos/pacientes.dto'
import { PacientesRepository } from '../repositories/pacientes.repository'

export class PacientesService {
  constructor(private readonly repository: PacientesRepository) {}

  async listar() {
    return this.repository.listar()
  }

  async buscarPorId(id: string) {
    const paciente = await this.repository.buscarPorId(id)
    if (!paciente) throw notFound('Paciente nao encontrado.')
    return paciente
  }

  async criar(dto: CriarPacienteDto) {
    const existente = await this.repository.buscarPorNomeCompleto(dto.nome, dto.sobrenome)
    if (existente) throw conflict('Ja existe um paciente com este nome e sobrenome.')
    return this.repository.criar(dto)
  }

  async atualizar(id: string, dto: AtualizarPacienteDto) {
    await this.buscarPorId(id)

    const existente = await this.repository.buscarPorNomeCompleto(dto.nome, dto.sobrenome)
    if (existente && existente.id !== id) {
      throw conflict('Ja existe outro paciente com este nome e sobrenome.')
    }

    const paciente = await this.repository.atualizar(id, dto)
    if (!paciente) throw notFound('Paciente nao encontrado.')
    return paciente
  }

  async excluir(id: string) {
    const excluiu = await this.repository.excluir(id)
    if (!excluiu) throw notFound('Paciente nao encontrado.')
  }
}
