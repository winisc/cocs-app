import { useCallback, useEffect, useState } from 'react'
import { NavLink, Outlet, useLocation, useOutletContext, useSearchParams } from 'react-router-dom'
import { listarSolicitacoes, listarUsuarios } from '../../lib/usuarios'
import { filtrarPessoas } from '../../lib/busca'
import CampoDeBusca from '../../components/painel/CampoDeBusca'

/**
 * Moldura da seção de usuários: as duas listas e as sub-abas.
 *
 * As duas são carregadas aqui, não em cada aba. Assim o contador da sub-aba
 * fica certo sem a aba estar aberta, e aprovar uma solicitação atualiza os
 * dois números de uma vez — se cada aba buscasse a sua, aprovar deixaria o
 * contador de usuários desatualizado até alguém recarregar.
 */
export default function SecaoUsuarios() {
  // Uma caixa só para as duas listas, e o termo mora na URL como no resto do
  // painel. Trocar de sub-aba mantém a busca: procurar alguém e não achar em
  // "Usuários" leva direto a olhar em "Solicitações".
  const [params, setParams] = useSearchParams()
  const busca = params.get('q') ?? ''
  const buscar = (termo) => {
    const proximo = new URLSearchParams(params)
    if (termo) proximo.set('q', termo)
    else proximo.delete('q')
    setParams(proximo, { replace: true })
  }

  const [usuarios, setUsuarios] = useState([])
  const [solicitacoes, setSolicitacoes] = useState([])
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState(null)

  const recarregar = useCallback(async () => {
    try {
      const [u, s] = await Promise.all([listarUsuarios(), listarSolicitacoes()])
      setUsuarios(u)
      setSolicitacoes(s)
      setErro(null)
    } catch (e) {
      setErro(e.message)
    } finally {
      setCarregando(false)
    }
  }, [])

  useEffect(() => {
    recarregar()
  }, [recarregar])

  if (carregando) return <Esqueleto />
  if (erro) return <Aviso>{erro}</Aviso>

  const usuariosVisiveis = filtrarPessoas(usuarios, busca)
  const solicitacoesVisiveis = filtrarPessoas(solicitacoes, busca)

  return (
    <>
      <nav aria-label="Listas de usuários" className="mb-4 flex gap-1 border-b border-navy-100">
        {/* Com busca ativa o contador passa a ser o do resultado: é o que diz
            em qual das duas listas a pessoa está, sem precisar abrir as duas. */}
        <SubAba para="." fim rotulo="Usuários" quantidade={usuariosVisiveis.length} />
        <SubAba
          para="solicitacoes"
          rotulo="Solicitações"
          quantidade={solicitacoesVisiveis.length}
        />
      </nav>

      {(usuarios.length > 0 || solicitacoes.length > 0) && (
        <div className="mb-4 max-w-sm">
          <CampoDeBusca
            valor={busca}
            aoMudar={buscar}
            rotulo="Buscar pessoa"
            placeholder="Buscar por nome ou e-mail"
          />
        </div>
      )}

      <Outlet
        context={{
          usuarios: usuariosVisiveis,
          solicitacoes: solicitacoesVisiveis,
          busca,
          recarregar,
        }}
      />
    </>
  )
}

export function useUsuarios() {
  return useOutletContext()
}

function SubAba({ para, fim = false, rotulo, quantidade }) {
  // Leva a busca junto. Sem isto, trocar de sub-aba descarta o `?q=` e a
  // lista volta inteira — logo depois de procurar alguém e ser mandado para
  // a outra aba justamente porque o contador dizia que estava lá.
  const { search } = useLocation()

  return (
    <NavLink
      to={{ pathname: para, search }}
      end={fim}
      className={({ isActive }) =>
        `-mb-px flex items-center gap-2 border-b-2 px-3 py-2.5 font-display text-sm font-medium transition-colors ${
          isActive
            ? 'border-mint-500 text-navy-900'
            : 'border-transparent text-navy-400 hover:text-navy-700'
        }`
      }
    >
      {rotulo}
      {/* Mostra o zero também. Escondê-lo tira justamente a informação que
          interessa durante uma busca: que o resultado não está nesta aba. */}
      <span className="rounded-full bg-navy-100 px-1.5 py-0.5 text-[11px] font-semibold text-navy-600">
        {quantidade}
      </span>
    </NavLink>
  )
}

function Esqueleto() {
  return (
    <div role="status" aria-label="Carregando" className="space-y-3">
      {[0, 1, 2].map((i) => (
        <div key={i} className="h-14 animate-pulse rounded-xl bg-white" />
      ))}
    </div>
  )
}

export function Aviso({ children }) {
  return (
    <p className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm leading-relaxed text-amber-900">
      {children}
    </p>
  )
}

export function Vazio({ children }) {
  return (
    <p className="rounded-xl border border-dashed border-navy-200 bg-white px-4 py-10 text-center text-sm text-navy-400">
      {children}
    </p>
  )
}
