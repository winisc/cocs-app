import { apiConfigurada, apiFetch } from './api'
import { AuthError } from './auth'

const SEM_SERVIDOR =
  'Ainda não há servidor. Esta tela está pronta, mas nada aqui é salvo de verdade.'

/**
 * Redefinição de senha por link temporário.
 *
 * O token é a credencial: quem o tem troca a senha de alguém. Por isso ele
 * volta do servidor uma vez só, na criação — não há como pedir de novo.
 */
export async function criarRedefinicao(usuarioId) {
  if (!apiConfigurada()) throw new AuthError(SEM_SERVIDOR)
  const dados = await apiFetch(`/usuarios/${usuarioId}/redefinicoes`, { method: 'POST' })
  return dados.redefinicao
}

/** Abre o link, sem sessão: quem chega aqui é quem não consegue entrar. */
export async function abrirRedefinicao(token) {
  if (!apiConfigurada()) throw new AuthError(SEM_SERVIDOR)
  const dados = await apiFetch(`/redefinicoes/${token}`, { auth: false })
  return dados.redefinicao
}

export async function concluirRedefinicao(token, senha) {
  if (!apiConfigurada()) throw new AuthError(SEM_SERVIDOR)
  await apiFetch(`/redefinicoes/${token}`, {
    method: 'POST',
    auth: false,
    body: { senha },
    // 401 aqui não é sessão vencida: é o link que não vale. Redirecionar para
    // o login jogaria a pessoa fora no meio de trocar a senha.
    redirectOnUnauthorized: false,
  })
}

/** Quanto tempo falta, em texto, para a tela não obrigar ninguém a fazer conta. */
export function tempoRestante(expiraEm, agora = Date.now()) {
  // Arredonda em vez de truncar: recém-criado, o link tem 59,99 minutos, e
  // truncar mostrava "59 minutos" para uma validade que a tela chama de uma
  // hora em todo lugar.
  const minutos = Math.round((new Date(expiraEm).getTime() - agora) / 60000)
  if (minutos <= 0) return 'expirado'
  if (minutos < 60) return `${minutos} ${minutos === 1 ? 'minuto' : 'minutos'}`
  return '1 hora'
}
