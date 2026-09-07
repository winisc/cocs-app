import bcrypt from 'bcryptjs'
import type { AuthUser } from '../../../shared/auth/auth.types'
import { conflict, forbidden, notFound, unauthorized } from '../../../shared/errors/http-error'
import type {
  AprovarSolicitacaoDto,
  AtualizarUsuarioDto,
  CriarUsuarioDto,
  LoginDto,
  RegistrarUsuarioDto,
} from '../dtos/usuarios.dto'
import type {
  SolicitacaoDeAcesso,
  SolicitacaoDeAcessoPublica,
  SolicitacaoDeAcessoRecebida,
  UsuarioComSenha,
  UsuarioPublico,
} from '../types'
import { UsuariosRepository } from '../repositories/usuarios.repository'

const MENSAGEM_SOLICITACAO_RECEBIDA = 'Solicitacao recebida para analise.'

export class UsuariosService {
  constructor(private readonly repository: UsuariosRepository) {}

  async listar(): Promise<UsuarioPublico[]> {
    const usuarios = await this.repository.listar()
    return usuarios.map(publico)
  }

  async criar(dto: CriarUsuarioDto): Promise<UsuarioPublico> {
    const existente = await this.repository.buscarPorEmail(dto.email)
    if (existente) throw conflict('Ja existe um usuario com este e-mail.')

    const solicitacao = await this.repository.buscarSolicitacaoPorEmail(dto.email)
    if (solicitacao) throw conflict('Ja existe uma solicitacao pendente para este e-mail.')

    const senhaHash = await bcrypt.hash(dto.senha, 10)
    return publico(await this.repository.criar(dto, senhaHash))
  }

  async solicitarAcesso(dto: RegistrarUsuarioDto): Promise<SolicitacaoDeAcessoRecebida> {
    const [usuario, solicitacao] = await Promise.all([
      this.repository.buscarPorEmail(dto.email),
      this.repository.buscarSolicitacaoPorEmail(dto.email),
    ])

    if (!usuario && !solicitacao) {
      const senhaHash = await bcrypt.hash(dto.senha, 10)
      await this.repository.criarSolicitacao(dto, senhaHash)
    }

    return { mensagem: MENSAGEM_SOLICITACAO_RECEBIDA }
  }

  async listarSolicitacoes(): Promise<SolicitacaoDeAcessoPublica[]> {
    const solicitacoes = await this.repository.listarSolicitacoes()
    return solicitacoes.map(solicitacaoPublica)
  }

  async aprovarSolicitacao(id: string, dto: AprovarSolicitacaoDto): Promise<UsuarioPublico> {
    const solicitacao = await this.repository.buscarSolicitacaoPorId(id)
    if (!solicitacao) throw notFound('Solicitacao nao encontrada.')

    const existente = await this.repository.buscarPorEmail(solicitacao.email)
    if (existente) throw conflict('Ja existe um usuario com este e-mail.')

    return publico(await this.repository.criarComHashERemoverSolicitacao(solicitacao, dto.role))
  }

  async recusarSolicitacao(id: string) {
    const recusou = await this.repository.removerSolicitacao(id)
    if (!recusou) throw notFound('Solicitacao nao encontrada.')
  }

  async atualizar(id: string, dto: AtualizarUsuarioDto): Promise<UsuarioPublico> {
    await this.buscarPorId(id)

    const existente = await this.repository.buscarPorEmail(dto.email)
    if (existente && existente.id !== id) throw conflict('Ja existe um usuario com este e-mail.')

    const usuario = await this.repository.atualizar(id, dto)
    if (!usuario) throw notFound('Usuario nao encontrado.')
    return publico(usuario)
  }

  async excluir(id: string, usuarioAtualId: string) {
    if (id === usuarioAtualId) throw forbidden('Voce nao pode excluir a propria conta.')

    const excluiu = await this.repository.excluir(id)
    if (!excluiu) throw notFound('Usuario nao encontrado.')
  }

  async buscarPorId(id: string): Promise<UsuarioPublico> {
    const usuario = await this.repository.buscarPorId(id)
    if (!usuario) throw notFound('Usuario nao encontrado.')
    return publico(usuario)
  }

  async validarLogin(dto: LoginDto): Promise<AuthUser> {
    const usuario = await this.repository.buscarPorEmail(dto.email)
    if (!usuario || !usuario.ativo) throw unauthorized('E-mail ou senha invalidos.')

    const senhaOk = await bcrypt.compare(dto.senha, usuario.senhaHash)
    if (!senhaOk) throw unauthorized('E-mail ou senha invalidos.')

    return {
      id: usuario.id,
      nome: usuario.nome,
      email: usuario.email,
      role: usuario.role,
    }
  }
}

function publico(usuario: UsuarioComSenha): UsuarioPublico {
  const { senhaHash: _senhaHash, ...semSenha } = usuario
  return semSenha
}

function solicitacaoPublica(solicitacao: SolicitacaoDeAcesso): SolicitacaoDeAcessoPublica {
  const { senhaHash: _senhaHash, ...semSenha } = solicitacao
  return semSenha
}
