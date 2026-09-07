import { Navigate, Outlet } from 'react-router-dom'
import { primeiraDoUsuario } from './painel/navegacao'
import { papelDo } from '../lib/permissoes'
import { useSession } from '../lib/session'

export default function RequireRole({ roles }) {
  const { usuario } = useSession()
  const papel = papelDo(usuario)

  if (!papel || !roles.includes(papel)) {
    return <Navigate to={`/dashboard/${primeiraDoUsuario(usuario)}`} replace />
  }

  return <Outlet />
}
