import { useState } from 'react'
import { anamnesesDoPaciente, criarAnamnese, situacaoDa } from '../../lib/anamneses'
import { criarPaciente, nomeCompleto, pacientePorNome } from '../../lib/pacientes'
import Dialogo, { AcoesDoDialogo } from '../../components/painel/Dialogo'
import ConviteDaAnamnese from '../../components/painel/ConviteDaAnamnese'
import Botao from '../../components/painel/Botao'
import Field from '../../components/Field'
import { useSession } from '../../lib/session'

/**
 * Nova anamnese, em passos.
 *
 * O cadastro mínimo agora é só nome e sobrenome. Se já houver uma ficha com o
 * mesmo nome completo, a tela reaproveita o paciente existente; se não houver,
 * cria a ficha e já gera o link.
 */
export default function DialogoNova({ aberto, aoFechar, aoCriar }) {
  return (
    <Dialogo aberto={aberto} aoFechar={aoFechar} titulo="Nova anamnese">
      {aberto && <Fluxo aoFechar={aoFechar} aoCriar={aoCriar} />}
    </Dialogo>
  )
}

function Fluxo({ aoFechar, aoCriar }) {
  const { usuario } = useSession()
  const [passo, setPasso] = useState('dados')
  const [nome, setNome] = useState('')
  const [sobrenome, setSobrenome] = useState('')

  const [paciente, setPaciente] = useState(null)
  const [pendente, setPendente] = useState(null)
  const [convite, setConvite] = useState(null)

  const [ocupado, setOcupado] = useState(false)
  const [erro, setErro] = useState(null)

  const podeEnviar = nome.trim() !== '' && sobrenome.trim() !== '' && !ocupado

  async function comTratamento(acao) {
    setOcupado(true)
    setErro(null)
    try {
      await acao()
    } catch (e) {
      setErro(e.message)
    } finally {
      setOcupado(false)
    }
  }

  const criarOuPreparar = (event) => {
    event.preventDefault()
    if (!podeEnviar) return

    return comTratamento(async () => {
      const dados = { nome: nome.trim(), sobrenome: sobrenome.trim() }
      const achado = await pacientePorNome(dados)
      if (!achado) {
        const novo = await criarPaciente(dados)
        const anamnese = await criarAnamnese(novo.id, usuario.nome)
        await aoCriar()
        setConvite({ token: anamnese.token, nome: nomeCompleto(novo) })
        setPasso('convite')
        return
      }

      setPaciente(achado)
      // Uma anamnese pendente já é um link válido. Criar outra daria dois
      // links para a mesma pessoa e nenhum jeito de saber qual ela abriu —
      // então o caminho aqui é mostrar o que já existe, não fazer mais um.
      const doPaciente = await anamnesesDoPaciente(achado.id)
      // Só conta a que ainda vale: link expirado não é link.
      setPendente(doPaciente.find((a) => situacaoDa(a) === 'pendente') ?? null)
      setPasso('existente')
    })
  }

  const criarParaExistente = () =>
    comTratamento(async () => {
      const anamnese = await criarAnamnese(paciente.id, usuario.nome)
      await aoCriar()
      setConvite({ token: anamnese.token, nome: nomeCompleto(paciente) })
      setPasso('convite')
    })

  const mostrarPendente = () => {
    setConvite({ token: pendente.token, nome: nomeCompleto(paciente) })
    setPasso('convite')
  }

  const Erro = () =>
    erro && (
      <p role="alert" className="rounded-lg bg-red-50 px-3.5 py-3 text-sm text-red-800">
        {erro}
      </p>
    )

  /* ---------------------------------------------------------------- */

  if (passo === 'convite') {
    return (
      <>
        <ConviteDaAnamnese token={convite.token} nome={primeiroNome(convite.nome)} />
        <AcoesDoDialogo>
          <Botao variante="primario" onClick={aoFechar}>
            Concluir
          </Botao>
        </AcoesDoDialogo>
      </>
    )
  }

  if (passo === 'existente') {
    return (
      <>
        {/* `role="alert"` porque a tela mudou sem a pessoa ter pedido: ela
            apertou "continuar" e recebeu uma resposta no lugar do próximo
            campo. */}
        <div
          role="alert"
          className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3.5 text-sm leading-relaxed text-amber-900"
        >
          <p className="font-display font-semibold">Esse paciente já está cadastrado.</p>
          <p className="mt-1">{nomeCompleto(paciente)}</p>
          <p className="mt-2">
            {pendente
              ? 'Já existe uma anamnese em espera. O link continua valendo — mostre o mesmo em vez de criar outro.'
              : 'Seguir cria uma anamnese nova para essa pessoa. As anteriores continuam no histórico.'}
          </p>
        </div>

        <div className="mt-4">
          <Erro />
        </div>

        <AcoesDoDialogo>
          <Botao onClick={() => setPasso('dados')} disabled={ocupado}>
            Voltar
          </Botao>

          {pendente ? (
            <Botao variante="primario" onClick={mostrarPendente}>
              Mostrar link
            </Botao>
          ) : (
            <Botao variante="primario" onClick={criarParaExistente} disabled={ocupado}>
              {ocupado ? 'Criando…' : 'Atualizar anamnese'}
            </Botao>
          )}
        </AcoesDoDialogo>
      </>
    )
  }

  return (
    <form onSubmit={criarOuPreparar} noValidate className="flex flex-col gap-4">
      <p className="text-sm leading-relaxed text-navy-500">
        Informe nome e sobrenome para gerar o link da anamnese.
      </p>

      <Field label="Nome" value={nome} onChange={setNome} disabled={ocupado} autoFocus />
      <Field label="Sobrenome" value={sobrenome} onChange={setSobrenome} disabled={ocupado} />

      <Erro />

      <AcoesDoDialogo>
        <Botao type="button" onClick={aoFechar} disabled={ocupado}>
          Cancelar
        </Botao>
        <Botao type="submit" variante="primario" disabled={!podeEnviar}>
          {ocupado ? 'Criando…' : 'Criar anamnese'}
        </Botao>
      </AcoesDoDialogo>
    </form>
  )
}

function primeiroNome(nome = '') {
  return nome.trim().split(/\s+/)[0]
}
