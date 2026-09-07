const API = (import.meta.env.VITE_API_URL ?? '').replace(/\/$/, '')
const CHAVE_TOKEN = 'cocs.token'
const CHAVE_SESSAO = 'cocs.sessao'

export class ApiError extends Error {
  constructor(message, status) {
    super(message)
    this.name = 'ApiError'
    this.status = status
  }
}

export function apiConfigurada() {
  return Boolean(API)
}

export function salvarToken(token) {
  sessionStorage.setItem(CHAVE_TOKEN, token)
}

export function tokenAtual() {
  return sessionStorage.getItem(CHAVE_TOKEN)
}

export function limparSessaoApi() {
  sessionStorage.removeItem(CHAVE_TOKEN)
  sessionStorage.removeItem(CHAVE_SESSAO)
}

export async function apiFetch(caminho, opcoes = {}) {
  if (!API) throw new ApiError('A API do painel não foi configurada.', 0)

  const {
    auth = true,
    redirectOnUnauthorized = true,
    headers = {},
    body,
    ...resto
  } = opcoes

  const resposta = await fetch(`${API}${caminho}`, {
    ...resto,
    headers: montarHeaders({ auth, headers, body }),
    body: prepararBody(body),
  })

  const dados = await lerResposta(resposta)

  if (!resposta.ok) {
    if (resposta.status === 401 && auth) {
      limparSessaoApi()
      if (redirectOnUnauthorized && window.location.pathname !== '/login') {
        window.location.assign('/login')
      }
    }

    throw new ApiError(dados?.erro ?? dados?.message ?? 'Não foi possível concluir a operação.', resposta.status)
  }

  return dados
}

function montarHeaders({ auth, headers, body }) {
  const todos = { ...headers }

  if (body && !(body instanceof FormData)) {
    todos['Content-Type'] = todos['Content-Type'] ?? 'application/json'
  }

  const token = tokenAtual()
  if (auth && token) {
    todos.Authorization = `Bearer ${token}`
  }

  return todos
}

function prepararBody(body) {
  if (!body || body instanceof FormData || typeof body === 'string') return body
  return JSON.stringify(body)
}

async function lerResposta(resposta) {
  const texto = await resposta.text()
  if (!texto) return null

  try {
    return JSON.parse(texto)
  } catch {
    return { message: texto }
  }
}
