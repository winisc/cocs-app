/**
 * Usuários do painel e solicitações de cadastro.
 *
 * Usa a API quando `VITE_API_URL` está configurado. O mock só fica para o
 * modo falso de desenvolvimento.
 */
import { AuthError, MODO_FALSO } from './auth'
import { apiConfigurada, apiFetch } from './api'

const SEM_SERVIDOR =
  'Ainda não há servidor. Esta tela está pronta, mas nada aqui é salvo de verdade.'

/**
 * Os papéis são fechados de propósito. Permissão em campo livre vira erro de
 * digitação que ninguém percebe até alguém não conseguir entrar.
 */
export const PAPEIS = [
  { id: 'admin', rotulo: 'Administrador', descricao: 'Acesso total' },
  { id: 'dentista', rotulo: 'Dentista', descricao: 'Vizualize pacientes' },
  { id: 'recepcao', rotulo: 'Recepção', descricao: 'Gera e vizualiza anamenses' },
]

export const PAPEL_PADRAO = 'recepcao'

export function rotuloDoPapel(id) {
  return PAPEIS.find((p) => p.id === id)?.rotulo ?? id
}

/* ------------------------------------------------------------------ */
/* Dados de exemplo — só existem em modo de desenvolvimento.           */
/* ------------------------------------------------------------------ */

let usuarios = [
  { id: 'u1', nome: 'Adelci Sousa', email: 'adelci.sousa@cocs.com.br', papel: 'admin' },
  { id: 'u2', nome: 'Marina Alves', email: 'marina.alves@cocs.com.br', papel: 'dentista' },
  { id: 'u3', nome: 'Rafael Lima', email: 'rafael.lima@cocs.com.br', papel: 'dentista' },
  { id: 'u4', nome: 'Cleide Barros', email: 'cleide.barros@cocs.com.br', papel: 'recepcao' },
]

let solicitacoes = [
  { id: 's1', nome: 'Joana Ribeiro', email: 'joana.ribeiro@cocs.com.br', pedidoEm: '2026-08-27' },
  { id: 's2', nome: 'Tiago Mendes', email: 'tiago.mendes@cocs.com.br', pedidoEm: '2026-08-29' },
]

const eco = (valor) => Promise.resolve(structuredClone(valor))

function exigirServidor() {
  if (!MODO_FALSO && !apiConfigurada()) throw new AuthError(SEM_SERVIDOR)
}

/* ------------------------------------------------------------------ */
/* Operações                                                           */
/* ------------------------------------------------------------------ */

export async function listarUsuarios() {
  exigirServidor()
  if (!MODO_FALSO) {
    const dados = await apiFetch('/usuarios')
    return dados.usuarios.map(normalizarUsuario)
  }

  return eco(usuarios)
}

export async function listarSolicitacoes() {
  exigirServidor()
  if (!MODO_FALSO) {
    const dados = await apiFetch('/usuarios/solicitacoes')
    return dados.solicitacoes
  }

  return eco(solicitacoes)
}

/** Só nome, e-mail e papel. O resto do cadastro não se edita por aqui. */
export async function atualizarUsuario(id, { nome, email, papel }) {
  exigirServidor()
  if (!MODO_FALSO) {
    const dados = await apiFetch(`/usuarios/${id}`, {
      method: 'PUT',
      body: { nome, email, role: papel },
    })
    return normalizarUsuario(dados.usuario)
  }

  usuarios = usuarios.map((u) => (u.id === id ? { ...u, nome, email, papel } : u))
  return eco(usuarios.find((u) => u.id === id))
}

export async function excluirUsuario(id) {
  exigirServidor()
  if (!MODO_FALSO) {
    await apiFetch(`/usuarios/${id}`, { method: 'DELETE' })
    return
  }

  usuarios = usuarios.filter((u) => u.id !== id)
}

/** Aprovar é onde o papel é decidido — a solicitação não escolhe o próprio. */
export async function aprovarSolicitacao(id, papel) {
  exigirServidor()
  if (!MODO_FALSO) {
    await apiFetch(`/usuarios/solicitacoes/${id}/aprovar`, {
      method: 'POST',
      body: { role: papel },
    })
    return null
  }

  const pedido = solicitacoes.find((s) => s.id === id)
  if (!pedido) return null
  solicitacoes = solicitacoes.filter((s) => s.id !== id)
  const novo = { id: `u${Date.now()}`, nome: pedido.nome, email: pedido.email, papel }
  usuarios = [...usuarios, novo]
  return eco(novo)
}

export async function recusarSolicitacao(id) {
  exigirServidor()
  if (!MODO_FALSO) {
    await apiFetch(`/usuarios/solicitacoes/${id}`, { method: 'DELETE' })
    return
  }

  solicitacoes = solicitacoes.filter((s) => s.id !== id)
}

function normalizarUsuario(usuario) {
  return {
    ...usuario,
    papel: usuario.papel ?? usuario.role,
  }
}
