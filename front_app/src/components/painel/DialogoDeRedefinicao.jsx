import { useEffect, useState } from 'react'
import { criarRedefinicao, tempoRestante } from '../../lib/redefinicoes'
import Botao from './Botao'
import Dialogo, { AcoesDoDialogo, useUltimo } from './Dialogo'
import LinkParaCopiar from './LinkParaCopiar'

/**
 * Gera o link de nova senha para um usuário e mostra uma vez só.
 *
 * Em dois passos: confirmar, depois o link. Gerar não é inofensivo — derruba
 * o link anterior da mesma pessoa, e um clique errado na lista deixaria a
 * recepção com um QR que parou de funcionar sem ninguém saber por quê.
 */
export default function DialogoDeRedefinicao({ usuario, aoFechar }) {
  const atual = useUltimo(usuario)

  const [link, setLink] = useState(null)
  const [erro, setErro] = useState(null)
  const [gerando, setGerando] = useState(false)

  // Cada abertura recomeça do zero: sem isto, reabrir para outra pessoa
  // mostraria o link do anterior por um quadro.
  useEffect(() => {
    if (!usuario) return
    setLink(null)
    setErro(null)
    setGerando(false)
  }, [usuario])

  if (!atual) return null

  async function gerar() {
    setGerando(true)
    setErro(null)
    try {
      setLink(await criarRedefinicao(atual.id))
    } catch (e) {
      setErro(e.message)
    } finally {
      setGerando(false)
    }
  }

  return (
    <Dialogo
      aberto={Boolean(usuario)}
      aoFechar={aoFechar}
      titulo={link ? 'Link gerado' : 'Redefinir senha'}
      descricao={
        link
          ? `${atual.nome} escolhe a senha nova pelo link abaixo.`
          : `Vai ser gerado um link para ${atual.nome} escolher uma senha nova.`
      }
    >
      {erro && (
        <p role="alert" className="mb-4 rounded-lg bg-red-50 px-3.5 py-3 text-sm text-red-800">
          {erro}
        </p>
      )}

      {link ? (
        <>
          <LinkParaCopiar
            url={`${window.location.origin}/redefinir-senha/${link.token}`}
            id="link-de-redefinicao"
            rotulo="Link para redefinir a senha"
          />

          {/* As três coisas que a pessoa precisa saber antes de fechar. A do
              meio é a que dói: fechando sem copiar, não há como recuperar. */}
          <ul className="mt-4 space-y-2 rounded-lg bg-navy-50 px-3.5 py-3 text-sm leading-relaxed text-navy-600">
            <li>Vale por {tempoRestante(link.expiraEm)} e serve uma vez só.</li>
            <li>Copie agora: fechando esta janela, o link não aparece de novo.</li>
            <li>A senha atual de {atual.nome} continua valendo até ele usar o link.</li>
          </ul>

          <AcoesDoDialogo>
            <Botao variante="primario" onClick={aoFechar}>
              Concluir
            </Botao>
          </AcoesDoDialogo>
        </>
      ) : (
        <>
          <ul className="space-y-2 rounded-lg bg-navy-50 px-3.5 py-3 text-sm leading-relaxed text-navy-600">
            <li>O link vale por uma hora e serve uma vez só.</li>
            <li>Se {atual.nome} já tinha um link em aberto, aquele deixa de valer.</li>
            <li>A senha atual continua funcionando até ele escolher outra.</li>
          </ul>

          <AcoesDoDialogo>
            <Botao onClick={aoFechar} disabled={gerando}>
              Cancelar
            </Botao>
            <Botao variante="primario" onClick={gerar} disabled={gerando}>
              {gerando ? 'Gerando…' : 'Gerar link'}
            </Botao>
          </AcoesDoDialogo>
        </>
      )}
    </Dialogo>
  )
}
