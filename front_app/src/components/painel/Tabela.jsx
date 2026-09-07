/**
 * Tabela das listas do painel.
 *
 * A versão anterior era uma linha flex com o nome à esquerda e as ações à
 * direita. No celular ficava bem, porque tudo estava perto; no desktop
 * sobravam quase mil pixels de vazio no meio e o olho precisava atravessar a
 * tela para ligar a pessoa ao papel dela.
 *
 * O que resolve não é fechar o espaço, é dar estrutura a ele: cabeçalho de
 * coluna, colunas alinhadas entre as linhas e um avatar ancorando a borda
 * esquerda — o mesmo desenho das listas de membros de GitHub, Linear e Slack.
 *
 * É <table> de verdade, não grid: são dados tabulares, e o cabeçalho ligado a
 * cada célula é o que faz o leitor de tela anunciar "Papel: Dentista" em vez
 * de só "Dentista".
 */
export default function Tabela({ colunas, children }) {
  return (
    <div className="overflow-hidden rounded-xl border border-navy-100 bg-white">
      {/* `table-fixed` é o que faz o truncate funcionar. Em `table-auto` a
          coluna cresce até caber o e-mail inteiro, a tabela fica mais larga
          que a tela e o card, que tem overflow-hidden, corta a coluna de
          ações fora — sem barra de rolagem, sem aviso, só sumindo. */}
      <table className="w-full table-fixed text-left">
        <thead>
          <tr className="border-b border-navy-100 bg-navy-50/60">
            {colunas.map((coluna) => (
              <th
                key={coluna.rotulo}
                scope="col"
                className={`px-4 py-2.5 font-display text-[11px] font-semibold tracking-[0.08em] text-navy-400 uppercase ${
                  coluna.largura ?? ''
                } ${coluna.direita ? 'text-right' : ''} ${coluna.some ? 'hidden sm:table-cell' : ''}`}
              >
                {coluna.rotulo}
              </th>
            ))}
          </tr>
        </thead>

        <tbody className="divide-y divide-navy-100">{children}</tbody>
      </table>
    </div>
  )
}

export function Celula({ direita = false, some = false, className = '', children }) {
  return (
    <td
      className={`px-4 py-3 align-middle ${direita ? 'text-right' : ''} ${
        some ? 'hidden sm:table-cell' : ''
      } ${className}`}
    >
      {children}
    </td>
  )
}

/**
 * Pessoa: avatar, nome e e-mail.
 *
 * O avatar existe para ancorar a borda esquerda. Sem ele a linha começa em
 * texto solto e as linhas deixam de ler como uma lista.
 */
export function Pessoa({ nome, email, sufixo, abaixo }) {
  return (
    <div className="flex items-center gap-3">
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-navy-100 font-display text-xs font-semibold text-navy-600">
        {iniciais(nome)}
      </span>

      <div className="min-w-0">
        <p className="truncate font-display text-sm font-medium text-navy-800">
          {nome}
          {sufixo}
        </p>
        {email && <p className="truncate text-xs text-navy-400">{email}</p>}

        {/* Some no celular a coluna que não cabe, o conteúdo dela reaparece
            aqui embaixo. Esconder e pronto perderia o papel da pessoa, que é
            metade do motivo de a lista existir. */}
        {abaixo && <div className="mt-1.5 sm:hidden">{abaixo}</div>}
      </div>
    </div>
  )
}

export function Etiqueta({ children }) {
  return (
    <span className="rounded-full bg-navy-50 px-2.5 py-1 text-xs font-medium whitespace-nowrap text-navy-600">
      {children}
    </span>
  )
}

export function Acoes({ children }) {
  return <div className="flex justify-end gap-1">{children}</div>
}

function iniciais(nome = '') {
  const partes = nome.trim().split(/\s+/)
  const primeira = partes[0]?.[0] ?? ''
  const ultima = partes.length > 1 ? partes[partes.length - 1][0] : ''
  return (primeira + ultima).toUpperCase()
}
