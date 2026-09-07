import type { Role } from '../../shared/auth/roles'

export type Usuario = {
  id: string
  nome: string
  email: string
  role: Role
  ativo: boolean
  criadoEm: string
}

export type UsuarioComSenha = Usuario & {
  senhaHash: string
}

export type UsuarioPublico = Omit<Usuario, 'ativo'> & {
  ativo: boolean
}

export type SolicitacaoDeAcesso = {
  id: string
  nome: string
  email: string
  pedidoEm: string
  senhaHash: string
}

export type SolicitacaoDeAcessoPublica = Omit<SolicitacaoDeAcesso, 'senhaHash'>

export type SolicitacaoDeAcessoRecebida = {
  mensagem: string
}

export type RedefinicaoDeSenha = {
  id: string
  usuarioId: string
  usuarioNome: string
  usuarioEmail: string
  expiraEm: string
  usadaEm: string | null
}

/** O que o painel recebe ao gerar um link. O token aparece uma vez só. */
export type RedefinicaoCriada = {
  token: string
  expiraEm: string
}

/** O que a página pública sabe antes de a pessoa digitar a senha nova. */
export type RedefinicaoAberta = {
  nome: string
  expiraEm: string
}
