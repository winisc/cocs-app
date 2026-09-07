import { useCallback, useEffect, useRef, useState } from 'react'
import { CheckCircleIcon, ExclamationTriangleIcon } from '@heroicons/react/24/solid'
import { useParams } from 'react-router-dom'
import {
  DIAS_PARA_EXPIRAR,
  anamnesesDoPaciente,
  criarAnamnese,
  diasRestantes,
  excluirAnamnese,
  rotuloDaSituacao,
  situacaoDa,
} from '../../lib/anamneses'
import { buscarPaciente, formatarData, nomeCompleto } from '../../lib/pacientes'
import Botao from '../../components/painel/Botao'
import Dialogo, { AcoesDoDialogo, useUltimo } from '../../components/painel/Dialogo'
import { useSession } from '../../lib/session'
import { pode } from '../../lib/permissoes'
import { AindaVazio } from '../../components/Painel'
import ConviteDaAnamnese from '../../components/painel/ConviteDaAnamnese'
import RespostasDaAnamnese from '../../components/painel/RespostasDaAnamnese'
import DialogoDeNovaAnamnese from '../../components/painel/DialogoDeNovaAnamnese'
import Voltar from '../../components/painel/Voltar'
import BotaoIcone, { IconeExcluir } from '../../components/painel/BotaoIcone'
import { Aviso } from '../usuarios/Secao'
import { Situacao } from './Lista'

const INTERVALO_ATUALIZACAO_MS = 5000

/**
 * Anamneses de um paciente.
 *
 * A lista é o histórico. "Atualizar" não reabre a resposta antiga — cria uma
 * anamnese nova, com link próprio, e a anterior fica onde está. Numa ficha de
 * saúde o que mudou importa tanto quanto o estado de agora.
 */
export default function AnamneseDoPaciente() {
  const { pacienteId } = useParams()
  const { usuario } = useSession()

  const [paciente, setPaciente] = useState(null)
  const [anamneses, setAnamneses] = useState([])
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState(null)
  const [confirmando, setConfirmando] = useState(false)
  const [aviso, setAviso] = useState(null)
  const [excluindoAnamnese, setExcluindoAnamnese] = useState(null)
  const situacoesConhecidas = useRef(new Map())
  const temporizadorDeRealce = useRef(null)
  const [realcadas, setRealcadas] = useState(() => new Set())

  const recarregar = useCallback(async ({ silencioso = false } = {}) => {
    try {
      const [p, lista] = await Promise.all([
        buscarPaciente(pacienteId),
        anamnesesDoPaciente(pacienteId),
      ])
      const mudaram = idsComSituacaoAlterada(situacoesConhecidas.current, lista, silencioso)

      setPaciente(p)
      setAnamneses(lista)
      if (mudaram.length) {
        clearTimeout(temporizadorDeRealce.current)
        setRealcadas(new Set(mudaram))
        temporizadorDeRealce.current = setTimeout(() => setRealcadas(new Set()), 1800)
      }
      setErro(null)
    } catch (e) {
      if (!silencioso) setErro(e.message)
    } finally {
      if (!silencioso) setCarregando(false)
    }
  }, [pacienteId])

  useEffect(() => {
    recarregar()
  }, [recarregar])

  useEffect(() => () => clearTimeout(temporizadorDeRealce.current), [])

  const temAnamneseEmEspera = anamneses.some((a) => situacaoDa(a) === 'pendente')

  useEffect(() => {
    if (!temAnamneseEmEspera) return undefined

    let recarregando = false
    const timer = setInterval(async () => {
      if (document.visibilityState === 'hidden' || recarregando) return

      recarregando = true
      try {
        await recarregar({ silencioso: true })
      } finally {
        recarregando = false
      }
    }, INTERVALO_ATUALIZACAO_MS)

    return () => clearInterval(timer)
  }, [recarregar, temAnamneseEmEspera])

  if (carregando) return <div role="status" aria-label="Carregando" className="h-24" />
  if (erro) return <Aviso>{erro}</Aviso>
  if (!paciente) {
    return (
      <>
        <Aviso>Paciente não encontrado. A ficha pode ter sido excluída.</Aviso>
        <div className="mt-4">
          <Voltar para="/dashboard/anamnese" />
        </div>
      </>
    )
  }

  // Só bloqueia por pendente que ainda vale. Link expirado não protege de
  // nada, e deixar o botão travado obrigaria a recepção a esperar sem saber o
  // quê.
  const pendente = anamneses.some((a) => situacaoDa(a) === 'pendente')
  const nomeDoPaciente = nomeCompleto(paciente)
  const podeCriarAnamnese = pode(usuario, 'criarAnamnese')
  const podeExcluirAnamnese = pode(usuario, 'excluirAnamnese')
  const criarPeloExpirado = (expirada) => {
    if (!podeCriarAnamnese) return

    const existente = anamneseMaisAtual(anamneses, expirada)
    if (existente) {
      setAviso({ anamnese: existente, tipo: situacaoDa(existente) })
      return
    }

    setConfirmando(true)
  }

  return (
    <>
      <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="font-display text-lg font-semibold text-navy-900">{nomeDoPaciente}</h2>
        </div>

        <div className="flex flex-wrap gap-2">
          <Voltar para="/dashboard/anamnese" />
          {podeCriarAnamnese && (
            <Botao
              variante="primario"
              disabled={pendente}
              // O envio fica travado enquanto existir link ativo para a pessoa.
              title={pendente ? 'Já existe uma anamnese em espera' : undefined}
              onClick={() => setConfirmando(true)}
            >
              Atualizar anamnese
            </Botao>
          )}
        </div>
      </div>

      {anamneses.length === 0 ? (
        <AindaVazio>
          {podeCriarAnamnese
            ? 'Este paciente ainda não tem anamnese. Use “Atualizar anamnese” para enviar a primeira.'
            : 'Este paciente ainda não tem anamnese cadastrada.'}
        </AindaVazio>
      ) : (
        <ul className="space-y-4">
          {anamneses.map((a) => (
            <AnamneseDetalhada
              key={a.id}
              anamnese={a}
              paciente={paciente}
              podeCriarAnamnese={podeCriarAnamnese}
              podeExcluirAnamnese={podeExcluirAnamnese}
              aoCriarNova={() => criarPeloExpirado(a)}
              aoExcluir={() => setExcluindoAnamnese(a)}
              atualizada={realcadas.has(a.id)}
            />
          ))}
        </ul>
      )}

      {podeCriarAnamnese && (
        <DialogoDeNovaAnamnese
          aberto={confirmando}
          paciente={paciente}
          autor={usuario.nome}
          aoFechar={() => setConfirmando(false)}
          aoCriar={recarregar}
        />
      )}

      <DialogoDeHistorico aviso={aviso} paciente={paciente} aoFechar={() => setAviso(null)} />
      <DialogoDeExclusao
        anamnese={excluindoAnamnese}
        paciente={paciente}
        aoFechar={() => setExcluindoAnamnese(null)}
        aoExcluir={recarregar}
      />
    </>
  )
}

function AnamneseDetalhada({
  anamnese,
  paciente,
  podeCriarAnamnese,
  podeExcluirAnamnese,
  aoCriarNova,
  aoExcluir,
  atualizada,
}) {
  const situacao = situacaoDa(anamnese)

  const acoes = podeExcluirAnamnese ? (
    <BotaoIcone variante="perigo" rotulo="Excluir anamnese" onClick={aoExcluir}>
      <IconeExcluir />
    </BotaoIcone>
  ) : null

  if (situacao === 'pendente') {
    return (
      <AnamneseEmEspera
        anamnese={anamnese}
        paciente={paciente}
        atualizada={atualizada}
        acoes={acoes}
        mostrarConvite={podeCriarAnamnese}
      />
    )
  }

  if (situacao === 'expirada') {
    return (
      <AnamneseExpirada
        anamnese={anamnese}
        podeCriarAnamnese={podeCriarAnamnese}
        aoCriarNova={aoCriarNova}
        atualizada={atualizada}
        acoes={acoes}
      />
    )
  }

  return <AnamneseConcluida anamnese={anamnese} atualizada={atualizada} acoes={acoes} />
}

function anamneseMaisAtual(anamneses, expirada) {
  return anamneses
    .filter((a) => {
      if (a.id === expirada.id) return false

      const situacao = situacaoDa(a)
      if (situacao !== 'pendente' && situacao !== 'preenchida') return false

      return dataDeReferencia(a) >= expirada.criadaEm
    })
    .sort((a, b) => dataDeReferencia(b).localeCompare(dataDeReferencia(a)))[0]
}

function dataDeReferencia(anamnese) {
  return anamnese.respondidaEm ?? anamnese.criadaEm
}

function AnamneseEmEspera({ anamnese, paciente, atualizada, acoes, mostrarConvite }) {
  const dias = diasRestantes(anamnese)
  const podeMostrarConvite = mostrarConvite && Boolean(anamnese.token)

  return (
    <CardDaAnamnese anamnese={anamnese} atualizada={atualizada} acoes={acoes}>
      <div
        className={`mt-4 grid gap-5 lg:items-start ${
          podeMostrarConvite ? 'lg:grid-cols-[minmax(0,1fr)_20rem]' : ''
        }`}
      >
        <div>
          <h3 className="font-display text-sm font-semibold text-navy-900">Link em espera</h3>
          <p className="mt-1 max-w-xl text-sm leading-relaxed text-navy-500">
            O paciente ainda pode responder por este link. Use o QR Code na recepção ou copie o
            endereço para enviar pelo canal combinado.
          </p>

          <Dl className="mt-4">
            <Meta rotulo="Enviada em" valor={formatarData(anamnese.criadaEm)} />
            <Meta rotulo="Validade até" valor={formatarData(dataLimite(anamnese.criadaEm))} />
            <Meta rotulo="Criada por" valor={anamnese.criadaPor ?? 'Equipe COCS'} />
          </Dl>

          <p className="mt-4 rounded-lg border border-amber-200 bg-amber-50 px-3.5 py-3 text-sm leading-relaxed text-amber-900">
            {dias === 0
              ? 'Este link expira hoje.'
              : `Este link expira em ${dias} ${dias === 1 ? 'dia' : 'dias'}.`}
          </p>
        </div>

        {podeMostrarConvite && (
          <div className="lg:border-l lg:border-navy-100 lg:pl-5">
            <ConviteDaAnamnese token={anamnese.token} nome={primeiroNome(nomeCompleto(paciente))} />
          </div>
        )}
      </div>
    </CardDaAnamnese>
  )
}

function AnamneseExpirada({ anamnese, podeCriarAnamnese, aoCriarNova, atualizada, acoes }) {
  const dias = Math.abs(diasRestantes(anamnese))

  return (
    <CardDaAnamnese anamnese={anamnese} atualizada={atualizada} acoes={acoes}>
      <div className="mt-4">
        <h3 className="font-display text-sm font-semibold text-navy-900">Expiração do link</h3>
        <p className="mt-1 max-w-2xl text-sm leading-relaxed text-navy-500">
          {podeCriarAnamnese
            ? 'Este link saiu da validade antes de receber respostas. Para enviar novamente, gere um novo link.'
            : 'Este link saiu da validade antes de receber respostas.'}
        </p>

        <Dl className="mt-4">
          <Meta rotulo="Enviada em" valor={formatarData(anamnese.criadaEm)} />
          <Meta rotulo="Valia até" valor={formatarData(dataLimite(anamnese.criadaEm))} />
          <Meta rotulo="Criada por" valor={anamnese.criadaPor ?? 'Equipe COCS'} />
        </Dl>

        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-red-200 bg-red-50 px-3.5 py-3">
          <p className="text-sm leading-relaxed text-red-900">
            Expirado há {dias} {dias === 1 ? 'dia' : 'dias'}. O QR Code e o link antigo não devem
            ser enviados.
          </p>
          {podeCriarAnamnese && (
            <Botao variante="primario" onClick={aoCriarNova}>
              Criar novo link
            </Botao>
          )}
        </div>
      </div>
    </CardDaAnamnese>
  )
}

function AnamneseConcluida({ anamnese, atualizada, acoes }) {
  return (
    <CardDaAnamnese anamnese={anamnese} atualizada={atualizada} acoes={acoes}>
      <RespostasDaAnamnese anamnese={anamnese} className="mt-4" />
    </CardDaAnamnese>
  )
}

function CardDaAnamnese({ anamnese, atualizada = false, acoes = null, children }) {
  const situacao = situacaoDa(anamnese)

  return (
    <li
      className={`rounded-xl border border-navy-100 bg-white p-4 shadow-sm ${
        atualizada ? 'anamnese-atualizada' : ''
      }`}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <Situacao anamnese={anamnese} />
        <div className="flex items-center gap-2">
          <p className="text-xs text-navy-400">
            Enviada por {anamnese.criadaPor ?? 'Equipe COCS'}
          </p>
          {acoes}
        </div>
      </div>
      <div key={`${anamnese.id}-${situacao}`} className={atualizada ? 'anamnese-conteudo-entrada' : ''}>
        {children}
      </div>
    </li>
  )
}

function Dl({ className = '', children }) {
  return <dl className={`grid gap-3 sm:grid-cols-3 ${className}`}>{children}</dl>
}

function Meta({ rotulo, valor }) {
  return (
    <div>
      <dt className="text-xs font-medium text-navy-400">{rotulo}</dt>
      <dd className="mt-1 text-sm font-semibold text-navy-800">{valor}</dd>
    </div>
  )
}

function dataLimite(iso) {
  const [ano, mes, dia] = iso.slice(0, 10).split('-').map(Number)
  const data = new Date(Date.UTC(ano, mes - 1, dia))
  data.setUTCDate(data.getUTCDate() + DIAS_PARA_EXPIRAR)
  return data.toISOString().slice(0, 10)
}

function DialogoDeExclusao({ anamnese, paciente, aoFechar, aoExcluir }) {
  const atual = useUltimo(anamnese)
  const [excluindo, setExcluindo] = useState(false)
  const [erro, setErro] = useState(null)

  if (!atual) return null

  async function confirmar() {
    setExcluindo(true)
    setErro(null)
    try {
      await excluirAnamnese(atual.id)
      await aoExcluir()
      aoFechar()
    } catch (e) {
      setErro(e.message)
    } finally {
      setExcluindo(false)
    }
  }

  return (
    <Dialogo
      aberto={!!anamnese}
      aoFechar={aoFechar}
      titulo="Excluir anamnese"
      descricao={`Esta anamnese de ${nomeCompleto(paciente)} será removida do histórico.`}
    >
      <div className="rounded-lg border border-red-200 bg-red-50 px-3.5 py-3 text-sm leading-relaxed text-red-900">
        <p className="font-medium">{rotuloDaSituacao(situacaoDa(atual))}</p>
        <p className="mt-1">Criada em {formatarData(atual.criadaEm)}.</p>
      </div>

      {erro && (
        <p role="alert" className="mt-3 rounded-lg bg-red-50 px-3.5 py-3 text-sm text-red-800">
          {erro}
        </p>
      )}

      <AcoesDoDialogo>
        <Botao onClick={aoFechar} disabled={excluindo}>
          Cancelar
        </Botao>
        <Botao variante="perigo" onClick={confirmar} disabled={excluindo}>
          {excluindo ? 'Excluindo...' : 'Excluir'}
        </Botao>
      </AcoesDoDialogo>
    </Dialogo>
  )
}

function DialogoDeHistorico({ aviso, paciente, aoFechar }) {
  if (!aviso) return null

  const { anamnese, tipo } = aviso
  const emEspera = tipo === 'pendente'

  return (
    <Dialogo
      aberto={!!aviso}
      aoFechar={aoFechar}
      titulo={emEspera ? 'Já existe uma anamnese em espera' : 'Anamnese já concluída'}
      descricao={
        emEspera
          ? 'Este paciente já possui um link válido.'
          : 'A anamnese mais atual já foi respondida.'
      }
    >
      {emEspera ? (
        <div>
          <div className="flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 px-3.5 py-3 text-sm leading-relaxed text-amber-900">
            <ExclamationTriangleIcon
              aria-hidden="true"
              className="mt-0.5 h-5 w-5 shrink-0 text-amber-600"
            />
            <p>Use o link ativo desta anamnese em espera.</p>
          </div>

          <div className="mt-5">
            <ConviteDaAnamnese token={anamnese.token} nome={primeiroNome(nomeCompleto(paciente))} />
          </div>
        </div>
      ) : (
        <div>
          <div className="flex items-start gap-3 rounded-lg border border-mint-200 bg-mint-50 px-3.5 py-3 text-sm leading-relaxed text-mint-900">
            <CheckCircleIcon aria-hidden="true" className="mt-0.5 h-5 w-5 shrink-0 text-mint-600" />
            <p>
              A anamnese mais atual já foi concluída em {formatarData(anamnese.respondidaEm)}. Os
              dados estão disponíveis no histórico.
            </p>
          </div>

          <div className="mt-4 rounded-lg border border-navy-100 px-3.5 py-3">
            <Situacao anamnese={anamnese} />
          </div>
        </div>
      )}

      <AcoesDoDialogo>
        <Botao variante="primario" onClick={aoFechar}>
          Entendi
        </Botao>
      </AcoesDoDialogo>
    </Dialogo>
  )
}

function idsComSituacaoAlterada(conhecidas, anamneses, deveComparar) {
  const alteradas = []

  for (const anamnese of anamneses) {
    const situacao = situacaoDa(anamnese)
    const anterior = conhecidas.get(anamnese.id)

    if (deveComparar && anterior && anterior !== situacao) {
      alteradas.push(anamnese.id)
    }

    conhecidas.set(anamnese.id, situacao)
  }

  return alteradas
}

function primeiroNome(nome = '') {
  return nome.trim().split(/\s+/)[0]
}
