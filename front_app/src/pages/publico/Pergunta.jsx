import { useEffect, useId, useLayoutEffect, useRef, useState } from 'react'
import { grupoDe } from '../../content/anamnese'

const TEMPO_EXPANSAO_MS = 220
const LARGURA_MAXIMA_ROLAGEM_MOBILE = 639

/**
 * Desenha uma pergunta do questionário, seja qual for o tipo.
 *
 * A tela não sabe quais perguntas existem — só como desenhar cada formato.
 * Pergunta nova é uma entrada em content/anamnese.js, não um componente novo.
 */
export default function Pergunta({ pergunta, resposta, aoResponder, erro }) {
  const id = useId()
  const idErro = erro ? `${id}-erro` : undefined

  return (
    <fieldset>
      {/* `legend` e não `h1`: o enunciado nomeia o grupo de campos, e é isso
          que o leitor de tela repete ao entrar em cada opção. */}
      <legend className="font-display text-xl leading-snug font-semibold text-navy-900">
        {pergunta.rotulo}
        {pergunta.obrigatoria && <span className="ml-1 text-red-500">*</span>}
      </legend>

      {pergunta.ajuda && (
        <p className="mt-2 text-sm leading-relaxed text-navy-500">{pergunta.ajuda}</p>
      )}

      <div className="mt-5">
        {pergunta.tipo === 'texto' && (
          <Texto pergunta={pergunta} resposta={resposta} aoResponder={aoResponder} erro={idErro} />
        )}

        {pergunta.tipo === 'sim-nao' && (
          <SimNao pergunta={pergunta} resposta={resposta} aoResponder={aoResponder} erro={idErro} />
        )}

        {pergunta.tipo === 'escolha' && (
          <Escolha
            pergunta={pergunta}
            resposta={resposta}
            aoResponder={aoResponder}
            erro={idErro}
          />
        )}
      </div>

      {erro && (
        <p id={idErro} role="alert" className="mt-3 text-sm text-red-700">
          {erro}
        </p>
      )}
    </fieldset>
  )
}

function Texto({ pergunta, resposta, aoResponder, erro }) {
  return (
    <>
      {!pergunta.obrigatoria && <IndicadorOpcional />}
      <input
        type="text"
        value={resposta?.valor ?? ''}
        onChange={(e) => aoResponder({ valor: e.target.value })}
        placeholder={pergunta.placeholder}
        aria-label={pergunta.rotulo}
        aria-invalid={Boolean(erro) || undefined}
        aria-describedby={erro}
        autoComplete="off"
        className={`w-full rounded-lg border bg-white px-4 py-3 text-base/5 text-navy-900 transition-colors placeholder:text-navy-300 ${
          erro ? 'border-red-400' : 'border-navy-200 hover:border-navy-300'
        }`}
      />
    </>
  )
}

function SimNao({ pergunta, resposta, aoResponder, erro }) {
  const escolhida = pergunta.opcoes.find((o) => o.id === resposta?.valor)
  const abriu = Boolean(escolhida?.abre)

  return (
    <div>
      <div className="flex flex-col gap-2.5">
        {pergunta.opcoes.map((opcao) => (
          <Opcao
            key={opcao.id}
            nome={pergunta.id}
            marcada={resposta?.valor === opcao.id}
            erro={erro}
            aoMarcar={() =>
              // Trocar para a opção que não abre limpa o detalhe: guardar o
              // texto de um "sim" depois de marcar "não" mandaria resposta
              // contraditória para a clínica.
              aoResponder({ valor: opcao.id, detalhe: opcao.abre ? resposta?.detalhe : '' })
            }
          >
            {opcao.rotulo}
          </Opcao>
        ))}
      </div>

      {pergunta.detalhe && (
        <Detalhe
          aberto={abriu}
          rotulo={pergunta.detalhe.rotulo}
          placeholder={pergunta.detalhe.placeholder}
          obrigatoria={pergunta.detalhe.obrigatoria}
          valor={resposta?.detalhe ?? ''}
          aoMudar={(detalhe) => aoResponder({ detalhe })}
        />
      )}
    </div>
  )
}

/**
 * O campo que aparece ao marcar "sim".
 *
 * Recebe o foco ao abrir: quem marcou "sim" já quer escrever, e no celular
 * isso poupa um toque e sobe o teclado na hora.
 */
function Detalhe({ aberto, rotulo, placeholder, obrigatoria = true, valor, aoMudar }) {
  const campo = useRef(null)
  const id = useId()

  useEffect(() => {
    if (aberto) campo.current?.focus()
  }, [aberto])

  // Voltar para a pergunta traz o texto de volta sem passar por evento de
  // digitação: sem isto ele reabriria na altura de duas linhas, com o resto
  // escondido — justamente o que a área de texto veio resolver.
  useLayoutEffect(() => {
    if (aberto && campo.current) ajustarAltura(campo.current)
  }, [aberto, valor])

  return (
    <Expansivel aberto={aberto}>
      <div className="mt-3 rounded-xl border border-mint-200 bg-mint-50/60 p-3.5">
        <label htmlFor={id} className="block font-display text-sm font-medium text-navy-700">
          {rotulo}
        </label>
        {!obrigatoria && <IndicadorOpcional compacto />}
        {/* `textarea` e não `input`: aqui a pessoa conta uma coisa, e numa
            linha só o começo do que ela escreveu some para a esquerda. Sem
            poder reler, ninguém revisa antes de enviar.

            O limite de 400 existe porque o servidor recusa resposta acima de
            800 caracteres, e a resposta gravada é o rótulo mais este texto —
            barrar aqui é melhor que perder tudo no envio. */}
        <textarea
          ref={campo}
          id={id}
          rows={2}
          maxLength={400}
          value={valor}
          onChange={(e) => aoMudar(e.target.value)}
          onInput={crescerComOTexto}
          placeholder={placeholder}
          className="mt-1.5 block w-full resize-none rounded-lg border border-navy-200 bg-white px-3.5 py-3 text-base/5 text-navy-900 placeholder:text-navy-300"
        />
      </div>
    </Expansivel>
  )
}

/**
 * Cresce conforme se escreve, em vez de rolar por dentro.
 *
 * Zerar a altura antes de medir é o que permite encolher de volta: sem isso
 * `scrollHeight` nunca diminui, e o campo só engorda.
 */
function crescerComOTexto(evento) {
  ajustarAltura(evento.target)
}

function ajustarAltura(campo) {
  campo.style.height = 'auto'
  // `scrollHeight` não conta a borda, mas `height` conta: `box-sizing` aqui é
  // `border-box`. Sem somar a diferença sobram dois pixels de rolagem por
  // dentro, e a última linha fica sempre meio cortada.
  const borda = campo.offsetHeight - campo.clientHeight
  campo.style.height = `${campo.scrollHeight + borda}px`
}

function IndicadorOpcional({ compacto = false }) {
  return (
    <p className={`${compacto ? 'mt-1' : 'mb-2'} font-display text-xs font-medium text-navy-400`}>
      (opcional)
    </p>
  )
}

/**
 * Um bloco que cresce e encolhe no lugar.
 *
 * Fica montado mesmo fechado, senão não haveria o que animar na saída — e
 * `inert` é o que impede o teclado de entrar num campo que ninguém está vendo.
 * Mede o conteúdo real para animar altura sem cortar bordas nem depender do
 * truque de grid, que falha na primeira abertura depois de uma opção sem lista.
 */
function Expansivel({ aberto, children }) {
  const conteudo = useRef(null)
  const [altura, setAltura] = useState(aberto ? 'auto' : '0px')
  const [estado, setEstado] = useState(aberto ? 'aberto' : 'fechado')

  useLayoutEffect(() => {
    const elemento = conteudo.current
    if (!elemento) return

    if (aberto) {
      setEstado('abrindo')
      setAltura(`${medirAltura(elemento)}px`)
      return
    }

    setEstado('fechando')
    setAltura(`${medirAltura(elemento)}px`)

    const quadro = requestAnimationFrame(() => {
      setAltura('0px')
    })
    return () => cancelAnimationFrame(quadro)
  }, [aberto])

  return (
    <div
      className="expansivel"
      data-aberto={aberto}
      data-estado={estado}
      inert={!aberto}
      style={{ '--altura-expansivel': altura }}
      onTransitionEnd={(e) => {
        if (e.target !== e.currentTarget || e.propertyName !== 'height') return
        if (aberto) {
          setEstado('aberto')
          setAltura('auto')
          return
        }
        setEstado('fechado')
      }}
    >
      <div ref={conteudo} className="expansivel__conteudo">
        {children}
      </div>
    </div>
  )
}

function medirAltura(elemento) {
  return Math.ceil(elemento.getBoundingClientRect().height) + 4
}

/**
 * Escolha em dois níveis: primeiro a categoria, depois qual.
 *
 * A folha de papel listava as dezessete bebidas de uma vez. No celular isso
 * vira uma parede que se rola — e quem rola parede desiste. Aqui a pessoa vê
 * sete opções curtas e só abre o que interessa.
 */
function Escolha({ pergunta, resposta, aoResponder, erro }) {
  return pergunta.multipla ? (
    <EscolhaMultipla
      pergunta={pergunta}
      resposta={resposta}
      aoResponder={aoResponder}
      erro={erro}
    />
  ) : (
    <EscolhaUnica pergunta={pergunta} resposta={resposta} aoResponder={aoResponder} erro={erro} />
  )
}

function EscolhaUnica({ pergunta, resposta, aoResponder, erro }) {
  const escolheuCategoria = Boolean(grupoDe(pergunta, resposta))

  return (
    <div className="flex flex-col gap-2.5">
      {pergunta.grupos.map((grupo) => {
        const aberto = resposta?.grupo === grupo.id

        return (
          <div key={grupo.id}>
            <Opcao
              nome={`${pergunta.id}-categoria`}
              marcada={aberto}
              // O vermelho vai onde falta a resposta: nas categorias enquanto
              // nenhuma foi marcada, nas sub-opções depois disso.
              erro={escolheuCategoria ? undefined : erro}
              aoMarcar={() => aoResponder({ grupo: grupo.id, valor: null })}
            >
              {grupo.titulo}
            </Opcao>

            {grupo.opcoes.length > 0 && (
              <SubOpcoes
                aberto={aberto}
                pergunta={pergunta}
                grupo={grupo}
                resposta={resposta}
                aoResponder={aoResponder}
                erro={erro}
              />
            )}
          </div>
        )
      })}
    </div>
  )
}

/**
 * Escolha de várias, ainda em dois níveis.
 *
 * A categoria deixa de ser resposta e vira só uma gaveta: abrir não marca
 * nada. Sem isso, tocar em "Café" para ver as opções já contaria como pedido
 * de café, e a pessoa sairia com bebida que não escolheu.
 *
 * Abrir é estado de tela, não de resposta — por isso mora aqui e não sobe
 * para o formulário. O que a gente devolve é só a lista do que foi marcado.
 */
function EscolhaMultipla({ pergunta, resposta, aoResponder, erro }) {
  const valores = resposta?.valores ?? []

  // Nasce com as gavetas que já têm escolha abertas: voltar para a pergunta e
  // não ver o que marcou é o mesmo que ter perdido.
  const [abertos, setAbertos] = useState(
    () => new Set(pergunta.grupos.filter((g) => temEscolha(g, valores)).map((g) => g.id)),
  )

  function alternar(grupo, id) {
    const marcado = valores.includes(id)

    if (marcado) {
      aoResponder({ valores: valores.filter((v) => v !== id) })
      return
    }

    // Exclusivo apaga o resto; qualquer bebida apaga o exclusivo.
    const exclusivos = new Set(pergunta.grupos.filter((g) => g.exclusivo).map((g) => g.id))
    const base = grupo.exclusivo ? [] : valores.filter((v) => !exclusivos.has(v))

    aoResponder({ valores: [...base, id] })
    if (grupo.exclusivo) setAbertos(new Set())
  }

  return (
    <div className="flex flex-col gap-2.5">
      {pergunta.grupos.map((grupo) => {
        // Categoria sem sub-opções é escolha por si só, não gaveta.
        if (!grupo.opcoes.length) {
          return (
            <Opcao
              key={grupo.id}
              multipla
              nome={`${pergunta.id}-${grupo.id}`}
              marcada={valores.includes(grupo.id)}
              erro={erro}
              aoMarcar={() => alternar(grupo, grupo.id)}
            >
              {grupo.titulo}
            </Opcao>
          )
        }

        const aberto = abertos.has(grupo.id)
        const escolhidas = grupo.opcoes.filter((o) => valores.includes(o.id)).length

        return (
          <div key={grupo.id}>
            <Gaveta
              aberta={aberto}
              escolhidas={escolhidas}
              erro={erro}
              aoAlternar={() =>
                setAbertos((atuais) => {
                  const proximos = new Set(atuais)
                  if (proximos.has(grupo.id)) proximos.delete(grupo.id)
                  else proximos.add(grupo.id)
                  return proximos
                })
              }
            >
              {grupo.titulo}
            </Gaveta>

            <SubOpcoes
              aberto={aberto}
              multipla
              pergunta={pergunta}
              grupo={grupo}
              marcadas={valores}
              aoAlternar={(id) => alternar(grupo, id)}
              erro={erro}
            />
          </div>
        )
      })}
    </div>
  )
}

function temEscolha(grupo, valores) {
  if (!grupo.opcoes.length) return valores.includes(grupo.id)
  return grupo.opcoes.some((o) => valores.includes(o.id))
}

/**
 * O cabeçalho de uma categoria na escolha múltipla.
 *
 * Botão, e não caixa de marcar: abrir e escolher são coisas diferentes, e usar
 * o mesmo controle para as duas é o que faria "vi o que tem em Café" virar
 * "quero café".
 */
function Gaveta({ aberta, escolhidas, erro, aoAlternar, children }) {
  const temEscolhas = escolhidas > 0

  return (
    <button
      type="button"
      onClick={aoAlternar}
      aria-expanded={aberta}
      className={`flex w-full cursor-pointer items-center gap-3 rounded-lg border px-4 py-2.5 text-left text-base transition-colors ${
        temEscolhas
          ? 'border-mint-500 bg-mint-50 text-navy-900'
          : `bg-white text-navy-700 hover:border-navy-300 ${erro ? 'border-red-300' : 'border-navy-200'}`
      }`}
    >
      <span className="flex-1">{children}</span>

      {temEscolhas && (
        <span className="rounded-full bg-mint-600 px-2 py-0.5 font-display text-xs font-semibold text-white">
          {escolhidas}
        </span>
      )}

      <svg
        aria-hidden="true"
        viewBox="0 0 20 20"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={`h-4 w-4 shrink-0 text-navy-400 transition-transform duration-200 ${aberta ? 'rotate-180' : ''}`}
      >
        <path d="M5 7.5 10 12.5 15 7.5" />
      </svg>
    </button>
  )
}

/**
 * As opções de dentro de uma categoria.
 *
 * Aparecem coladas na categoria escolhida, não no fim da lista: é onde o olho
 * já está. E rolam para dentro da tela ao abrir, porque a categoria pode estar
 * na última linha visível e as opções nasceriam abaixo da dobra.
 */
function SubOpcoes({
  aberto,
  multipla,
  pergunta,
  grupo,
  resposta,
  marcadas,
  aoResponder,
  aoAlternar,
  erro,
}) {
  const caixa = useRef(null)
  const id = useId()

  useEffect(() => {
    if (!aberto) return
    if (
      typeof window === 'undefined' ||
      !window.matchMedia(`(max-width: ${LARGURA_MAXIMA_ROLAGEM_MOBILE}px)`).matches
    )
      return
    // Depois da expansão: rolar antes disso mira a altura antiga, que ainda
    // é zero, e a caixa termina de crescer fora da tela do mesmo jeito.
    const espera = setTimeout(() => {
      caixa.current?.scrollIntoView({ block: 'nearest', behavior: 'smooth' })
    }, TEMPO_EXPANSAO_MS + 30)
    return () => clearTimeout(espera)
  }, [aberto])

  return (
    <Expansivel aberto={aberto}>
      <div ref={caixa} className="mt-2.5 rounded-xl border border-mint-200 bg-mint-50/60 p-3.5">
        <p id={id} className="font-display text-sm font-medium text-navy-700">
          {multipla
            ? `Quais de ${grupo.titulo.toLowerCase()}?`
            : `Qual ${grupo.titulo.toLowerCase()}?`}
        </p>

        <div
          role={multipla ? 'group' : 'radiogroup'}
          aria-labelledby={id}
          className="mt-2 flex flex-col gap-2.5"
        >
          {grupo.opcoes.map((opcao) => (
            <Opcao
              key={opcao.id}
              multipla={multipla}
              // Na múltipla cada caixa é independente: agrupar por `name` faria
              // o navegador tratá-las como rádio e desmarcar a anterior.
              nome={multipla ? `${pergunta.id}-${opcao.id}` : `${pergunta.id}-opcao`}
              marcada={multipla ? marcadas.includes(opcao.id) : resposta?.valor === opcao.id}
              erro={erro}
              aoMarcar={() => (multipla ? aoAlternar(opcao.id) : aoResponder({ valor: opcao.id }))}
            >
              {opcao.rotulo}
            </Opcao>
          ))}
        </div>
      </div>
    </Expansivel>
  )
}

/**
 * Uma opção de escolha única.
 *
 * O rádio de verdade fica escondido, mas presente: é ele que dá o
 * comportamento de grupo, a navegação por setas e o anúncio correto no leitor
 * de tela. A caixa inteira é o alvo — no celular, mirar num círculo de 16px é
 * o que faz a pessoa errar e desistir.
 */
function Opcao({ nome, marcada, aoMarcar, erro, multipla = false, children }) {
  return (
    <label
      className={`flex cursor-pointer items-center gap-3 rounded-lg border px-4 py-2.5 text-base transition-colors ${
        marcada
          ? 'border-mint-500 bg-mint-50 text-navy-900'
          : `bg-white text-navy-700 hover:border-navy-300 ${erro ? 'border-red-300' : 'border-navy-200'}`
      }`}
    >
      <input
        type={multipla ? 'checkbox' : 'radio'}
        name={nome}
        checked={marcada}
        onChange={aoMarcar}
        aria-describedby={erro}
        className="sr-only"
      />

      {/* Quadrado para marcar várias, círculo para escolher uma. A forma é o
          que diz, antes de tocar, se marcar a segunda apaga a primeira. */}
      <span
        aria-hidden="true"
        className={`flex h-5 w-5 shrink-0 items-center justify-center border-2 transition-colors ${
          multipla ? 'rounded-md' : 'rounded-full'
        } ${marcada ? 'border-mint-600 ' + (multipla ? 'bg-mint-600' : '') : 'border-navy-300'}`}
      >
        {marcada &&
          (multipla ? (
            <svg
              viewBox="0 0 16 16"
              fill="none"
              stroke="white"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-3 w-3"
            >
              <path d="M3.5 8.5 6.5 11.5 12.5 5" />
            </svg>
          ) : (
            <span className="h-2.5 w-2.5 rounded-full bg-mint-600" />
          ))}
      </span>

      {children}
    </label>
  )
}
