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
