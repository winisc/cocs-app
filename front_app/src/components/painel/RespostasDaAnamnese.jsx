import { CheckCircleIcon } from '@heroicons/react/24/solid'
import { PERGUNTAS } from '../../content/anamnese'
import { formatarData } from '../../lib/pacientes'

/**
 * As respostas de uma anamnese já preenchida.
 *
 * Mora aqui, e não na página, porque duas telas mostram a mesma coisa: o
 * histórico do paciente e a ficha que abre direto na última respondida. Se o
 * questionário mudar, muda num lugar só.
 */
export default function RespostasDaAnamnese({ anamnese, className = '' }) {
  const respostas = anamnese.respostas ?? []

  return (
    <div className={className}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <CheckCircleIcon aria-hidden="true" className="h-5 w-5 text-mint-600" />
            <h3 className="font-display text-base font-semibold text-navy-900">
              Dados preenchidos
            </h3>
          </div>
          <p className="mt-1 text-sm leading-relaxed text-navy-500">
            Respostas recebidas pelo formulário público da anamnese.
          </p>
        </div>
        <p className="rounded-full bg-mint-50 px-3 py-1 text-xs font-medium text-mint-800">
          Recebida em {formatarData(anamnese.respondidaEm)}
        </p>
      </div>

      {respostas.length > 0 ? (
        <dl className="mt-5 divide-y divide-navy-100 border-y border-navy-100">
          {todasAsPerguntas(respostas).map((item, indice) => (
            <div
              key={item.id}
              className="grid gap-2 py-3.5 sm:grid-cols-[10rem_minmax(0,1fr)] sm:gap-4"
            >
              <dt>
                <span className="text-[11px] font-semibold tracking-wide text-navy-300 uppercase">
                  Pergunta {String(indice + 1).padStart(2, '0')}
                </span>
                <span className="mt-1 block text-sm leading-snug font-medium text-navy-600">
                  {item.pergunta}
                </span>
              </dt>
              <dd
                className={`text-sm leading-relaxed whitespace-pre-line sm:pt-5 ${
                  item.resposta ? 'font-semibold text-navy-900' : 'text-navy-300 italic'
                }`}
              >
                {item.resposta ?? 'Não informado'}
              </dd>
            </div>
          ))}
        </dl>
      ) : (
        <p className="mt-4 rounded-lg border border-dashed border-navy-200 px-3.5 py-3 text-sm text-navy-400">
          As respostas desta anamnese ainda não estão disponíveis no mock.
        </p>
      )}
    </div>
  )
}

/**
 * O questionário inteiro, não só o que foi respondido.
 *
 * Quem lê precisa saber que a pergunta foi feita e ficou em branco — some
 * diferente de "não". Uma lista que pula as vazias faz a ficha parecer
 * completa quando não está.
 */
function todasAsPerguntas(respostas) {
  const porId = new Map(respostas.map((item) => [item.id, item]))

  const doQuestionario = PERGUNTAS.map((pergunta) => ({
    id: pergunta.id,
    pergunta: pergunta.rotulo,
    resposta: porId.get(pergunta.id)?.resposta ?? null,
  }))

  // Resposta gravada de pergunta que saiu do questionário continua aparecendo:
  // o que a pessoa respondeu não some porque a clínica mudou o formulário.
  const aposentadas = respostas.filter((item) => !PERGUNTAS.some((p) => p.id === item.id))

  return [...doQuestionario, ...aposentadas]
}
