import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { anamnesesDoPaciente, situacaoDa, ultimaPreenchida } from '../../lib/anamneses'
import { buscarPaciente, nomeCompleto } from '../../lib/pacientes'
import RespostasDaAnamnese from '../../components/painel/RespostasDaAnamnese'
import Voltar from '../../components/painel/Voltar'
import { AindaVazio } from '../../components/Painel'
import { Aviso } from '../usuarios/Secao'

/**
 * A anamnese do paciente, vista da ficha dele.
 *
 * Mostra uma só: a última respondida. Quem abre daqui quer saber como receber
 * a pessoa que vai sentar na cadeira, não acompanhar envio de link — por isso
 * pendente e expirada não aparecem. Isso é controle, e controle é o histórico.
 *
 * Tela de leitura, sem ação nenhuma. Nem o histórico é citado, nem como link:
 * a aba Anamnese não existe para todo mundo que abre esta página, e oferecer
 * uma saída que parte das pessoas não tem é pior que não oferecer.
 */
export default function AnamneseAtualDoPaciente() {
  const { pacienteId } = useParams()

  const [paciente, setPaciente] = useState(null)
  const [anamneses, setAnamneses] = useState([])
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState(null)

  useEffect(() => {
    let vivo = true

    Promise.all([buscarPaciente(pacienteId), anamnesesDoPaciente(pacienteId)])
      .then(([p, lista]) => {
        if (!vivo) return
        setPaciente(p)
        setAnamneses(lista)
      })
      .catch((e) => vivo && setErro(e.message))
      .finally(() => vivo && setCarregando(false))

    return () => {
      vivo = false
    }
  }, [pacienteId])

  if (carregando) return <div role="status" aria-label="Carregando" className="h-24" />
  if (erro) return <Aviso>{erro}</Aviso>
  if (!paciente) {
    return (
      <>
        <Aviso>Paciente não encontrado. A ficha pode ter sido excluída.</Aviso>
        <div className="mt-4">
          <Voltar para="/dashboard/pacientes" />
        </div>
      </>
    )
  }

  const atual = ultimaPreenchida(anamneses)

  return (
    <>
      <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="font-display text-lg font-semibold text-navy-900">
            {nomeCompleto(paciente)}
          </h2>
          <p className="mt-1 text-sm text-navy-500">Anamnese mais recente</p>
        </div>

        <Voltar para="/dashboard/pacientes" />
      </div>

      {atual ? (
        <div className="rounded-xl border border-navy-100 bg-white p-4 shadow-sm">
          <RespostasDaAnamnese anamnese={atual} />
        </div>
      ) : (
        <AindaVazio>
          <SemResposta anamneses={anamneses} />
        </AindaVazio>
      )}
    </>
  )
}

/**
 * Por que não há nada para mostrar.
 *
 * "Nunca teve", "não respondeu ainda" e "o prazo passou" são situações
 * diferentes para quem lê: uma pede enviar, outra pede esperar, a terceira
 * pede reenviar. Dizer só "sem anamnese" faria a do meio virar um envio
 * duplicado.
 */
function SemResposta({ anamneses }) {
  const pendente = anamneses.some((a) => situacaoDa(a) === 'pendente')
  const expirada = anamneses.some((a) => situacaoDa(a) === 'expirada')

  if (pendente) {
    return <>Este paciente ainda não respondeu. O link enviado continua válido.</>
  }

  if (expirada) {
    return <>Nenhuma anamnese foi respondida. O último link expirou sem resposta.</>
  }

  return <>Este paciente ainda não tem anamnese.</>
}
