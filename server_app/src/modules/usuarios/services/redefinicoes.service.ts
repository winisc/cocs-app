import { createHash, randomBytes } from 'node:crypto'
import bcrypt from 'bcryptjs'
import { badRequest, notFound } from '../../../shared/errors/http-error'
import type { RedefinicaoAberta, RedefinicaoCriada } from '../types'
import { RedefinicoesRepository } from '../repositories/redefinicoes.repository'
import { UsuariosRepository } from '../repositories/usuarios.repository'

/** Uma hora. Tempo de a recepção passar o link adiante, e pouco mais. */
export const VALIDADE_MS = 60 * 60 * 1000

const LINK_INVALIDO = 'Este link não vale mais. Peça um novo a um administrador.'

export class RedefinicoesService {
  constructor(
    private readonly repository: RedefinicoesRepository,
    private readonly usuarios: UsuariosRepository,
  ) {}

  /**
   * Gera o link para um usuário existente.
   *
   * O token volta em texto puro aqui e em nenhum outro lugar: o banco guarda
   * só o hash. Se o administrador fechar a janela sem copiar, não há como
   * recuperar — gera outro, e o anterior morre junto.
   */
  async criar(usuarioId: string, criadaPor: string | null): Promise<RedefinicaoCriada> {
    const usuario = await this.usuarios.buscarPorId(usuarioId)
    if (!usuario) throw notFound('Usuario nao encontrado.')

    const token = randomBytes(32).toString('base64url')
    const expiraEm = new Date(Date.now() + VALIDADE_MS)

    await this.repository.criar(usuarioId, hashDoToken(token), expiraEm, criadaPor)

    return { token, expiraEm: expiraEm.toISOString() }
  }

  /** O que a página pública mostra antes do formulário. Sem e-mail nem id. */
  async abrir(token: string): Promise<RedefinicaoAberta> {
    const redefinicao = await this.valida(token)
    return { nome: redefinicao.usuarioNome, expiraEm: redefinicao.expiraEm }
  }

  async concluir(token: string, senha: string) {
    const redefinicao = await this.valida(token)
    const senhaHash = await bcrypt.hash(senha, 10)

    const trocou = await this.repository.usar(redefinicao.id, redefinicao.usuarioId, senhaHash)
    // Perdeu a corrida para outro envio do mesmo link.
    if (!trocou) throw badRequest(LINK_INVALIDO)
  }

  /**
   * Inexistente, vencido e já usado dão a mesma resposta.
   *
   * Distinguir contaria a quem está testando tokens que um deles existiu, e
   * quando — e para quem chegou pelo link certo, os três casos pedem a mesma
   * ação: falar com um administrador.
   */
  private async valida(token: string) {
    const redefinicao = await this.repository.buscarPorTokenHash(hashDoToken(token))

    if (!redefinicao) throw badRequest(LINK_INVALIDO)
    if (redefinicao.usadaEm) throw badRequest(LINK_INVALIDO)
    if (new Date(redefinicao.expiraEm) <= new Date()) throw badRequest(LINK_INVALIDO)

    return redefinicao
  }
}

function hashDoToken(token: string) {
  return createHash('sha256').update(token).digest('hex')
}
