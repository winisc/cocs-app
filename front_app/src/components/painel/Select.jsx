import { useEffect, useId, useRef, useState } from 'react'

/**
 * Campo de seleção próprio, no lugar do <select> do navegador.
 *
 * O <select> nativo não aceita estilo na lista aberta — ela é desenhada pelo
 * sistema operacional, e some do desenho do resto do painel. O preço de
 * trocar é ter que reconstruir o que ele dava de graça: teclado, leitor de
 * tela e fechar ao clicar fora. Segue o padrão de listbox da ARIA, que é o
 * que descreve exatamente esse comportamento.
 *
 * O foco fica no botão o tempo todo e a opção em destaque é apontada por
 * `aria-activedescendant`. Mover o foco para dentro da lista funcionaria
 * também, mas quebra em navegador com leitor de tela mais antigo.
 */
export default function Select({ label, value, onChange, opcoes, disabled = false, dica }) {
  const id = useId()
  const raiz = useRef(null)
  const listaRef = useRef(null)
  const digitado = useRef({ texto: '', quando: 0 })

  const [aberto, setAberto] = useState(false)
  const [ativo, setAtivo] = useState(0)
  const [posicao, setPosicao] = useState(null)

  const selecionada = opcoes.find((o) => o.id === value)
  const idOpcao = (i) => `${id}-opcao-${i}`

  /**
   * A lista é posicionada em `fixed`, com coordenadas medidas do campo.
   *
   * Em `absolute` ela é recortada pelo `overflow` do <dialog> — foi o que
   * aconteceu: a última opção aparecia pela metade, atrás da borda. Elemento
   * `fixed` tem o viewport como bloco de contenção e não é recortado por
   * `overflow` de ancestral, então escapa da caixa continuando dentro dela no
   * DOM, que é o que mantém o clique funcionando dentro do modal.
   */
  function medir() {
    const caixa = raiz.current?.getBoundingClientRect()
    if (!caixa) return

    const abaixo = window.innerHeight - caixa.bottom
    const acima = caixa.top
    const paraCima = abaixo < 220 && acima > abaixo

    setPosicao({
      left: caixa.left,
      width: caixa.width,
      maxHeight: Math.max(140, (paraCima ? acima : abaixo) - 16),
      ...(paraCima ? { bottom: window.innerHeight - caixa.top + 4 } : { top: caixa.bottom + 4 }),
    })
  }

  function abrir() {
    if (disabled) return
    setAtivo(
      Math.max(
        0,
        opcoes.findIndex((o) => o.id === value),
      ),
    )
    medir()
    setAberto(true)
  }

  function escolher(indice) {
    onChange(opcoes[indice].id)
    setAberto(false)
  }

  // Fecha ao clicar fora. `pointerdown` e não `click`: com `click`, soltar o
  // botão fora depois de arrastar de dentro já contaria como clique fora.
  //
  // Rolar ou redimensionar remede: em `fixed`, a lista não acompanha o campo
  // sozinha e ficaria flutuando longe dele.
  useEffect(() => {
    if (!aberto) return

    const aoApontar = (e) => {
      if (!raiz.current?.contains(e.target) && !listaRef.current?.contains(e.target)) {
        setAberto(false)
      }
    }
    document.addEventListener('pointerdown', aoApontar)
    // `true` para pegar a rolagem do <dialog>, que não borbulha.
    window.addEventListener('scroll', medir, true)
    window.addEventListener('resize', medir)

    return () => {
      document.removeEventListener('pointerdown', aoApontar)
      window.removeEventListener('scroll', medir, true)
      window.removeEventListener('resize', medir)
    }
  }, [aberto])

  // Mantém a opção em destaque visível quando se navega pelo teclado.
  useEffect(() => {
    if (!aberto) return
    listaRef.current
      ?.querySelector(`#${CSS.escape(idOpcao(ativo))}`)
      ?.scrollIntoView({ block: 'nearest' })
  }, [aberto, ativo])

  function aoTeclar(evento) {
    const { key } = evento

    if (key === 'Escape') {
      // Fechado, deixa passar: dentro de um <dialog>, Esc tem que fechar o
      // diálogo. Aberto, segura o evento — senão um Esc fecha a lista e o
      // diálogo de uma vez, e a pessoa perde o que estava editando.
      if (!aberto) return
      evento.preventDefault()
      evento.stopPropagation()
      setAberto(false)
      return
    }

    if (!aberto) {
      if (['ArrowDown', 'ArrowUp', 'Enter', ' '].includes(key)) {
        evento.preventDefault()
        abrir()
      }
      return
    }

    if (key === 'ArrowDown' || key === 'ArrowUp') {
      evento.preventDefault()
      const passo = key === 'ArrowDown' ? 1 : -1
      setAtivo((i) => (i + passo + opcoes.length) % opcoes.length)
      return
    }

    if (key === 'Home' || key === 'End') {
      evento.preventDefault()
      setAtivo(key === 'Home' ? 0 : opcoes.length - 1)
      return
    }

    if (key === 'Enter' || key === ' ') {
      evento.preventDefault()
      escolher(ativo)
      return
    }

    if (key === 'Tab') {
      // Tab confirma e segue. Fechar sem escolher faria a pessoa perder o que
      // acabou de destacar sem perceber.
      escolher(ativo)
      return
    }

    // Digitar letras pula para a opção que começa com elas, como no nativo.
    if (key.length === 1 && !evento.metaKey && !evento.ctrlKey) {
      const agora = Date.now()
      const texto =
        (agora - digitado.current.quando < 700 ? digitado.current.texto : '') + key.toLowerCase()
      digitado.current = { texto, quando: agora }

      const achou = opcoes.findIndex((o) => o.rotulo.toLowerCase().startsWith(texto))
      if (achou >= 0) setAtivo(achou)
    }
  }

  return (
    <div>
      <label
        id={`${id}-rotulo`}
        htmlFor={`${id}-botao`}
        className="block font-display text-sm font-medium text-navy-700"
      >
        {label}
      </label>

      <div ref={raiz} className="relative mt-1.5">
        <button
          type="button"
          id={`${id}-botao`}
          role="combobox"
          aria-haspopup="listbox"
          aria-expanded={aberto}
          aria-controls={`${id}-lista`}
          aria-labelledby={`${id}-rotulo ${id}-botao`}
          aria-activedescendant={aberto ? idOpcao(ativo) : undefined}
          disabled={disabled}
          onClick={() => (aberto ? setAberto(false) : abrir())}
          onKeyDown={aoTeclar}
          className={`cursor-pointer flex w-full items-center justify-between gap-2 rounded-lg border bg-white px-3.5 py-2 text-left text-[15px] text-navy-900 transition-colors disabled:cursor-not-allowed disabled:bg-navy-50 disabled:text-navy-400 ${
            aberto ? 'border-navy-400' : 'border-navy-200 hover:border-navy-300'
          }`}
        >
          <span className="truncate">{selecionada?.rotulo ?? '—'}</span>
          <Seta className={`h-4 w-4 shrink-0 text-navy-400 ${aberto ? 'rotate-180' : ''}`} />
        </button>

        {aberto && (
          <ul
            ref={listaRef}
            id={`${id}-lista`}
            role="listbox"
            aria-labelledby={`${id}-rotulo`}
            style={posicao ?? undefined}
            className="fixed z-50 overflow-auto rounded-lg border border-navy-200 bg-white py-1 shadow-lg"
          >
            {opcoes.map((opcao, i) => {
              const escolhida = opcao.id === value
              return (
                <li
                  key={opcao.id}
                  id={idOpcao(i)}
                  role="option"
                  aria-selected={escolhida}
                  // O foco tem que continuar no botão: sem isto o mousedown
                  // tira o foco dali e o teclado para de funcionar depois de
                  // um clique.
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => escolher(i)}
                  onMouseEnter={() => setAtivo(i)}
                  className={`flex cursor-pointer items-center justify-between gap-2 px-3.5 py-1.5 text-[15px] ${
                    i === ativo ? 'bg-navy-50' : ''
                  } ${escolhida ? 'font-medium text-navy-900' : 'text-navy-700'}`}
                >
                  {opcao.rotulo}
                  {escolhida && <Visto className="h-4 w-4 shrink-0 text-mint-600" />}
                </li>
              )
            })}
          </ul>
        )}
      </div>

      {dica && <p className="mt-1.5 text-xs text-navy-400">{dica}</p>}
    </div>
  )
}

function Seta({ className }) {
  return (
    <svg viewBox="0 0 20 20" fill="currentColor" aria-hidden="true" className={className}>
      <path
        fillRule="evenodd"
        d="M5.22 7.22a.75.75 0 0 1 1.06 0L10 10.94l3.72-3.72a.75.75 0 1 1 1.06 1.06l-4.25 4.25a.75.75 0 0 1-1.06 0L5.22 8.28a.75.75 0 0 1 0-1.06Z"
        clipRule="evenodd"
      />
    </svg>
  )
}

function Visto({ className }) {
  return (
    <svg viewBox="0 0 20 20" fill="currentColor" aria-hidden="true" className={className}>
      <path
        fillRule="evenodd"
        d="M16.7 5.3a1 1 0 0 1 0 1.4l-7.5 7.5a1 1 0 0 1-1.4 0l-3.5-3.5a1 1 0 1 1 1.4-1.4l2.8 2.79 6.8-6.79a1 1 0 0 1 1.4 0Z"
        clipRule="evenodd"
      />
    </svg>
  )
}
