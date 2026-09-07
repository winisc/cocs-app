import { useState } from 'react'
import { PAPEIS, PAPEL_PADRAO, aprovarSolicitacao, recusarSolicitacao } from '../../lib/usuarios'
import Dialogo, { AcoesDoDialogo, useUltimo } from '../../components/painel/Dialogo'
import Botao from '../../components/painel/Botao'
import BotaoIcone, { IconeAprovar, IconeRecusar } from '../../components/painel/BotaoIcone'
import Tabela, { Acoes, Celula, Pessoa } from '../../components/painel/Tabela'
import Select from '../../components/painel/Select'
import { Vazio, useUsuarios } from './Secao'
import { useTitulo } from '../../lib/titulo'

/**
 * Quem se cadastra na tela pública entra aqui, não na lista de usuários.
 *
 * A solicitação não escolhe o próprio papel: quem aprova é que decide. Deixar
 * o pedido escolher seria o mesmo que não ter aprovação nenhuma.
 */
export default function Solicitacoes() {
  useTitulo('Solicitações de acesso')

  const { solicitacoes, busca, recarregar } = useUsuarios()
  const [aprovando, setAprovando] = useState(null)
  const [recusando, setRecusando] = useState(null)

  if (solicitacoes.length === 0) {
    return (
      <Vazio>
        {busca
          ? `Nenhuma solicitação encontrada para “${busca}”.`
          : 'Nenhuma solicitação pendente.'}
      </Vazio>
    )
  }

  return (
    <>
      <Tabela
        colunas={[
          { rotulo: 'Solicitante' },
          // A data some abaixo de 640px: entre saber o dia do pedido e ver o
          // nome inteiro de quem pediu, o nome ganha.
          { rotulo: 'Pedido em', largura: 'w-36', some: true },
          { rotulo: 'Ações', largura: 'w-[5.75rem]', direita: true },
        ]}
      >
        {solicitacoes.map((s) => (
          <tr key={s.id} className="transition-colors hover:bg-navy-50/50">
            <Celula>
              <Pessoa nome={s.nome} email={s.email} />
            </Celula>

            <Celula some className="text-xs text-navy-400">
              {formatarData(s.pedidoEm)}
            </Celula>

            <Celula direita>
              <Acoes>
                <BotaoIcone
                  variante="positivo"
                  rotulo={`Aprovar ${s.nome}`}
                  onClick={() => setAprovando(s)}
                >
                  <IconeAprovar />
                </BotaoIcone>

                <BotaoIcone
                  variante="perigo"
                  rotulo={`Recusar ${s.nome}`}
                  onClick={() => setRecusando(s)}
                >
                  <IconeRecusar />
                </BotaoIcone>
              </Acoes>
            </Celula>
          </tr>
        ))}
      </Tabela>

      <DialogoDeAprovacao
        solicitacao={aprovando}
        aoFechar={() => setAprovando(null)}
        aoAprovar={recarregar}
      />

      <DialogoDeRecusa
        solicitacao={recusando}
        aoFechar={() => setRecusando(null)}
        aoRecusar={recarregar}
      />
    </>
  )
}

function DialogoDeAprovacao({ solicitacao, aoFechar, aoAprovar }) {
  // Mantém o conteúdo enquanto a caixa sai de cena.
  const ultimo = useUltimo(solicitacao)
  return (
    <Dialogo
      aberto={Boolean(solicitacao)}
      aoFechar={aoFechar}
      titulo="Aprovar acesso"
      descricao={ultimo && `${ultimo.nome} passa a entrar no painel.`}
    >
      {ultimo && (
        <FormularioDeAprovacao
          key={ultimo.id}
          solicitacao={ultimo}
          aoFechar={aoFechar}
          aoAprovar={aoAprovar}
        />
      )}
    </Dialogo>
  )
}

function FormularioDeAprovacao({ solicitacao, aoFechar, aoAprovar }) {
  const [papel, setPapel] = useState(PAPEL_PADRAO)
  const [salvando, setSalvando] = useState(false)
  const [erro, setErro] = useState(null)

  async function enviar(event) {
    event.preventDefault()
    setSalvando(true)
    setErro(null)
    try {
      await aprovarSolicitacao(solicitacao.id, papel)
      await aoAprovar()
      aoFechar()
    } catch (e) {
      setErro(e.message)
      setSalvando(false)
    }
  }

  return (
    <form onSubmit={enviar} className="flex flex-col gap-4">
      <Select
        label="Papel"
        value={papel}
        onChange={setPapel}
        opcoes={PAPEIS.map((p) => ({ id: p.id, rotulo: p.rotulo }))}
        disabled={salvando}
        dica={PAPEIS.find((p) => p.id === papel)?.descricao}
      />

      {erro && (
        <p role="alert" className="rounded-lg bg-red-50 px-3.5 py-3 text-sm text-red-800">
          {erro}
        </p>
      )}

      <AcoesDoDialogo>
        <Botao type="button" onClick={aoFechar} disabled={salvando}>
          Cancelar
        </Botao>
        <Botao type="submit" variante="primario" disabled={salvando}>
          {salvando ? 'Aprovando…' : 'Aprovar'}
        </Botao>
      </AcoesDoDialogo>
    </form>
  )
}

function DialogoDeRecusa({ solicitacao, aoFechar, aoRecusar }) {
  // Mantém o conteúdo enquanto a caixa sai de cena.
  const ultimo = useUltimo(solicitacao)
  const [salvando, setSalvando] = useState(false)
  const [erro, setErro] = useState(null)

  async function confirmar() {
    setSalvando(true)
    setErro(null)
    try {
      await recusarSolicitacao(solicitacao.id)
      await aoRecusar()
      aoFechar()
    } catch (e) {
      setErro(e.message)
    } finally {
      setSalvando(false)
    }
  }

  return (
    <Dialogo
      aberto={Boolean(solicitacao)}
      aoFechar={aoFechar}
      titulo="Recusar solicitação"
      descricao={
        ultimo && `O pedido de ${ultimo.nome} sai da lista. A pessoa pode pedir acesso de novo.`
      }
    >
      {erro && (
        <p role="alert" className="rounded-lg bg-red-50 px-3.5 py-3 text-sm text-red-800">
          {erro}
        </p>
      )}

      <AcoesDoDialogo>
        <Botao onClick={aoFechar} disabled={salvando}>
          Cancelar
        </Botao>
        <Botao variante="perigo" onClick={confirmar} disabled={salvando}>
          {salvando ? 'Recusando…' : 'Recusar'}
        </Botao>
      </AcoesDoDialogo>
    </Dialogo>
  )
}

/** Data em ISO vira dd/mm sem depender de fuso: a string já é a data certa. */
function formatarData(iso) {
  const [ano, mes, dia] = iso.split('-')
  return `${dia}/${mes}/${ano}`
}
