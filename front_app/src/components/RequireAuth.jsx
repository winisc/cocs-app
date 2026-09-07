import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useSession } from '../lib/session'

/**
 * Guarda de rota: só deixa passar quem tem sessão.
 *
 * Enquanto a sessão está sendo verificada não redireciona nada. Decidir antes
 * da resposta chegar expulsaria quem está logado toda vez que recarregasse a
 * página — o bug clássico desse tipo de guarda, e o motivo de `carregando`
 * existir como estado separado de "não tem ninguém".
 *
 * O caminho tentado vai junto no `state` para o login devolver a pessoa ao
 * lugar certo depois, em vez de largar todo mundo no dashboard.
 */
export default function RequireAuth() {
  const { usuario, carregando } = useSession()
  const local = useLocation()

  if (carregando) return <Verificando />
  if (!usuario) return <Navigate to="/login" replace state={{ de: local }} />

  return <Outlet />
}

export function Verificando() {
  return (
    <div className="flex min-h-dvh items-center justify-center bg-navy-50">
      {/* role="status" para o leitor de tela anunciar a espera; o texto some
          da tela mas continua sendo lido. */}
      <p role="status" className="sr-only">
        Verificando seu acesso
      </p>
      <span className="h-6 w-6 animate-spin rounded-full border-2 border-navy-200 border-t-navy-600" />
    </div>
  )
}
