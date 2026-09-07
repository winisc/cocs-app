import { useEffect, useRef } from 'react'

/**
 * Caixa de diálogo modal.
 *
 * Usa o <dialog> do navegador com showModal(), não uma div com position
 * fixed. O elemento nativo já entrega prender o foco dentro da caixa, fechar
 * no Esc, esconder o resto da página do leitor de tela e ficar acima de
 * qualquer z-index. Refazer isso na mão é onde se perde acessibilidade sem
 * ninguém testar.
 */
export default function Dialogo({ aberto, aoFechar, titulo, descricao, children }) {
  const ref = useRef(null)
  const comecouNoFundo = useRef(false)
  const terminouNoFundo = useRef(false)

  useEffect(() => {
    const dialogo = ref.current
    if (!dialogo) return

    if (aberto && !dialogo.open) dialogo.showModal()
    if (!aberto && dialogo.open) dialogo.close()
  }, [aberto])

  return (
    <dialog
      ref={ref}
      // O Esc dispara `cancel`, e sem avisar quem abriu o estado ficaria
      // dizendo "aberto" com a caixa já fechada.
      onCancel={aoFechar}
      onClose={aoFechar}
      // Clique fora fecha. O <dialog> não separa fundo de conteúdo, então a
      // conta é: o alvo ser o próprio elemento significa que caiu no
      // ::backdrop.
      //
      // Olhar só o `click` fecha a caixa por engano. O `click` dispara no
      // ancestral comum de onde se apertou e de onde se soltou — então
      // arrastar entre o conteúdo e o fundo, em qualquer direção, faz o alvo
      // virar o próprio <dialog> e o formulário some no meio da edição.
      //
      // Por isso as duas pontas do gesto são registradas: só fecha quando
      // desceu e subiu no fundo, que é o único caso em que a pessoa quis
      // mesmo dispensar a caixa.
      onPointerDown={(e) => (comecouNoFundo.current = e.target === ref.current)}
      onPointerUp={(e) => (terminouNoFundo.current = e.target === ref.current)}
      onClick={() => comecouNoFundo.current && terminouNoFundo.current && aoFechar()}
      // `m-auto` é o que centraliza. O <dialog> vem do navegador com
      // `margin: auto`, e o preflight do Tailwind zera a margem de tudo — sem
      // repor aqui, a caixa encosta no canto superior esquerdo.
      //
      // O max-h com overflow evita que um formulário alto passe da tela sem
      // deixar rolar; o rodapé com os botões ficaria fora de alcance.
      className="m-auto max-h-[calc(100dvh-2rem)] w-[min(28rem,calc(100vw-2rem))] overflow-y-auto rounded-2xl bg-white p-6 shadow-xl backdrop:bg-navy-950/50"
    >
      <h2 className="font-display text-lg font-semibold text-navy-900">{titulo}</h2>
      {descricao && <p className="mt-1 text-sm leading-relaxed text-navy-500">{descricao}</p>}
      <div className="mt-5">{children}</div>
    </dialog>
  )
}

export function AcoesDoDialogo({ children }) {
  return <div className="mt-6 flex justify-end gap-2">{children}</div>
}

/**
 * Guarda o último valor não nulo.
 *
 * Sem isto o conteúdo do diálogo some no instante em que ele começa a fechar:
 * o React desmonta o formulário assim que o item vira null, e o que se vê
 * saindo é uma caixa vazia. Com o último valor preservado, a caixa some
 * mostrando o que estava mostrando.
 */
export function useUltimo(valor) {
  const guardado = useRef(valor)
  if (valor !== null && valor !== undefined) guardado.current = valor
  return valor ?? guardado.current
}
