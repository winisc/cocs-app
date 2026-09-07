import { useEffect, useRef, useState } from 'react'
import { CheckIcon, ClipboardIcon } from '@heroicons/react/24/solid'

/**
 * Um link pronto para copiar, com aviso do que aconteceu.
 *
 * Serve o convite da anamnese e a redefinição de senha: nos dois casos alguém
 * precisa levar um endereço daqui para outro lugar, e o caso de a área de
 * transferência não funcionar é igual nos dois.
 */
export default function LinkParaCopiar({ url, id, rotulo }) {
  const [estado, setEstado] = useState(null)
  const relogio = useRef(null)

  useEffect(() => () => clearTimeout(relogio.current), [])

  function avisar(novo) {
    setEstado(novo)
    clearTimeout(relogio.current)
    relogio.current = setTimeout(() => setEstado(null), 3000)
  }

  async function copiar() {
    try {
      await navigator.clipboard.writeText(url)
      avisar('copiado')
    } catch {
      // Área de transferência bloqueada acontece: navegador antigo, permissão
      // negada, página sem HTTPS, janela sem foco. Selecionar o texto deixa a
      // pessoa copiar na mão — e o aviso é o que diz que foi isso que
      // aconteceu, senão o clique parece não ter feito nada.
      document.getElementById(id)?.select()
      avisar('selecionado')
    }
  }

  return (
    <div className="w-full">
      <div className="flex w-full gap-2">
        <input
          id={id}
          readOnly
          value={url}
          aria-label={rotulo}
          onFocus={(e) => e.target.select()}
          className="min-w-0 flex-1 rounded-lg border border-navy-200 bg-navy-50 px-3 py-1.5 font-mono text-xs text-navy-700"
        />

        <button
          type="button"
          onClick={copiar}
          className="flex shrink-0 cursor-pointer items-center gap-1.5 rounded-lg border border-navy-200 px-3 py-2 font-display text-xs font-semibold tracking-wide text-navy-700 uppercase transition-colors hover:bg-navy-50"
        >
          {estado === 'copiado' ? (
            <CheckIcon aria-hidden="true" className="h-4 w-4 text-mint-600" />
          ) : (
            <ClipboardIcon aria-hidden="true" className="h-4 w-4" />
          )}
          {estado === 'copiado' ? 'Copiado' : 'Copiar'}
        </button>
      </div>

      {/* Anuncia o resultado para quem não vê o ícone mudar — e diz o que
          fazer quando o navegador não deixou copiar. */}
      <p role="status" className="mt-1.5 min-h-4 text-xs text-navy-400">
        {estado === 'copiado' && 'Link copiado.'}
        {estado === 'selecionado' &&
          'O navegador não deixou copiar. O link está selecionado — use Ctrl+C.'}
      </p>
    </div>
  )
}
