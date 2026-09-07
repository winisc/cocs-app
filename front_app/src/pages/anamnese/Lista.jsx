import { useCallback, useEffect, useRef, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import {
  SITUACOES,
  diasRestantes,
  excluirAnamnese,
  listarAnamneses,
  rotuloDaSituacao,
  situacaoDa,
} from '../../lib/anamneses'
import { formatarData, nomeCompleto } from '../../lib/pacientes'
import { combina } from '../../lib/busca'
import CampoDeBusca from '../../components/painel/CampoDeBusca'
import Tabela, { Acoes, Celula, Pessoa } from '../../components/painel/Tabela'
import BotaoIcone, { IconeAnamnese, IconeExcluir } from '../../components/painel/BotaoIcone'
import Botao from '../../components/painel/Botao'
import Dialogo, { AcoesDoDialogo, useUltimo } from '../../components/painel/Dialogo'
import DialogoNova from './DialogoNova'
import { Aviso, Vazio } from '../usuarios/Secao'
import { pode } from '../../lib/permissoes'
import { useSession } from '../../lib/session'

const INTERVALO_ATUALIZACAO_MS = 5000

/**
 * Histórico de controle das anamneses.
 *
 * A lista não é um inventário de pacientes: é o registro do que foi enviado,
 * por quem, quando, e o que ainda não voltou. Por isso cada anamnese é uma
 * linha — a mesma pessoa aparece uma vez por envio — e a ordem é sempre a
 * cronológica.
 */
export default function ListaDeAnamneses() {
  const navegar = useNavigate()
  const { usuario } = useSession()
  const podeCriarAnamnese = pode(usuario, 'criarAnamnese')
  const podeExcluirAnamnese = pode(usuario, 'excluirAnamnese')

  const [params, setParams] = useSearchParams()
  const busca = params.get('q') ?? ''
  const situacao = params.get('situacao') ?? 'todas'

  const trocar = (chave, valor, vazio) => {
    const proximo = new URLSearchParams(params)
    if (valor && valor !== vazio) proximo.set(chave, valor)
    else proximo.delete(chave)
    setParams(proximo, { replace: true })
  }

  const [anamneses, setAnamneses] = useState([])
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState(null)
  const [criandoNova, setCriandoNova] = useState(false)
  const [excluindo, setExcluindo] = useState(null)
  const situacoesConhecidas = useRef(new Map())
  const temporizadorDeRealce = useRef(null)
  const [realcadas, setRealcadas] = useState(() => new Set())

  const recarregar = useCallback(async ({ silencioso = false } = {}) => {
    try {
      const proximas = await listarAnamneses()
      const mudaram = idsComSituacaoAlterada(situacoesConhecidas.current, proximas, silencioso)

      setAnamneses(proximas)
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
  }, [])

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

  if (carregando) return <Esqueleto />
  if (erro) return <Aviso>{erro}</Aviso>

  const comSituacao = anamneses.map((a) => ({ ...a, situacao: situacaoDa(a) }))
  const encontradas = comSituacao.filter(
    (a) =>
      combina(busca, nomeCompleto(a.paciente)) && (situacao === 'todas' || a.situacao === situacao),
  )

  return (
    <>
      {/* Duas faixas. Na mesma linha, os quatro chips disputavam espaço com a
          busca e com o botão principal, e os três blocos escuros brigavam
          entre si. Separados, cada faixa tem um trabalho. */}
      <div className="mb-3 flex flex-wrap items-center gap-3">
        {/* Largura cheia no celular: dividindo a linha com o botão, a busca
            encolhia a ponto de o próprio placeholder ficar cortado. */}
        <div className="w-full min-w-0 sm:w-auto sm:max-w-sm sm:flex-1">
          <CampoDeBusca
            valor={busca}
            aoMudar={(v) => trocar('q', v, '')}
            rotulo="Buscar anamnese"
            placeholder="Buscar por paciente"
          />
        </div>

        {podeCriarAnamnese && (
          <Botao variante="primario" onClick={() => setCriandoNova(true)}>
            Nova anamnese
          </Botao>
        )}
      </div>

      <div className="mb-5">
        <Filtro
          atual={situacao}
          aoMudar={(v) => trocar('situacao', v, 'todas')}
          contar={(id) => comSituacao.filter((a) => id === 'todas' || a.situacao === id).length}
        />
      </div>

      {encontradas.length === 0 && (
        <Vazio>{mensagemVazia({ busca, situacao, podeCriarAnamnese })}</Vazio>
      )}

      {encontradas.length > 0 && (
        <Tabela
          colunas={[
            { rotulo: 'Paciente' },
            { rotulo: 'Situação', largura: 'w-56', some: true },
            { rotulo: 'Enviada por', largura: 'w-44', some: true },
            { rotulo: 'Ações', largura: podeExcluirAnamnese ? 'w-28' : 'w-[5.75rem]', direita: true },
          ]}
        >
          {encontradas.map((a) => (
            <tr
              key={a.id}
              className={`transition-colors hover:bg-navy-50/50 ${
                realcadas.has(a.id) ? 'anamnese-atualizada' : ''
              }`}
            >
              <Celula>
                <Pessoa
                  nome={nomeCompleto(a.paciente)}
                  abaixo={<Situacao anamnese={a} />}
                />
              </Celula>

              <Celula some>
                <Situacao anamnese={a} />
              </Celula>

              <Celula some className="text-sm text-navy-500">
                {a.criadaPor ?? <span className="text-navy-300">—</span>}
              </Celula>

              <Celula direita>
                <Acoes>
                  <BotaoIcone
                    rotulo={`Abrir anamneses de ${nomeCompleto(a.paciente)}`}
                    onClick={() => navegar(`/dashboard/anamnese/${a.paciente.id}`)}
                  >
                    <IconeAnamnese />
                  </BotaoIcone>
                  {podeExcluirAnamnese && (
                    <BotaoIcone
                      variante="perigo"
                      rotulo={`Excluir anamnese de ${nomeCompleto(a.paciente)}`}
                      onClick={() => setExcluindo(a)}
                    >
                      <IconeExcluir />
                    </BotaoIcone>
                  )}
                </Acoes>
              </Celula>
            </tr>
          ))}
        </Tabela>
      )}

      {podeCriarAnamnese && (
        <DialogoNova
          aberto={criandoNova}
          aoFechar={() => setCriandoNova(false)}
          aoCriar={recarregar}
        />
      )}

      {podeExcluirAnamnese && (
        <DialogoDeExclusao
          anamnese={excluindo}
          aoFechar={() => setExcluindo(null)}
          aoExcluir={recarregar}
        />
      )}
    </>
  )
}

/**
 * Filtro por situação.
 *
 * Chips soltos, não um bloco segmentado sólido: o segmentado escuro tinha o
 * mesmo peso do botão de ação e os dois brigavam pela atenção. Filtro é
 * navegação, não ação.
 *
 * Cada chip ativo usa a cor da própria situação — a mesma da etiqueta nas
 * linhas. Escolher "Expirados" e ver a lista ficar vermelha confirma o filtro
 * sem precisar reler o rótulo.
 *
 * A contagem fica em cada chip porque ela é metade do valor da tela: dá para
 * ver quantos links estão parados sem trocar de filtro.
 */
function DialogoDeExclusao({ anamnese, aoFechar, aoExcluir }) {
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
      descricao={`Esta anamnese de ${nomeCompleto(atual.paciente)} será removida do histórico.`}
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

const CORES = {
  navy: { ativo: 'border-navy-800 bg-navy-800 text-white', pilula: 'bg-white/20 text-white' },
  amber: {
    ativo: 'border-amber-300 bg-amber-100 text-amber-900',
    pilula: 'bg-amber-200/70 text-amber-900',
  },
  red: {
    ativo: 'border-red-300 bg-red-100 text-red-900',
    pilula: 'bg-red-200/70 text-red-900',
  },
  mint: {
    ativo: 'border-mint-300 bg-mint-100 text-mint-900',
    pilula: 'bg-mint-200/70 text-mint-900',
  },
}

function Filtro({ atual, aoMudar, contar }) {
  return (
    <div
      role="group"
      aria-label="Filtrar por situação"
      className="flex flex-wrap items-center gap-2"
    >
      {SITUACOES.map((s) => {
        const ativo = s.id === atual
        const cor = CORES[s.cor]
        const quantidade = contar(s.id)

        return (
          <button
            key={s.id}
            type="button"
            onClick={() => aoMudar(s.id)}
            aria-pressed={ativo}
            className={`flex cursor-pointer items-center gap-2 rounded-full border py-1.5 pr-2 pl-3.5 font-display text-xs font-medium transition-colors ${
              ativo
                ? cor.ativo
                : 'border-navy-200 bg-white text-navy-500 hover:border-navy-300 hover:text-navy-800'
            }`}
          >
            {s.rotulo}
            <span
              className={`inline-flex min-w-5 justify-center rounded-full px-1.5 py-0.5 text-[11px] font-semibold ${
                ativo ? cor.pilula : 'bg-navy-100 text-navy-500'
              }`}
            >
              {quantidade}
            </span>
          </button>
        )
      })}
    </div>
  )
}

function mensagemVazia({ busca, situacao, podeCriarAnamnese }) {
  if (busca) return 'Nenhuma anamnese encontrada para essa busca.'

  const mensagens = {
    pendente: 'Nenhuma anamnese em espera.',
    expirada: 'Nenhuma anamnese expirada.',
    preenchida: 'Nenhuma anamnese concluída.',
  }

  return (
    mensagens[situacao] ??
    (podeCriarAnamnese
      ? 'Nenhuma anamnese ainda. Comece por "Nova anamnese".'
      : 'Nenhuma anamnese cadastrada.')
  )
}

/**
 * Situação e data juntas: "preenchida" sem a data não diz se o dado é de
 * ontem ou do ano passado, e ficha de saúde envelhece. No que está pendente,
 * o que importa é quanto tempo o link ainda tem.
 */
export function Situacao({ anamnese }) {
  const situacao = anamnese.situacao ?? situacaoDa(anamnese)

  const cor = {
    pendente: 'bg-amber-100 text-amber-900',
    expirada: 'bg-red-100 text-red-900',
    preenchida: 'bg-mint-100 text-mint-800',
  }[situacao]

  // Em cadeia de `if`, não em objeto indexado: objeto literal avalia os três
  // ramos antes de escolher um, e `respondidaEm` é null enquanto a anamnese
  // está pendente — a formatação quebrava a tela inteira.
  const dias = diasRestantes(anamnese)
  let detalhe
  if (situacao === 'pendente') {
    detalhe = dias === 0 ? 'expira hoje' : `expira em ${dias} ${dias === 1 ? 'dia' : 'dias'}`
  } else if (situacao === 'expirada') {
    detalhe = `enviada em ${formatarData(anamnese.criadaEm)}`
  } else {
    detalhe = `em ${formatarData(anamnese.respondidaEm)}`
  }

  return (
    <span className="flex flex-wrap items-center gap-x-2 gap-y-1">
      <span className={`rounded-full px-2.5 py-1 text-xs font-medium whitespace-nowrap ${cor}`}>
        {rotuloDaSituacao(situacao)}
      </span>
      <span className="text-xs whitespace-nowrap text-navy-400">{detalhe}</span>
    </span>
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

function Esqueleto() {
  return (
    <div role="status" aria-label="Carregando" className="space-y-3">
      {[0, 1, 2].map((i) => (
        <div key={i} className="h-14 animate-pulse rounded-xl bg-white" />
      ))}
    </div>
  )
}
