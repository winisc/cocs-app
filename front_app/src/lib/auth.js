/**
 * Autenticação do painel.
 *
 * O token JWT fica no `sessionStorage`: ao fechar o navegador a sessão cai.
 * O backend continua sendo a fonte de verdade via `/auth/me` a cada recarga.
 */
import { apiConfigurada, apiFetch, limparSessaoApi, salvarToken, tokenAtual } from './api'

/**
 * Atalho de desenvolvimento. Entra sem servidor para dar para construir o
 * dashboard antes da API existir.
 *
 * Duas travas para nunca chegar em produção:
 *  - `import.meta.env.DEV` é falso em qualquer build, então o Vite remove
 *    este caminho do bundle final;
 *  - exige `VITE_AUTH_FAKE=1` no .env, ou seja, não basta rodar em dev.
 *
 * Não há aviso na tela. O alerta ficou no console: nada indica, olhando o
 * painel, que o login não está validando nada — vale lembrar disso antes de
 * mostrar a tela para alguém.
 */
export const MODO_FALSO = import.meta.env.DEV && import.meta.env.VITE_AUTH_FAKE === '1'

if (MODO_FALSO) {
  console.warn('[auth] VITE_AUTH_FAKE=1 — o login aceita qualquer credencial.')
}

const CHAVE_SESSAO = 'cocs.sessao'

export class AuthError extends Error {
  constructor(message) {
    super(message)
    this.name = 'AuthError'
  }
}

const SEM_SERVIDOR =
  'A API do painel não foi configurada. Confira o VITE_API_URL do front.'

/**
 * Recupera a sessão de quem já estava logado.
 *
 * É assíncrona de propósito, mesmo hoje sendo instantânea: quando virar uma
 * chamada de rede, a guarda de rota já sabe esperar. Se ela fosse síncrona
 * agora, a primeira versão com servidor jogaria todo mundo para o login a
 * cada recarga de página, porque a resposta ainda não teria chegado.
 *
 * @returns {Promise<{ nome: string, email: string } | null>}
 */
export async function restoreSession() {
  if (MODO_FALSO) {
    const salva = sessionStorage.getItem(CHAVE_SESSAO)
    return salva ? JSON.parse(salva) : null
  }

  if (!apiConfigurada()) return null
  if (!tokenAtual()) return null

  const dados = await apiFetch('/auth/me', { redirectOnUnauthorized: false })
  return normalizarUsuario(dados.usuario)
}

export function temSessaoLocal() {
  if (MODO_FALSO) return Boolean(sessionStorage.getItem(CHAVE_SESSAO))
  return Boolean(tokenAtual())
}

/** @returns {Promise<{ nome: string, email: string }>} */
export async function signIn({ email, senha }) {
  if (MODO_FALSO) return abrirSessaoFalsa(email)
  if (!apiConfigurada()) throw new AuthError(SEM_SERVIDOR)

  const dados = await apiFetch('/auth/login', {
    method: 'POST',
    auth: false,
    body: { email, senha },
  })

  return abrirSessaoApi(dados)
}

/** @returns {Promise<{ nome: string, email: string }>} */
export async function signUp({ nome, email, senha }) {
  if (MODO_FALSO) return { usuario: abrirSessaoFalsa(email, nome) }
  if (!apiConfigurada()) throw new AuthError(SEM_SERVIDOR)

  const dados = await apiFetch('/auth/register', {
    method: 'POST',
    auth: false,
    body: { nome, email, senha },
  })

  return {
    pendente: true,
    solicitacao: {
      nome,
      email,
      mensagem: dados.solicitacao?.mensagem,
    },
  }
}

export async function signOut() {
  if (MODO_FALSO) sessionStorage.removeItem(CHAVE_SESSAO)
  else limparSessaoApi()
}

function abrirSessaoFalsa(email, nome) {
  const usuario = { nome: nome || email.split('@')[0], email, papel: 'admin' }
  sessionStorage.setItem(CHAVE_SESSAO, JSON.stringify(usuario))
  return usuario
}

function abrirSessaoApi(dados) {
  salvarToken(dados.token)
  const usuario = normalizarUsuario(dados.usuario)
  sessionStorage.setItem(CHAVE_SESSAO, JSON.stringify(usuario))
  return usuario
}

function normalizarUsuario(usuario) {
  return {
    ...usuario,
    papel: usuario.papel ?? usuario.role,
  }
}
