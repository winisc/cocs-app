import { useState } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import BarraLateral from '../components/painel/BarraLateral'
import { GRUPOS, IconeMenu, ITENS } from '../components/painel/navegacao'

/**
 * Moldura do painel: barra lateral, barra superior e o miolo da seção ativa.
 *
 * As seções são rotas, não estado local. Custa a mesma coisa e resolve três
 * coisas de graça: recarregar mantém a seção aberta, o botão voltar do
 * navegador funciona, e dá para mandar link direto para uma seção.
 */
export default function Dashboard() {
  const [recolhida, setRecolhida] = useState(false)
  const [aberta, setAberta] = useState(false)
  const atual = useSecaoAtual()

  return (
    <div className="min-h-dvh bg-navy-50 md:flex">
      <BarraLateral
        recolhida={recolhida}
        aoRecolher={() => setRecolhida((v) => !v)}
        aberta={aberta}
        aoFechar={() => setAberta(false)}
      />

      <div className="flex min-w-0 flex-1 flex-col">
        {/* A barra atravessa a tela inteira, o que ela diz não: o miolo dela
            usa a mesma coluna do conteúdo, senão o título fica num canto e a
            página começa noutro. */}
        <header className="sticky top-0 z-20 flex h-16 shrink-0 items-center border-b border-navy-100 bg-white">
          <div className="mx-auto flex w-full max-w-6xl items-center gap-3 px-5 lg:px-8">
            <button
              type="button"
              onClick={() => setAberta(true)}
              aria-label="Abrir menu"
              className="-ml-1 flex h-9 w-9 items-center justify-center rounded-lg text-navy-500 transition-colors hover:bg-navy-50 md:hidden"
            >
              <IconeMenu />
            </button>

            <div className="min-w-0">
              <p className="truncate text-xs text-navy-400">{atual?.grupo}</p>
              {/* O h1 vive aqui, não em cada página: é o título que o leitor de
                  tela anuncia ao trocar de seção, e ele já muda com a rota. */}
              <h1 className="truncate font-display text-lg font-semibold text-navy-900">
                {atual?.rotulo}
              </h1>
            </div>
          </div>
        </header>

        {/* Limite de largura para telas grandes. Sem ele, a 1920px a linha
            fica larga demais e o olho perde a ligação entre a pessoa e o
            papel dela. A 1280 isto não muda nada.

            Centrado, e não encostado à esquerda: num monitor largo o conteúdo
            ficava num canto com meia tela de vazio ao lado. */}
        <main className="mx-auto w-full flex-1 px-5 py-8 lg:max-w-6xl lg:px-8">
          <Outlet />
        </main>
      </div>
    </div>
  )
}

/** Qual seção a URL está mostrando, com o grupo a que ela pertence. */
function useSecaoAtual() {
  const { pathname } = useLocation()
  const para = pathname.split('/')[2]
  const item = ITENS.find((i) => i.para === para)
  const grupo = GRUPOS.find((g) => g.itens.includes(item))
  return item && { ...item, grupo: grupo?.titulo }
}
