/**
 * Botão só de ícone, para ações que se repetem em cada linha de uma lista.
 *
 * O rótulo vira `aria-label` e `title`: sem texto na tela, é a única coisa
 * que diz o que o botão faz — para quem usa leitor de tela e para quem passa
 * o mouse e hesita.
 *
 * 36px de alvo. Abaixo disso o dedo erra, e errar aqui significa abrir o
 * diálogo de excluir quando se queria editar.
 */

/**
 * Cada ação com a sua cor: numa lista longa é o que deixa achar "aprovar" ou
 * "excluir" sem ler rótulo nenhum.
 *
 * O tom é o escuro da paleta, não o vivo. Com uma linha por pessoa, o vivo
 * repetido quatro vezes vira ruído e passa na frente dos nomes. O fundo só
 * aparece no hover, para o alvo ficar evidente na hora de clicar.
 */
const ESTILOS = {
  neutro: 'text-navy-500 hover:bg-navy-100 hover:text-navy-800',
  positivo: 'text-mint-600 hover:bg-mint-50 hover:text-mint-800',
  perigo: 'text-red-600 hover:bg-red-50 hover:text-red-800',
}

export default function BotaoIcone({ rotulo, variante = 'neutro', className = '', ...rest }) {
  return (
    <button
      type="button"
      aria-label={rotulo}
      title={rotulo}
      // O tamanho do ícone é do botão, não de cada ícone. Os desenhados aqui
      // traziam um padrão embutido; os que vêm do @heroicons/react não trazem
      // nada e saíam a 36px, com os três lado a lado em tamanhos diferentes.
      // Definindo no botão, qualquer ícone entra do mesmo tamanho.
      className={`flex h-9 w-9 shrink-0 cursor-pointer items-center justify-center rounded-lg transition-colors [&_svg]:h-4.5 [&_svg]:w-4.5 disabled:cursor-not-allowed disabled:text-navy-200 disabled:hover:bg-transparent ${ESTILOS[variante]} ${className}`}
      {...rest}
    />
  )
}

function svg(children) {
  return function Icone({ className = '' }) {
    return (
      <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" className={className}>
        {children}
      </svg>
    )
  }
}

export const IconeEditar = svg(
  <>
    <path d="M21.73 2.27a2.625 2.625 0 0 0-3.71 0l-1.16 1.16 3.71 3.71 1.16-1.16a2.625 2.625 0 0 0 0-3.71Z" />
    <path d="M19.51 8.2 15.8 4.49 3.65 16.64a5.25 5.25 0 0 0-1.32 2.21l-.8 2.69a.75.75 0 0 0 .93.93l2.69-.8a5.25 5.25 0 0 0 2.21-1.32L19.51 8.2Z" />
  </>,
)

export const IconeExcluir = svg(
  <path
    fillRule="evenodd"
    d="M16.5 4.48v.23c1.3.1 2.6.27 3.88.51a.75.75 0 1 1-.26 1.48l-.21-.04-1 13.07a3 3 0 0 1-3 2.77H8.08a3 3 0 0 1-2.99-2.77l-1-13.07-.21.04a.75.75 0 0 1-.26-1.48c1.28-.24 2.57-.41 3.88-.51v-.23c0-1.56 1.21-2.9 2.82-2.95a52.7 52.7 0 0 1 3.37 0c1.6.05 2.81 1.39 2.81 2.95Zm-6.14-1.45a51.2 51.2 0 0 1 3.28 0c.75.02 1.36.66 1.36 1.45v.11a49.5 49.5 0 0 0-6 0v-.11c0-.79.61-1.43 1.36-1.45Zm-.35 5.95a.75.75 0 1 0-1.5.05l.35 9a.75.75 0 1 0 1.5-.05l-.35-9Zm5.48.05a.75.75 0 1 0-1.5-.05l-.35 9a.75.75 0 0 0 1.5.05l.35-9Z"
    clipRule="evenodd"
  />,
)

/**
 * Círculo em volta do check e do x de propósito: soltos, os dois riscos são
 * genéricos demais e podem passar por "concluído" e "fechar". Com o disco,
 * leem como um par de decisão — aprovar ou recusar.
 */
export const IconeAprovar = svg(
  <path
    fillRule="evenodd"
    d="M2.25 12a9.75 9.75 0 1 1 19.5 0 9.75 9.75 0 0 1-19.5 0Zm13.36-1.81a.75.75 0 1 0-1.22-.88l-3.24 4.53-1.62-1.62a.75.75 0 0 0-1.06 1.06l2.25 2.25a.75.75 0 0 0 1.14-.1l3.75-5.24Z"
    clipRule="evenodd"
  />,
)

export const IconeRecusar = svg(
  <path
    fillRule="evenodd"
    d="M12 2.25a9.75 9.75 0 1 0 0 19.5 9.75 9.75 0 0 0 0-19.5Zm-1.72 6.97a.75.75 0 1 0-1.06 1.06L10.94 12l-1.72 1.72a.75.75 0 1 0 1.06 1.06L12 13.06l1.72 1.72a.75.75 0 1 0 1.06-1.06L13.06 12l1.72-1.72a.75.75 0 1 0-1.06-1.06L12 10.94l-1.72-1.72Z"
    clipRule="evenodd"
  />,
)

/**
 * Ver anamnese. Vem do @heroicons/react, como o ícone de sair — caminho de
 * SVG transcrito à mão não dá erro, só desenha torto.
 */
export { ClipboardDocumentListIcon as IconeAnamnese } from '@heroicons/react/24/solid'
