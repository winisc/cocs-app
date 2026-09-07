import { useCallback, useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { buscarPorToken, responderAnamnese } from '../../lib/anamneses'
import { ABERTURA, PERGUNTAS, TITULO, respostaEmTexto, validar } from '../../content/anamnese'
import Pergunta from './Pergunta'
import Botao from '../../components/painel/Botao'

/**
 * A anamnese que o paciente responde, pelo link temporário.
 *
 * Pública: sem login, sem barra lateral, sem nada do painel. Quem abre está no
 * celular, muitas vezes na sala de espera, e o que importa é terminar — por
 * isso uma pergunta por tela e o botão sempre no mesmo lugar.
 */
export default function AnamnesePublica() {
  const { token } = useParams()

  const [convite, setConvite] = useState(null)
  const [carregando, setCarregando] = useState(true)
  const [falhou, setFalhou] = useState(false)

  const [passo, setPasso] = useState(0)
  const [respostas, setRespostas] = useState({})
  const [erro, setErro] = useState(null)
  const [enviando, setEnviando] = useState(false)
  const [enviada, setEnviada] = useState(false)
  const [erroDoEnvio, setErroDoEnvio] = useState(null)

  useEffect(() => {
    let vivo = true
    buscarPorToken(token)
      .then((achado) => {
        if (!vivo) return
        setConvite(achado)
        // O nome vem preenchido do cadastro, mas continua editável: errar
        // nome é comum.
        if (achado?.nome) setRespostas({ nome: { valor: achado.nome } })
      })
      .catch(() => vivo && setFalhou(true))
      .finally(() => vivo && setCarregando(false))
    return () => {
      vivo = false
    }
  }, [token])

  const responder = useCallback((id, valor) => {
    setRespostas((atual) => ({ ...atual, [id]: { ...atual[id], ...valor } }))
    setErro(null)
  }, [])

  if (carregando)
    return (
      <Moldura>
        <Carregando />
      </Moldura>
    )
  if (falhou || !convite)
    return (
      <Moldura>
        <Recado titulo="Link não encontrado">Confira o endereço ou peça um novo à clínica.</Recado>
      </Moldura>
    )
  if (convite.situacao === 'expirada') {
    return (
      <Moldura>
        <Recado titulo="Este link expirou">
          Por segurança, o link vale por poucos dias. Peça um novo à clínica — leva um minuto.
        </Recado>
      </Moldura>
    )
  }
  if (convite.situacao === 'preenchida' || enviada) {
    return (
      <Moldura>
        <Recado titulo="Tudo certo, obrigado!" bom>
          Suas respostas chegaram para a equipe. Pode fechar esta página.
        </Recado>
      </Moldura>
    )
  }

  const total = PERGUNTAS.length + 1
  const naAbertura = passo === 0
  const pergunta = naAbertura ? null : PERGUNTAS[passo - 1]
  const ultima = passo === total - 1

  function avancar() {
    if (naAbertura) {
      setPasso(1)
      return
    }

    const problema = validar(pergunta, respostas[pergunta.id])
    if (problema) {
      setErro(problema)
      return
    }

    if (!ultima) {
      setPasso(passo + 1)
      return
    }

    enviar()
  }

  async function enviar() {
    setEnviando(true)
    setErroDoEnvio(null)
    try {
      await responderAnamnese(token, montarRespostas(respostas))
      setEnviada(true)
    } catch (e) {
      setErroDoEnvio(e.message)
    } finally {
      setEnviando(false)
    }
  }

  return (
    <Moldura>
      <Progresso passo={passo} total={total} />

      <div className="mt-6">
        {naAbertura ? (
          <Abertura />
        ) : (
          <Pergunta
            key={pergunta.id}
            pergunta={pergunta}
            resposta={respostas[pergunta.id]}
            aoResponder={(valor) => responder(pergunta.id, valor)}
            erro={erro}
          />
        )}
      </div>

      {erroDoEnvio && (
        <p
          role="alert"
          className="mt-5 rounded-xl bg-red-50 px-4 py-3 text-sm leading-relaxed text-red-800"
        >
          {erroDoEnvio}
        </p>
      )}

      {/* Os botões ficam colados embaixo no celular: com o teclado aberto, um
          botão no fim do documento some da tela e a pessoa não acha como
          seguir. */}
      <div className="sticky bottom-0 -mx-5 mt-8 flex gap-3 border-t border-navy-100 bg-white px-5 py-4 sm:static sm:bottom-auto sm:mx-0 sm:border-0 sm:bg-transparent sm:px-0 sm:py-0">
        {passo > 0 && (
          <Botao
            onClick={() => {
              setErro(null)
              setPasso(passo - 1)
            }}
            disabled={enviando}
          >
            Voltar
          </Botao>
        )}

        <Botao
          variante="primario"
          onClick={avancar}
          disabled={enviando}
          className="flex-1 py-3 sm:flex-none"
        >
          {enviando ? 'Enviando…' : ultima ? 'Enviar respostas' : 'Continuar'}
        </Botao>
      </div>
    </Moldura>
  )
}

/** Vira o formato que o painel vai ler: pergunta, título e resposta em texto. */
function montarRespostas(respostas) {
  return PERGUNTAS.map((pergunta) => ({
    id: pergunta.id,
    pergunta: pergunta.rotulo,
    resposta: respostaEmTexto(pergunta, respostas[pergunta.id]),
  })).filter((r) => r.resposta)
}

function Moldura({ children }) {
  return (
    <main className="min-h-dvh bg-navy-50 px-5 py-8 sm:grid sm:place-items-center sm:py-12">
      <div className="mx-auto w-full max-w-lg">
        <img
          src="/logo.png"
          alt="COCS Odontologia"
          width={229}
          height={98}
          className="mx-auto mb-6 h-9 w-auto"
        />
        <div className="rounded-2xl bg-white px-5 py-6 shadow-sm sm:px-8 sm:py-8">{children}</div>
      </div>
    </main>
  )
}

function Progresso({ passo, total }) {
  const porcento = Math.round((passo / (total - 1)) * 100)

  return (
    <div>
      <div className="flex items-baseline justify-between gap-3">
        <p className="font-display text-sm font-medium text-navy-700">
          {passo === 0 ? TITULO : `Pergunta ${passo} de ${total - 1}`}
        </p>
        <p className="text-xs text-navy-400">{porcento}%</p>
      </div>

      {/* A barra é decoração: o texto acima já diz onde a pessoa está, e um
          leitor de tela anunciando "progresso 33%" duas vezes atrapalha. */}
      <div aria-hidden="true" className="mt-2 h-1.5 overflow-hidden rounded-full bg-navy-100">
        <div
          className="h-full rounded-full bg-mint-500 transition-[width] duration-300"
          style={{ width: `${porcento}%` }}
        />
      </div>
    </div>
  )
}

function Abertura() {
  return (
    <div>
      <h1 className="font-display text-xl leading-snug font-semibold text-navy-900">
        {ABERTURA.titulo}
      </h1>

      <div className="mt-3 space-y-3 text-[15px] leading-relaxed text-navy-600">
        {ABERTURA.paragrafos.map((texto) => (
          <p key={texto}>{texto}</p>
        ))}
      </div>

      {/* A parte de LGPD ganha caixa própria: quem está decidindo se responde
          precisa achar essa frase de relance, sem ler o resto de novo. */}
      <p className="mt-5 rounded-xl bg-navy-50 px-4 py-3.5 text-[13px] leading-relaxed text-navy-500">
        {ABERTURA.privacidade}
      </p>

      <div className="mt-5 font-display text-[15px] leading-relaxed font-medium text-navy-800">
        {ABERTURA.chamada.map((linha) => (
          <p key={linha}>{linha}</p>
        ))}
      </div>
    </div>
  )
}

function Carregando() {
  return (
    <div role="status" aria-label="Carregando" className="flex justify-center py-10">
      <span className="h-6 w-6 animate-spin rounded-full border-2 border-navy-200 border-t-navy-600" />
    </div>
  )
}

function Recado({ titulo, bom = false, children }) {
  return (
    <div className="py-6 text-center">
      <h1
        className={`font-display text-xl font-semibold ${bom ? 'text-mint-800' : 'text-navy-900'}`}
      >
        {titulo}
      </h1>
      <p className="mx-auto mt-3 max-w-sm text-[15px] leading-relaxed text-navy-500">{children}</p>
    </div>
  )
}
