import type { Paciente } from '../pacientes/types'

export type StatusAnamnese = 'pendente' | 'concluida'
export type SituacaoAnamnese = 'em_espera' | 'expirada' | 'concluida'

export type RespostaAnamnese = {
  id: string
  pergunta: string
  resposta: string
}

export type Anamnese = {
  id: string
  pacienteId: string
  status: StatusAnamnese
  token: string
  criadaEm: string
  respondidaEm: string | null
  criadaPor: string | null
  respostas: RespostaAnamnese[]
}

export type AnamneseComPaciente = Omit<Anamnese, 'token'> & {
  token: string | null
  paciente: Paciente
  situacao: SituacaoAnamnese
  diasRestantes: number
}

export type AnamnesePublica = {
  situacao: SituacaoAnamnese
  nome: string
}

export type AnamneseRespondidaPublica = {
  situacao: SituacaoAnamnese
}
