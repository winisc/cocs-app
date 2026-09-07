import { conflict, notFound } from '../../../shared/errors/http-error'
import { ROLES } from '../../../shared/auth/roles'
import type { Role } from '../../../shared/auth/roles'
import { pacientesRepository } from '../../pacientes/repositories/pacientes.repository'
import type { Paciente } from '../../pacientes/types'
import type { CriarAnamneseDto, ResponderAnamneseDto } from '../dtos/anamnese.dto'
import { AnamneseRepository } from '../repositories/anamnese.repository'
import type {
  Anamnese,
  AnamneseComPaciente,
  AnamnesePublica,
  AnamneseRespondidaPublica,
  SituacaoAnamnese,
} from '../types'

const DIAS_PARA_EXPIRAR = 7

export class AnamneseService {
  constructor(private readonly repository: AnamneseRepository) {}

  async listar(): Promise<AnamneseComPaciente[]> {
    const [anamneses, pacientes] = await Promise.all([
      this.repository.listar(),
      pacientesRepository.listar(),
    ])

    return anamneses
      .map((anamnese) => juntarPaciente(anamnese, pacientes))
      .filter((anamnese): anamnese is AnamneseComPaciente => Boolean(anamnese))
      .sort((a, b) => b.criadaEm.localeCompare(a.criadaEm))
  }

  async listarPorPaciente(pacienteId: string, role: Role): Promise<AnamneseComPaciente[]> {
    const paciente = await pacientesRepository.buscarPorId(pacienteId)
    if (!paciente) throw notFound('Paciente nao encontrado.')

    const anamneses = await this.repository.listarPorPaciente(pacienteId)
    return anamneses.map((anamnese) => comSituacao(anamnese, paciente, { token: podeVerToken(role) }))
  }

  async criar(dto: CriarAnamneseDto, criadaPor: string | null) {
    const paciente = await pacientesRepository.buscarPorId(dto.pacienteId)
    if (!paciente) throw notFound('Paciente nao encontrado.')

    const existentes = await this.repository.listarPorPaciente(dto.pacienteId)
    if (existentes.some((anamnese) => situacaoDa(anamnese) === 'em_espera')) {
      throw conflict('Este paciente ja possui uma anamnese em espera.')
    }

    return comSituacao(await this.repository.criar(dto.pacienteId, criadaPor), paciente)
  }

  async buscarPublicaPorToken(token: string): Promise<AnamnesePublica> {
    const anamnese = await this.repository.buscarPorToken(token)
    if (!anamnese) throw notFound('Anamnese nao encontrada.')

    const paciente = await pacientesRepository.buscarPorId(anamnese.pacienteId)
    if (!paciente) throw notFound('Paciente nao encontrado.')

    return publica(anamnese, paciente)
  }

  async responderPorToken(token: string, dto: ResponderAnamneseDto): Promise<AnamneseRespondidaPublica> {
    const anamnese = await this.repository.buscarPorToken(token)
    if (!anamnese) throw notFound('Anamnese nao encontrada.')

    const situacao = situacaoDa(anamnese)
    if (situacao === 'expirada') throw conflict('Este link expirou.')
    if (situacao === 'concluida') throw conflict('Esta anamnese ja foi respondida.')

    const paciente = await pacientesRepository.buscarPorId(anamnese.pacienteId)
    if (!paciente) throw notFound('Paciente nao encontrado.')

    const nomeDaFicha = nomeDaResposta(dto.respostas)
    if (nomeDaFicha) await atualizarNomeDoPaciente(anamnese.pacienteId, nomeDaFicha, paciente)

    const atualizada = await this.repository.salvarRespostas(anamnese.id, dto.respostas)
    if (!atualizada) throw notFound('Anamnese nao encontrada.')

    return { situacao: situacaoDa(atualizada) }
  }

  async excluir(id: string) {
    const excluiu = await this.repository.excluir(id)
    if (!excluiu) throw notFound('Anamnese nao encontrada.')
  }
}

function juntarPaciente(anamnese: Anamnese, pacientes: Paciente[]) {
  const paciente = pacientes.find((item) => item.id === anamnese.pacienteId)
  return paciente ? comSituacao(anamnese, paciente) : null
}

function comSituacao(
  anamnese: Anamnese,
  paciente: Paciente,
  opcoes: { token?: boolean } = { token: true },
): AnamneseComPaciente {
  return {
    ...anamnese,
    token: opcoes.token === false ? null : anamnese.token,
    paciente,
    situacao: situacaoDa(anamnese),
    diasRestantes: diasRestantes(anamnese),
  }
}

function podeVerToken(role: Role) {
  return role === ROLES.ADMIN || role === ROLES.RECEPCAO
}

function publica(anamnese: Anamnese, paciente: Paciente): AnamnesePublica {
  return {
    situacao: situacaoDa(anamnese),
    nome: nomeCompleto(paciente),
  }
}

function nomeCompleto(paciente: Pick<Paciente, 'nome' | 'sobrenome'>) {
  return `${paciente.nome} ${paciente.sobrenome}`.trim()
}

function situacaoDa(anamnese: Anamnese): SituacaoAnamnese {
  if (anamnese.status === 'concluida') return 'concluida'
  return diasRestantes(anamnese) < 0 ? 'expirada' : 'em_espera'
}

function diasRestantes(anamnese: Anamnese) {
  return DIAS_PARA_EXPIRAR - diasEntre(anamnese.criadaEm, new Date().toISOString())
}

function diasEntre(de: string, ate: string) {
  const inicio = new Date(de).getTime()
  const fim = new Date(ate).getTime()
  return Math.floor((fim - inicio) / 86400000)
}

function nomeDaResposta(respostas: ResponderAnamneseDto['respostas']) {
  const completo = respostas
    .find((resposta) => resposta.id === 'nome')
    ?.resposta.replace(/\s+/g, ' ')
    .trim()

  if (!completo) return null

  const [nome, ...sobrenomePartes] = completo.split(' ')
  const sobrenome = sobrenomePartes.join(' ').trim()

  if (!nome || !sobrenome) return null
  return { nome, sobrenome }
}

async function atualizarNomeDoPaciente(
  id: string,
  dto: { nome: string; sobrenome: string },
  paciente: Paciente,
) {
  if (paciente.nome === dto.nome && paciente.sobrenome === dto.sobrenome) return paciente

  const existente = await pacientesRepository.buscarPorNomeCompleto(dto.nome, dto.sobrenome)
  if (existente && existente.id !== id) {
    throw conflict('Ja existe outro paciente com este nome e sobrenome.')
  }

  const atualizado = await pacientesRepository.atualizar(id, dto)
  if (!atualizado) throw notFound('Paciente nao encontrado.')
  return atualizado
}
