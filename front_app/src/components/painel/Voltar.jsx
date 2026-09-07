import { Link, useLocation, useNavigate } from 'react-router-dom'

const ESTILO =
  'rounded-lg border border-navy-200 px-4 py-2 font-display text-xs font-semibold tracking-wide text-navy-700 uppercase transition-colors hover:bg-navy-50'

/**
 * Volta para onde a pessoa estava, não para um lugar fixo.
 *
 * As telas que usam isto são abertas de mais de um lugar. Um link fixo mandava
 * quem veio de Pacientes para Anamnese — um "voltar" que leva a outro lugar é
 * pior que não ter botão.
 *
 * `location.key` é `'default'` quando a página foi aberta direto pela URL, sem
 * histórico dentro do painel. Aí voltar sairia do aplicativo, e `para` passa a
 * ser o destino certo.
 */
export default function Voltar({ para }) {
  const navegar = useNavigate()
  const { key } = useLocation()

  if (key === 'default') {
    return (
      <Link to={para} className={ESTILO}>
        Voltar
      </Link>
    )
  }

  return (
    <button type="button" onClick={() => navegar(-1)} className={`cursor-pointer ${ESTILO}`}>
      Voltar
    </button>
  )
}
