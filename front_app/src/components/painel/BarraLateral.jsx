import { NavLink } from 'react-router-dom'
import { useSession } from '../../lib/session'
import { gruposDoUsuario, IconeRecolher, IconeSair } from './navegacao'

/**
 * Barra lateral do painel.
 *
 * Dois estados independentes, cada um com um trabalho:
 *  - `recolhida` encolhe a barra para só os ícones, no desktop;
 *  - `aberta` traz a barra por cima do conteúdo, no celular.
 *
 * Já tentei um estado só para as duas coisas: o mesmo botão passava a
 * significar "encolher" numa largura e "aparecer" na outra, e o resultado é
 * uma barra que abre encolhida.
 */
export default function BarraLateral({ recolhida, aoRecolher, aberta, aoFechar }) {
  const { usuario, sair } = useSession()
  const grupos = gruposDoUsuario(usuario)

  return (
    <>
      {/* No celular a barra cobre o conteúdo; o véu fecha ao toque e serve de
          alvo grande, que é como as pessoas fecham gaveta sem procurar o X. */}
      {aberta && (
        <div
          onClick={aoFechar}
          aria-hidden="true"
          className="fixed inset-0 z-30 bg-navy-950/40 md:hidden"
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-40 flex flex-col border-r border-navy-100 bg-white transition-[width,transform] duration-200 md:sticky md:top-0 md:h-dvh md:translate-x-0 ${
          recolhida ? 'w-[4.5rem]' : 'w-64'
        } ${aberta ? 'translate-x-0' : '-translate-x-full'}`}
      >
        <div
          className={`flex h-16 shrink-0 items-center border-b border-navy-100 ${
            recolhida ? 'justify-center px-2' : 'px-5'
          }`}
        >
          <img
            src="/logo.png"
            alt="COCS Odontologia"
            width={229}
            height={98}
            className={recolhida ? 'h-7 w-7 object-contain object-left' : 'h-8 w-auto'}
          />
        </div>

        {/* `overflow-x-hidden` junto: `overflow-y: auto` sozinho faz o
            navegador computar o eixo X como `auto` também. Enquanto a barra
            se expande, os rótulos já apareceram mas a largura ainda está
            animando — o conteúdo tem 129px numa caixa de 71px e uma barra de
            rolagem horizontal pisca por uns quadros. Não há nada para ver de
            lado aqui. */}
        <nav
          aria-label="Seções do painel"
          className="flex-1 overflow-y-auto overflow-x-hidden py-5"
        >
          {grupos.map((grupo) => (
            <div key={grupo.titulo} className="mb-5">
              {/* O título do grupo some quando a barra encolhe, mas continua
                  no HTML: é ele que agrupa os links para o leitor de tela. */}
              <p
                className={`px-5 font-display text-[10px] font-semibold tracking-[0.12em] text-navy-300 uppercase ${
                  recolhida ? 'sr-only' : ''
                }`}
              >
                {grupo.titulo}
              </p>

              <ul className={recolhida ? '' : 'mt-2'}>
                {grupo.itens.map(({ para, rotulo, Icone }) => (
                  <li key={para}>
                    <NavLink
                      to={para}
                      onClick={aoFechar}
                      title={recolhida ? rotulo : undefined}
                      className={({ isActive }) =>
                        `mx-2 flex items-center gap-3 rounded-lg py-2.5 font-display text-sm font-medium transition-colors ${
                          recolhida ? 'justify-center px-2' : 'px-3'
                        } ${
                          isActive
                            ? 'bg-mint-50 text-mint-800'
                            : 'text-navy-500 hover:bg-navy-50 hover:text-navy-800'
                        }`
                      }
                    >
                      <Icone className="h-5 w-5 shrink-0" />
                      <span className={recolhida ? 'sr-only' : ''}>{rotulo}</span>
                    </NavLink>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </nav>

        <button
          type="button"
          onClick={aoRecolher}
          aria-label={recolhida ? 'Expandir menu' : 'Recolher menu'}
          aria-pressed={recolhida}
          className="cursor-pointer mx-2 hidden h-8 w-8 items-center justify-center self-end rounded-lg border border-navy-200 bg-white text-navy-400 transition-colors hover:text-navy-700 md:flex"
        >
          <IconeRecolher
            className={`h-4 w-4 transition-transform ${recolhida ? 'rotate-180' : ''}`}
          />
        </button>

        {/* Recolhida, o cartão vira coluna. Antes o botão de sair era escondido
            junto com o nome e o e-mail — e aí não havia como sair sem antes
            expandir a barra, o que ninguém adivinha. */}
        <div
          className={`mt-3 flex shrink-0 border-t border-navy-100 py-4 ${
            recolhida ? 'flex-col items-center gap-2 px-2' : 'items-center gap-3 px-4'
          }`}
        >
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-navy-900 font-display text-xs font-semibold text-white">
            {iniciais(usuario.nome)}
          </span>

          {!recolhida && (
            <div className="min-w-0 flex-1">
              {/* `truncate` porque e-mail longo empurra o botão de sair para
                  fora da barra, e aí não há como sair. */}
              <p className="truncate font-display text-sm font-medium text-navy-800">
                {usuario.nome}
              </p>
              <p className="truncate text-xs text-navy-400">{usuario.email}</p>
            </div>
          )}

          <button
            type="button"
            onClick={sair}
            aria-label="Sair"
            title="Sair"
            className="flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center rounded-lg text-red-600 transition-colors hover:bg-red-50 hover:text-red-700"
          >
            <IconeSair className="h-4 w-4" />
          </button>
        </div>
      </aside>
    </>
  )
}

/** Duas letras bastam para o avatar; mais que isso não cabe no círculo. */
function iniciais(nome = '') {
  const partes = nome.trim().split(/\s+/)
  const primeira = partes[0]?.[0] ?? ''
  const ultima = partes.length > 1 ? partes[partes.length - 1][0] : ''
  return (primeira + ultima).toUpperCase()
}
