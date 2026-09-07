/**
 * Anamneses.
 *
 * Uma anamnese é um convite: nasce pendente, com um token próprio, e o
 * paciente responde por um link temporário. "Atualizar" não edita a resposta
 * antiga — cria uma anamnese nova para a mesma pessoa, porque o que interessa
 * clinicamente é o histórico, não o último estado.
 *
 * Mesma costura de `auth.js`: sem servidor, opera em memória e não persiste.
 */
import { AuthError, MODO_FALSO } from './auth'
import { apiConfigurada, apiFetch } from './api'
import { atualizarPaciente, listarPacientes, nomeCompleto } from './pacientes'

const SEM_SERVIDOR =
  'Ainda não há servidor. Esta tela está pronta, mas nada aqui é salvo de verdade.'

/** Quanto tempo o link fica de pé. */
export const DIAS_PARA_EXPIRAR = 7

let anamneses = [
  {
    id: 'a1',
    pacienteId: 'p1',
    status: 'preenchida',
    criadaEm: '2026-08-20',
    respondidaEm: '2026-08-21',
    criadaPor: 'Cleide Barros',
    token: 'tok-a1',
    respostas: [
      { id: 'nome', pergunta: 'Nome e sobrenome', resposta: 'Joana Ribeiro' },
      { id: 'apelido', pergunta: 'Como você gosta de ser chamado?', resposta: 'Jô' },
      {
        id: 'musica',
        pergunta: 'Qual música ou vídeo musical você gosta de ouvir?',
        resposta: 'MPB tranquila',
      },
      { id: 'hobby', pergunta: 'Tem algum hobby?', resposta: 'Sim — jardinagem' },
      {
        id: 'time',
        pergunta: 'Torce para algum time de futebol?',
        resposta: 'Não',
      },
      {
        id: 'bebida',
        pergunta: 'O que você gostaria que servíssemos aqui na clínica?',
        resposta: 'Água · Sem gás',
      },
    ],
  },
  {
    id: 'a2',
    pacienteId: 'p3',
    status: 'pendente',
    criadaEm: '2026-08-28',
    respondidaEm: null,
    criadaPor: 'Cleide Barros',
    token: 'tok-a2',
  },
  {
    id: 'a3',
    pacienteId: 'p5',
    status: 'preenchida',
    criadaEm: '2026-07-14',
    respondidaEm: '2026-07-15',
    criadaPor: 'Adelci Sousa',
    token: 'tok-a3',
    respostas: [
      { id: 'nome', pergunta: 'Nome e sobrenome', resposta: 'Antônia Nunes' },
      { id: 'apelido', pergunta: 'Como você gosta de ser chamado?', resposta: 'Tonha' },
      {
        id: 'musica',
        pergunta: 'Qual música ou vídeo musical você gosta de ouvir?',
        resposta: 'Sertanejo raiz',
      },
      { id: 'hobby', pergunta: 'Tem algum hobby?', resposta: 'Sim — crochê' },
      {
        id: 'time',
        pergunta: 'Torce para algum time de futebol?',
        resposta: 'Sim — Corinthians',
      },
      {
        id: 'bebida',
        pergunta: 'O que você gostaria que servíssemos aqui na clínica?',
        resposta: 'Café · Sem açúcar',
      },
    ],
  },
  {
    id: 'a4',
    pacienteId: 'p4',
    status: 'pendente',
    criadaEm: '2026-08-05',
    respondidaEm: null,
    criadaPor: 'Marina Alves',
    token: 'tok-a4',
  },
]

const eco = (valor) => Promise.resolve(structuredClone(valor))

function exigirServidor() {
  if (!MODO_FALSO && !apiConfigurada()) throw new AuthError(SEM_SERVIDOR)
}

const hoje = () => new Date().toISOString().slice(0, 10)

/**
 * O token é gerado no cliente só enquanto não há servidor. Token que vale como
 * credencial precisa nascer no servidor — daqui, qualquer pessoa com o console
 * aberto adivinha o próximo.
 */
function novoToken() {
  return crypto.randomUUID().replaceAll('-', '').slice(0, 24)
}

/** A lista já vem com o nome do paciente: a tela não deve cruzar isso na mão. */
export async function listarAnamneses() {
  exigirServidor()
  if (!MODO_FALSO) {
    const dados = await apiFetch('/anamneses')
    return dados.anamneses.map(normalizarAnamnese)
  }

  const pacientes = await listarPacientes()

  return anamneses
    .map((a) => {
      const paciente = pacientes.find((p) => p.id === a.pacienteId)
      return paciente ? { ...a, paciente } : null
    })
    .filter(Boolean)
    .sort((a, b) => b.criadaEm.localeCompare(a.criadaEm))
}

export async function anamnesesDoPaciente(pacienteId) {
  exigirServidor()
  if (!MODO_FALSO) {
    const dados = await apiFetch(`/anamneses/paciente/${pacienteId}`)
    return dados.anamneses.map(normalizarAnamnese)
  }

  return eco(
    anamneses
      .filter((a) => a.pacienteId === pacienteId)
      .sort((a, b) => b.criadaEm.localeCompare(a.criadaEm)),
  )
}

/**
 * Cria uma anamnese pendente para um paciente que já existe. É o que
 * "atualizar" faz: manda um link novo, sem apagar o que já foi respondido.
 */
export async function criarAnamnese(pacienteId, criadaPor = null) {
  exigirServidor()
  if (!MODO_FALSO) {
    const dados = await apiFetch('/anamneses', {
      method: 'POST',
      body: { pacienteId },
    })
    return normalizarAnamnese(dados.anamnese)
  }

  const nova = {
    id: `a${Date.now()}`,
    pacienteId,
    status: 'pendente',
    criadaEm: hoje(),
    respondidaEm: null,
    // Quem gerou o link fica registrado: é o que faz a lista servir de
    // controle em vez de só de inventário.
    criadaPor,
    token: novoToken(),
  }
  anamneses = [...anamneses, nova]
  return eco(nova)
}

/**
 * Busca pelo token, para a página pública.
 *
 * Não exige sessão — é o paciente que abre, sem login. Por isso devolve só o
 * necessário para o formulário: quem é e o que responder. Nada de id de
 * paciente ou histórico, que sairiam do painel sem precisar.
 *
 * A situação vem junto para a página saber o que mostrar: formulário, aviso de
 * link vencido ou aviso de já respondida.
 */
export async function buscarPorToken(token) {
  exigirServidor()
  if (!MODO_FALSO) {
    const dados = await apiFetch(`/anamneses/publica/${token}`, {
      auth: false,
    })
    const anamnese = normalizarAnamnese(dados.anamnese)

    return {
      token,
      situacao: anamnese.situacao,
      nome: anamnese.nome ?? nomeCompleto(anamnese.paciente),
      respostas: anamnese.respostas ?? null,
    }
  }

  const anamnese = anamneses.find((a) => a.token === token)
  if (!anamnese) return null

  const pacientes = await listarPacientes()
  const paciente = pacientes.find((p) => p.id === anamnese.pacienteId)
  if (!paciente) return null

  return eco({
    token: anamnese.token,
    situacao: situacaoDa(anamnese),
    nome: nomeCompleto(paciente),
    respostas: anamnese.respostas ?? null,
  })
}

/**
 * Registra as respostas e fecha a anamnese.
 *
 * Recusa link vencido ou já respondido no próprio dado, não só na tela: a
 * página é pública e o token vai por WhatsApp, então a checagem tem que estar
 * onde ninguém contorna abrindo o console.
 */
export async function responderAnamnese(token, respostas) {
  exigirServidor()
  if (!MODO_FALSO) {
    const dados = await apiFetch(`/anamneses/publica/${token}/respostas`, {
      method: 'POST',
      auth: false,
      body: { respostas },
    })
    return normalizarAnamnese(dados.anamnese)
  }

  const anamnese = anamneses.find((a) => a.token === token)
  if (!anamnese) throw new AuthError('Este link não existe.')

  const situacao = situacaoDa(anamnese)
  if (situacao === 'preenchida') throw new AuthError('Esta anamnese já foi respondida.')
  if (situacao === 'expirada') throw new AuthError('Este link expirou. Peça um novo à clínica.')

  const nomeDaFicha = nomeDaResposta(respostas)
  if (nomeDaFicha) await atualizarPaciente(anamnese.pacienteId, nomeDaFicha)

  anamneses = anamneses.map((a) =>
    a.token === token ? { ...a, status: 'preenchida', respondidaEm: hoje(), respostas } : a,
  )
  return eco(anamneses.find((a) => a.token === token))
}

export async function excluirAnamnese(id) {
  exigirServidor()
  if (!MODO_FALSO) {
    await apiFetch(`/anamneses/${id}`, { method: 'DELETE' })
    return
  }

  anamneses = anamneses.filter((a) => a.id !== id)
}

/**
 * O endereço que o paciente abre.
 *
 * Monta a partir do `origin` para o link funcionar em desenvolvimento, em
 * pré-visualização e em produção sem ninguém trocar constante.
 */
export function linkDaAnamnese(token) {
  const base = typeof window === 'undefined' ? '' : window.location.origin
  return `${base}/anamnese/${token}`
}

/* ------------------------------------------------------------------ */
/* Situação                                                            */
/* ------------------------------------------------------------------ */

/**
 * A situação real, com a expiração aplicada.
 *
 * `status` guarda só o que aconteceu — pendente ou preenchida. Expirada é
 * consequência do tempo, então é calculada na leitura e não gravada: gravar
 * exigiria alguém varrendo o banco todo dia para virar o campo, e enquanto
 * ninguém varresse a tela mentiria.
 */
export function situacaoDa(anamnese, referencia = hoje()) {
  if (anamnese.status === 'preenchida') return 'preenchida'
  return diasEntre(anamnese.criadaEm, referencia) > DIAS_PARA_EXPIRAR ? 'expirada' : 'pendente'
}

/**
 * A anamnese que vale como ficha do paciente: a última respondida.
 *
 * Pendente e expirada ficam de fora de propósito. Link em espera não é
 * informação sobre a pessoa, é estado de um envio — e envio é assunto do
 * histórico, não da ficha que o dentista abre antes de atender.
 *
 * Devolve `null` quando não há nenhuma respondida, mesmo que existam envios.
 */
export function ultimaPreenchida(anamneses) {
  return (
    anamneses
      .filter((a) => situacaoDa(a) === 'preenchida')
      .sort((a, b) => dataDaResposta(b).localeCompare(dataDaResposta(a)))[0] ?? null
  )
}

function dataDaResposta(anamnese) {
  return anamnese.respondidaEm ?? anamnese.criadaEm
}

/**
 * A cor de cada situação mora aqui, junto do resto que a descreve.
 *
 * É a mesma da etiqueta na linha: a pilha de filtros e a coluna de situação
 * passam a se referenciar sem legenda — clicar no chip vermelho e ver linhas
 * vermelhas confirma que o filtro fez o que a pessoa esperava.
 */
export const SITUACOES = [
  { id: 'todas', rotulo: 'Todas', cor: 'navy' },
  { id: 'pendente', rotulo: 'Em espera', cor: 'amber' },
  { id: 'expirada', rotulo: 'Expirados', cor: 'red' },
  { id: 'preenchida', rotulo: 'Concluídos', cor: 'mint' },
]

const ROTULOS = {
  pendente: 'Em espera',
  expirada: 'Expirado',
  preenchida: 'Concluído',
}

export function rotuloDaSituacao(situacao) {
  return ROTULOS[situacao] ?? situacao
}

/** Quantos dias faltam para o link cair. Negativo quando já caiu. */
export function diasRestantes(anamnese, referencia = hoje()) {
  return DIAS_PARA_EXPIRAR - diasEntre(anamnese.criadaEm, referencia)
}

/** Datas em ISO, comparadas em UTC: sem fuso no meio, o número é exato. */
function diasEntre(de, ate) {
  const um = Date.UTC(
    ...de.slice(0, 10)
      .split('-')
      .map(Number)
      .map((n, i) => (i === 1 ? n - 1 : n)),
  )
  const outro = Date.UTC(
    ...ate.slice(0, 10)
      .split('-')
      .map(Number)
      .map((n, i) => (i === 1 ? n - 1 : n)),
  )
  return Math.round((outro - um) / 86400000)
}

function normalizarAnamnese(anamnese) {
  const situacao = normalizarSituacao(anamnese.situacao)

  return {
    ...anamnese,
    status: anamnese.status === 'concluida' ? 'preenchida' : anamnese.status,
    situacao,
  }
}

function normalizarSituacao(situacao) {
  if (situacao === 'em_espera') return 'pendente'
  if (situacao === 'concluida') return 'preenchida'
  return situacao
}

function nomeDaResposta(respostas) {
  const completo = respostas
    .find((resposta) => resposta.id === 'nome')
    ?.resposta.replace(/\s+/g, ' ')
    .trim()

  if (!completo) return null

  const [nome, ...partesDoSobrenome] = completo.split(' ')
  const sobrenome = partesDoSobrenome.join(' ').trim()

  if (!nome || !sobrenome) return null
  return { nome, sobrenome }
}
