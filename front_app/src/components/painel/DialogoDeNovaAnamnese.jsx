import { useState } from 'react'
import { criarAnamnese } from '../../lib/anamneses'
import { nomeCompleto } from '../../lib/pacientes'
import Botao from './Botao'
import Dialogo, { AcoesDoDialogo } from './Dialogo'
import ConviteDaAnamnese from './ConviteDaAnamnese'

/**
 * Gera uma anamnese nova para um paciente e mostra o convite.
 *
 * Mora aqui porque duas telas pedem a mesma coisa: o histórico, quando a
 * recepção quer atualizar, e a ficha do paciente, quando abre e não há nada
 * respondido. Fosse um dos dois donos, o outro copiaria.
 */
export default function DialogoDeNovaAnamnese({
  aberto,
  paciente,
  autor,
  titulo = 'Atualizar anamnese',
  aoFechar,
  aoCriar,
}) {
  const [salvando, setSalvando] = useState(false)
  const [criada, setCriada] = useState(null)
  const [erro, setErro] = useState(null)

  async function confirmar() {
    setSalvando(true)
    setErro(null)
    try {
      const anamnese = await criarAnamnese(paciente.id, autor)
      await aoCriar()
      // Mostra o link em vez de fechar: é para isso que a anamnese foi criada.
      setCriada(anamnese)
    } catch (e) {
      setErro(e.message)
    } finally {
      setSalvando(false)
    }
  }

  function fechar() {
    setCriada(null)
    aoFechar()
  }

  return (
    <Dialogo
      aberto={aberto}
      aoFechar={fechar}
      titulo={criada ? 'Anamnese criada' : titulo}
      descricao={
        criada
          ? undefined
          : `Será gerado um novo link para ${nomeCompleto(paciente)} responder. As anamneses anteriores continuam no histórico.`
      }
    >
      {criada ? (
        <>
          <ConviteDaAnamnese token={criada.token} nome={primeiroNome(nomeCompleto(paciente))} />
          <AcoesDoDialogo>
            <Botao variante="primario" onClick={fechar}>
              Concluir
            </Botao>
          </AcoesDoDialogo>
        </>
      ) : (
        <>
          {erro && (
            <p role="alert" className="rounded-lg bg-red-50 px-3.5 py-3 text-sm text-red-800">
              {erro}
            </p>
          )}

          <AcoesDoDialogo>
            <Botao onClick={fechar} disabled={salvando}>
              Cancelar
            </Botao>
            <Botao variante="primario" onClick={confirmar} disabled={salvando}>
              {salvando ? 'Criando…' : 'Criar'}
            </Botao>
          </AcoesDoDialogo>
        </>
      )}
    </Dialogo>
  )
}

function primeiroNome(nome = '') {
  return nome.trim().split(/\s+/)[0]
}
