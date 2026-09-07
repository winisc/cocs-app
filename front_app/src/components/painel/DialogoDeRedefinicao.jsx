import { useEffect, useState } from 'react'
import { criarRedefinicao, tempoRestante } from '../../lib/redefinicoes'
import Botao from './Botao'
import Dialogo, { AcoesDoDialogo, useUltimo } from './Dialogo'
import LinkParaCopiar from './LinkParaCopiar'

/**
 * Gera o link de nova senha para um usuário e mostra uma vez só.
 *
 * O link nasce ao abrir o diálogo, não ao confirmar: não há o que confirmar —
 * gerar não estraga nada, e o passo a mais só atrasaria quem já decidiu. O que
 * ele derruba é o link anterior da mesma pessoa, e isso a tela avisa.
 */
export default function DialogoDeRedefinicao({ usuario, aoFechar }) {
  const atual = useUltimo(usuario)

  const [link, setLink] = useState(null)
  const [erro, setErro] = useState(null)
  const [gerando, setGerando] = useState(false)

  useEffect(() => {
    if (!usuario) return undefined

    let vivo = true
    setGerando(true)
    setErro(null)
    setLink(null)

    criarRedefinicao(usuario.id)
      .then((redefinicao) => vivo && setLink(redefinicao))
      .catch((e) => vivo && setErro(e.message))
      .finally(() => vivo && setGerando(false))

    return () => {
      vivo = false
    }
  }, [usuario])

  if (!atual) return null

  return (
    <Dialogo
      aberto={Boolean(usuario)}
      aoFechar={aoFechar}
      titulo="Redefinir senha"
      descricao={`${atual.nome} escolhe a senha nova pelo link abaixo.`}
    >
      {gerando && <p className="text-sm text-navy-500">Gerando o link…</p>}

      {erro && (
        <p role="alert" className="rounded-lg bg-red-50 px-3.5 py-3 text-sm text-red-800">
          {erro}
        </p>
      )}

      {link && (
        <div>
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
            <li>Se {atual.nome} já tinha um link em aberto, aquele deixou de valer.</li>
          </ul>
        </div>
      )}

      <AcoesDoDialogo>
        <Botao variante="primario" onClick={aoFechar} disabled={gerando}>
          Concluir
        </Botao>
      </AcoesDoDialogo>
    </Dialogo>
  )
}
