/**
 * Pacientes da clínica.
 *
 * Usa a API quando `VITE_API_URL` está configurado. O mock só fica para o
 * modo falso de desenvolvimento.
 */
import { AuthError, MODO_FALSO } from './auth'
import { apiConfigurada, apiFetch } from './api'
import { combina, normalizar } from './busca'

const SEM_SERVIDOR =
  'Ainda não há servidor. Esta tela está pronta, mas nada aqui é salvo de verdade.'

let pacientes = [
  { id: 'p1', nome: 'Joana', sobrenome: 'Ribeiro' },
  { id: 'p2', nome: 'Tiago', sobrenome: 'Mendes' },
  { id: 'p3', nome: 'Lucia', sobrenome: 'Fernandes' },
  { id: 'p4', nome: 'Bruno', sobrenome: 'Carvalho' },
  { id: 'p5', nome: 'Antônia', sobrenome: 'Nunes' },
  { id: 'p6', nome: 'Davi', sobrenome: 'Rocha' },
]

const eco = (valor) => Promise.resolve(structuredClone(valor))

function exigirServidor() {
  if (!MODO_FALSO && !apiConfigurada()) throw new AuthError(SEM_SERVIDOR)
}

export async function listarPacientes() {
  exigirServidor()
  if (!MODO_FALSO) {
    const dados = await apiFetch('/pacientes')
    return dados.pacientes
  }

  return eco(pacientes)
}

export async function buscarPaciente(id) {
  exigirServidor()
  if (!MODO_FALSO) {
    const dados = await apiFetch(`/pacientes/${id}`)
    return dados.paciente
  }

  return eco(pacientes.find((p) => p.id === id) ?? null)
}

/** Procura pelo cadastro mínimo atual: nome e sobrenome. */
export async function pacientePorNome({ nome, sobrenome }) {
  exigirServidor()
  const alvo = normalizar(nomeCompleto({ nome, sobrenome }))
  if (!alvo) return null

  if (!MODO_FALSO) {
    const lista = await listarPacientes()
    return lista.find((p) => normalizar(nomeCompleto(p)) === alvo) ?? null
  }

  return eco(pacientes.find((p) => normalizar(nomeCompleto(p)) === alvo) ?? null)
}

export async function criarPaciente({ nome, sobrenome }) {
  exigirServidor()
  if (!MODO_FALSO) {
    const dados = await apiFetch('/pacientes', {
      method: 'POST',
      body: { nome, sobrenome },
    })
    return dados.paciente
  }

  const novo = {
    id: `p${Date.now()}`,
    nome: nome.trim(),
    sobrenome: sobrenome.trim(),
  }
  pacientes = [...pacientes, novo]
  return eco(novo)
}

/** Só nome e sobrenome. O resto da ficha não se edita por aqui. */
export async function atualizarPaciente(id, { nome, sobrenome }) {
  exigirServidor()
  if (!MODO_FALSO) {
    const dados = await apiFetch(`/pacientes/${id}`, {
      method: 'PUT',
      body: { nome, sobrenome },
    })
    return dados.paciente
  }

  pacientes = pacientes.map((p) =>
    p.id === id ? { ...p, nome: nome.trim(), sobrenome: sobrenome.trim() } : p,
  )
  return eco(pacientes.find((p) => p.id === id))
}

export async function excluirPaciente(id) {
  exigirServidor()
  if (!MODO_FALSO) {
    await apiFetch(`/pacientes/${id}`, { method: 'DELETE' })
    return
  }

  pacientes = pacientes.filter((p) => p.id !== id)
}

/* ------------------------------------------------------------------ */
/* Formatação                                                          */
/* ------------------------------------------------------------------ */

export function nomeCompleto(paciente = {}) {
  return [paciente.nome, paciente.sobrenome].filter(Boolean).join(' ').trim()
}

/** ISO vira dd/mm/aaaa sem passar por Date: a string já é a data certa, e
 *  `new Date('1988-03-12')` volta um dia atrás dependendo do fuso. */
export function formatarData(iso) {
  // Aceita null: é o valor de "ainda não aconteceu", e quebrar aqui derruba a
  // tela toda por causa de uma data que legitimamente não existe.
  const [ano, mes, dia] = (iso ?? '').slice(0, 10).split('-')
  return ano ? `${dia}/${mes}/${ano}` : ''
}

/* ------------------------------------------------------------------ */
/* Busca                                                               */
/* ------------------------------------------------------------------ */

/** Filtra por nome completo. */
export function filtrarPacientes(pacientes, busca = '') {
  const termo = busca.trim()
  if (!termo) return pacientes

  return pacientes.filter((p) => combina(termo, nomeCompleto(p)))
}
