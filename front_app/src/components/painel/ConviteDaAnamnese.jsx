import { useEffect, useRef, useState } from 'react'
import QRCode from 'qrcode'
import { CheckIcon, ClipboardIcon } from '@heroicons/react/24/solid'
import { linkDaAnamnese } from '../../lib/anamneses'

/**
 * O convite de uma anamnese: QR na tela e link para copiar.
 *
 * Os dois caminhos existem porque a situação é uma só com duas saídas. Com o
 * paciente na frente, ele aponta a câmera e pronto; se não estiver na clínica,
 * a recepção copia o link e envia pelo canal combinado.
 */
export default function ConviteDaAnamnese({ token, nome }) {
  const url = linkDaAnamnese(token)

  return (
    <div className="flex flex-col items-center gap-4">
      <Qr url={url} />

      <p className="text-center text-sm leading-relaxed text-navy-500">
        Peça para {nome} apontar a câmera para o código, ou copie o link para enviar.
      </p>

      <LinkParaCopiar url={url} />
    </div>
  )
}

function Qr({ url }) {
  const [svg, setSvg] = useState(null)
  const [falhou, setFalhou] = useState(false)

  useEffect(() => {
    let vivo = true
    QRCode.toString(url, { type: 'svg', margin: 1, width: 208, errorCorrectionLevel: 'M' })
      .then((codigo) => vivo && setSvg(codigo))
      .catch(() => vivo && setFalhou(true))
    return () => {
      vivo = false
    }
  }, [url])

  if (falhou) {
    return (
      <p className="text-sm text-navy-400">Não foi possível gerar o código. Use o link abaixo.</p>
    )
  }

  const moldura = 'rounded-xl border border-navy-100 bg-white p-3'

  // Dois retornos em vez de um só: React recusa `children` e
  // `dangerouslySetInnerHTML` no mesmo elemento, e o placeholder era um filho.
  if (!svg) {
    return (
      <div className={moldura}>
        <div className="h-52 w-52 animate-pulse rounded-lg bg-navy-50" />
      </div>
    )
  }

  return (
    <div
      // O código é decoração para quem usa leitor de tela: o link logo abaixo
      // é a mesma informação, em texto e selecionável.
      aria-hidden="true"
      className={`${moldura} [&_svg]:block [&_svg]:h-52 [&_svg]:w-52`}
      // O SVG vem da biblioteca a partir de uma URL montada por nós — não há
      // entrada de terceiro no caminho.
      dangerouslySetInnerHTML={{ __html: svg }}
    />
  )
}

function LinkParaCopiar({ url }) {
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
      document.getElementById('link-da-anamnese')?.select()
      avisar('selecionado')
    }
  }

  return (
    <div className="w-full">
      <div className="flex w-full gap-2">
        <input
          id="link-da-anamnese"
          readOnly
          value={url}
          aria-label="Link da anamnese"
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
