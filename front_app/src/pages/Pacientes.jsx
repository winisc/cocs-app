import { useCallback, useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import {
  atualizarPaciente,
  excluirPaciente,
  filtrarPacientes,
  listarPacientes,
  nomeCompleto,
} from '../lib/pacientes'
import CampoDeBusca from '../components/painel/CampoDeBusca'
import Tabela, { Acoes, Celula, Pessoa } from '../components/painel/Tabela'
import BotaoIcone, {
  IconeAnamnese,
  IconeEditar,
  IconeExcluir,
} from '../components/painel/BotaoIcone'
import Dialogo, { AcoesDoDialogo, useUltimo } from '../components/painel/Dialogo'
import Botao from '../components/painel/Botao'
import Field from '../components/Field'
import { Aviso, Vazio } from './usuarios/Secao'
import { pode } from '../lib/permissoes'
import { useSession } from '../lib/session'

export default function Pacientes() {
  const navegar = useNavigate()
  const { usuario } = useSession()
  const podeGerenciarPacientes = pode(usuario, 'gerenciarPacientes')
  const podeExcluirPacientes = pode(usuario, 'excluirPacientes')

  // A busca mora na URL: recarregar mantém o filtro e dá para mandar o link
  // já filtrado. `replace` porque senão cada tecla vira um passo no histórico
  // e o botão voltar precisaria ser apertado uma vez por letra digitada.
  const [params, setParams] = useSearchParams()
  const busca = params.get('q') ?? ''
  const buscar = (termo) => {
    const proximo = new URLSearchParams(params)
    if (termo) proximo.set('q', termo)
    else proximo.delete('q')
    setParams(proximo, { replace: true })
  }

  const [pacientes, setPacientes] = useState([])
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState(null)

  const [editando, setEditando] = useState(null)
  const [excluindo, setExcluindo] = useState(null)

  const recarregar = useCallback(async () => {
    try {
      setPacientes(await listarPacientes())
      setErro(null)
    } catch (e) {
      setErro(e.message)
    } finally {
      setCarregando(false)
    }
  }, [])

  useEffect(() => {
    recarregar()
  }, [recarregar])

  if (carregando) return <Esqueleto />
  if (erro) return <Aviso>{erro}</Aviso>
  // Lista vazia de verdade não precisa de caixa de busca: não há o que buscar.
  if (pacientes.length === 0) return <Vazio>Nenhum paciente cadastrado.</Vazio>

  const encontrados = filtrarPacientes(pacientes, busca)

  return (
    <>
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <div className="min-w-0 flex-1 sm:max-w-sm">
          <CampoDeBusca
            valor={busca}
            aoMudar={buscar}
            rotulo="Buscar paciente"
            placeholder="Buscar por nome"
          />
        </div>

        {/* `role="status"` para quem usa leitor de tela saber que a lista
            mudou — filtrar sem aviso deixa a pessoa sem referência do que
            aconteceu depois de digitar. */}
        {busca !== '' && (
          <p role="status" className="text-sm text-navy-500">
            {encontrados.length === 1
              ? '1 paciente encontrado'
              : `${encontrados.length} pacientes encontrados`}
          </p>
        )}
      </div>

      {encontrados.length === 0 && <Vazio>Nenhum paciente encontrado para “{busca}”.</Vazio>}

      {encontrados.length > 0 && (
        <Tabela
          colunas={[
            { rotulo: 'Paciente' },
            { rotulo: 'Ações', largura: 'w-[8.25rem]', direita: true },
          ]}
        >
          {encontrados.map((p) => (
            <tr key={p.id} className="transition-colors hover:bg-navy-50/50">
              <Celula>
                <Pessoa nome={nomeCompleto(p)} />
              </Celula>

              <Celula direita>
                <Acoes>
                  <BotaoIcone
                    rotulo={`Ver anamnese de ${nomeCompleto(p)}`}
                    onClick={() => navegar(`/dashboard/pacientes/${p.id}/anamnese`)}
                  >
                    <IconeAnamnese />
                  </BotaoIcone>

                  {podeGerenciarPacientes && (
                    <BotaoIcone
                      rotulo={`Editar ${nomeCompleto(p)}`}
                      onClick={() => setEditando(p)}
                    >
                      <IconeEditar />
                    </BotaoIcone>
                  )}

                  {podeExcluirPacientes && (
                    <BotaoIcone
                      variante="perigo"
                      rotulo={`Excluir ${nomeCompleto(p)}`}
                      onClick={() => setExcluindo(p)}
                    >
                      <IconeExcluir />
                    </BotaoIcone>
                  )}
                </Acoes>
              </Celula>
            </tr>
          ))}
        </Tabela>
      )}

      <DialogoDeEdicao
        paciente={editando}
        aoFechar={() => setEditando(null)}
        aoSalvar={recarregar}
      />

      <DialogoDeExclusao
        paciente={excluindo}
        aoFechar={() => setExcluindo(null)}
        aoExcluir={recarregar}
      />
    </>
  )
}

function Esqueleto() {
  return (
    <div role="status" aria-label="Carregando" className="space-y-3">
      {[0, 1, 2].map((i) => (
        <div key={i} className="h-14 animate-pulse rounded-xl bg-white" />
      ))}
    </div>
  )
}

function DialogoDeEdicao({ paciente, aoFechar, aoSalvar }) {
  // Mantém o conteúdo enquanto a caixa sai de cena.
  const ultimo = useUltimo(paciente)

  return (
    <Dialogo
      aberto={Boolean(paciente)}
      aoFechar={aoFechar}
      titulo="Editar paciente"
      descricao="Só nome e sobrenome. O resto da ficha não se edita por aqui."
    >
      {ultimo && (
        <Formulario key={ultimo.id} paciente={ultimo} aoFechar={aoFechar} aoSalvar={aoSalvar} />
      )}
    </Dialogo>
  )
}

function Formulario({ paciente, aoFechar, aoSalvar }) {
  const [nome, setNome] = useState(paciente.nome)
  const [sobrenome, setSobrenome] = useState(paciente.sobrenome ?? '')
  const [salvando, setSalvando] = useState(false)
  const [erro, setErro] = useState(null)

  const podeSalvar = nome.trim() !== '' && sobrenome.trim() !== '' && !salvando

  async function enviar(event) {
    event.preventDefault()
    if (!podeSalvar) return

    setSalvando(true)
    setErro(null)
    try {
      await atualizarPaciente(paciente.id, {
        nome: nome.trim(),
        sobrenome: sobrenome.trim(),
      })
      await aoSalvar()
      aoFechar()
    } catch (e) {
      setErro(e.message)
      setSalvando(false)
    }
  }

  return (
    <form onSubmit={enviar} noValidate className="flex flex-col gap-4">
      <Field label="Nome" value={nome} onChange={setNome} disabled={salvando} />
      <Field label="Sobrenome" value={sobrenome} onChange={setSobrenome} disabled={salvando} />

      {erro && (
        <p role="alert" className="rounded-lg bg-red-50 px-3.5 py-3 text-sm text-red-800">
          {erro}
        </p>
      )}

      <AcoesDoDialogo>
        <Botao type="button" onClick={aoFechar} disabled={salvando}>
          Cancelar
        </Botao>
        <Botao type="submit" variante="primario" disabled={!podeSalvar}>
          {salvando ? 'Salvando…' : 'Salvar'}
        </Botao>
      </AcoesDoDialogo>
    </form>
  )
}

function DialogoDeExclusao({ paciente, aoFechar, aoExcluir }) {
  const ultimo = useUltimo(paciente)
  const [excluindo, setExcluindo] = useState(false)
  const [erro, setErro] = useState(null)

  async function confirmar() {
    setExcluindo(true)
    setErro(null)
    try {
      await excluirPaciente(paciente.id)
      await aoExcluir()
      aoFechar()
    } catch (e) {
      setErro(e.message)
    } finally {
      setExcluindo(false)
    }
  }

  return (
    <Dialogo
      aberto={Boolean(paciente)}
      aoFechar={aoFechar}
      titulo="Excluir paciente"
      // O nome vai na pergunta: é o que evita excluir o vizinho da lista.
      descricao={
        ultimo &&
        `A ficha de ${nomeCompleto(ultimo)} sai do painel, com a anamnese junto. Isso não se desfaz.`
      }
    >
      {erro && (
        <p role="alert" className="rounded-lg bg-red-50 px-3.5 py-3 text-sm text-red-800">
          {erro}
        </p>
      )}

      <AcoesDoDialogo>
        <Botao onClick={aoFechar} disabled={excluindo}>
          Cancelar
        </Botao>
        <Botao variante="perigo" onClick={confirmar} disabled={excluindo}>
          {excluindo ? 'Excluindo…' : 'Excluir'}
        </Botao>
      </AcoesDoDialogo>
    </Dialogo>
  )
}
