import { PERMISSOES, pode } from '../../lib/permissoes'

/**
 * A navegação do painel, em um lugar só.
 *
 * A barra lateral desenha os grupos a partir daqui, a barra superior descobre
 * o título da página aqui, e o App registra as rotas aqui. Manter três listas
 * em sincronia manualmente é como uma aba nova aparece sem título ou uma rota
 * fica sem link.
 */
/* ------------------------------------------------------------------ */
/* Ícones — sólidos, como o resto do painel.                           */
/*                                                                     */
/* Vêm antes de GRUPOS porque GRUPOS os referencia na avaliação do     */
/* módulo, e `const` não sobe. Na ordem inversa o arquivo lança        */
/* ReferenceError e o painel inteiro deixa de montar.                  */
/* ------------------------------------------------------------------ */

function svg(children) {
  return function Icone({ className = 'h-5 w-5' }) {
    return (
      <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" className={className}>
        {children}
      </svg>
    )
  }
}

const IconeUsuarios = svg(
  <>
    <path d="M4.5 6.375a4.125 4.125 0 1 1 8.25 0 4.125 4.125 0 0 1-8.25 0ZM14.25 8.625a3.375 3.375 0 1 1 6.75 0 3.375 3.375 0 0 1-6.75 0ZM1.5 19.125a7.125 7.125 0 0 1 14.25 0v.003l-.1.386a1.125 1.125 0 0 1-.567.71 13.06 13.06 0 0 1-6.458 1.676 13.06 13.06 0 0 1-6.458-1.676 1.125 1.125 0 0 1-.567-.71l-.1-.386Z" />
    <path d="M17.25 19.128c0 .414-.02.824-.062 1.227a6.7 6.7 0 0 0 3.174-.797 1.125 1.125 0 0 0 .587-.926 6.375 6.375 0 0 0-3.271-5.418 8.6 8.6 0 0 1-.428 5.914Z" />
  </>,
)

const IconePaciente = svg(
  <path
    fillRule="evenodd"
    d="M7.5 6a4.5 4.5 0 1 1 9 0 4.5 4.5 0 0 1-9 0ZM3.751 20.105a8.25 8.25 0 0 1 16.498 0 .75.75 0 0 1-.437.695A18.68 18.68 0 0 1 12 22.5c-2.786 0-5.433-.608-7.812-1.7a.75.75 0 0 1-.437-.695Z"
    clipRule="evenodd"
  />,
)

const IconeAnamnese = svg(
  <>
    <path d="M7.5 3.375c0-1.036.84-1.875 1.875-1.875h.375a3.75 3.75 0 0 1 3.75 3.75v1.875C13.5 8.161 14.34 9 15.375 9h1.875A3.75 3.75 0 0 1 21 12.75v3.375C21 17.16 20.16 18 19.125 18h-9.75A1.875 1.875 0 0 1 7.5 16.125V3.375Z" />
    <path d="M15 5.25a5.23 5.23 0 0 0-1.279-3.434 9.77 9.77 0 0 1 6.963 6.963A5.23 5.23 0 0 0 17.25 7.5h-1.875A.375.375 0 0 1 15 7.125V5.25ZM4.875 6H6v10.125A3.375 3.375 0 0 0 9.375 19.5H16.5v1.125c0 1.035-.84 1.875-1.875 1.875h-9.75A1.875 1.875 0 0 1 3 20.625V7.875C3 6.839 3.84 6 4.875 6Z" />
  </>,
)

export const IconeRecolher = svg(
  <path
    fillRule="evenodd"
    d="M7.72 12.53a.75.75 0 0 1 0-1.06l7.5-7.5a.75.75 0 1 1 1.06 1.06L9.31 12l6.97 6.97a.75.75 0 1 1-1.06 1.06l-7.5-7.5Z"
    clipRule="evenodd"
  />,
)

export const IconeMenu = svg(
  <path
    fillRule="evenodd"
    d="M3 6.75A.75.75 0 0 1 3.75 6h16.5a.75.75 0 0 1 0 1.5H3.75A.75.75 0 0 1 3 6.75Zm0 5.25a.75.75 0 0 1 .75-.75h16.5a.75.75 0 0 1 0 1.5H3.75a.75.75 0 0 1-.75-.75Zm0 5.25a.75.75 0 0 1 .75-.75h16.5a.75.75 0 0 1 0 1.5H3.75a.75.75 0 0 1-.75-.75Z"
    clipRule="evenodd"
  />,
)

/**
 * Sair, do @heroicons/react.
 *
 * Vem do pacote e não copiado à mão como os outros deste arquivo: o caminho
 * transcrito errado não dá erro, só desenha torto, e ninguém percebe até
 * olhar de perto.
 *
 * É a porta com seta saindo, não o símbolo de liga-desliga. O de energia lê
 * como "desligar o computador"; aqui a ação é sair da conta e o painel
 * continua no ar — numa clínica onde o mesmo aparelho passa por várias
 * pessoas no dia, essa diferença decide se alguém clica ou não.
 */
export { ArrowRightStartOnRectangleIcon as IconeSair } from '@heroicons/react/24/solid'

export const GRUPOS = [
  {
    titulo: 'Administração',
    itens: [
      {
        para: 'usuarios',
        rotulo: 'Usuários',
        Icone: IconeUsuarios,
        permissao: 'usuarios',
        roles: PERMISSOES.usuarios,
      },
    ],
  },
  {
    titulo: 'Operação',
    itens: [
      {
        para: 'pacientes',
        rotulo: 'Pacientes',
        Icone: IconePaciente,
        permissao: 'pacientes',
        roles: PERMISSOES.pacientes,
      },
      {
        para: 'anamnese',
        rotulo: 'Anamnese',
        Icone: IconeAnamnese,
        permissao: 'anamnese',
        roles: PERMISSOES.anamnese,
      },
    ],
  },
]

export const ITENS = GRUPOS.flatMap((g) => g.itens)

/**
 * Para onde /dashboard sozinho manda.
 *
 * Não é o primeiro item da lista de propósito. Administração vem antes na
 * barra porque é a ordem do desenho, mas quem abre o painel todo dia vai ver
 * paciente, não gerenciar acesso.
 */
export const PRIMEIRA = 'pacientes'

export function gruposDoUsuario(usuario) {
  return GRUPOS.map((grupo) => ({
    ...grupo,
    itens: grupo.itens.filter((item) => pode(usuario, item.permissao)),
  })).filter((grupo) => grupo.itens.length > 0)
}

export function primeiraDoUsuario(usuario) {
  return gruposDoUsuario(usuario)[0]?.itens[0]?.para ?? PRIMEIRA
}
