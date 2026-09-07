import { useEffect, useRef, useState } from 'react'
import QRCode from 'qrcode'
import { linkDaAnamnese } from '../../lib/anamneses'
import LinkParaCopiar from './LinkParaCopiar'

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

      <LinkParaCopiar url={url} id="link-da-anamnese" rotulo="Link da anamnese" />
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
