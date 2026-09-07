import { useState } from 'react'
import { useSession } from '../../lib/session'
import { PAPEIS, atualizarUsuario, excluirUsuario, rotuloDoPapel } from '../../lib/usuarios'
import Dialogo, { AcoesDoDialogo, useUltimo } from '../../components/painel/Dialogo'
import Botao from '../../components/painel/Botao'
import BotaoIcone, { IconeEditar, IconeExcluir } from '../../components/painel/BotaoIcone'
import Tabela, { Acoes, Celula, Etiqueta, Pessoa } from '../../components/painel/Tabela'
import Select from '../../components/painel/Select'
import Field from '../../components/Field'
import { Vazio, useUsuarios } from './Secao'
import { useTitulo } from '../../lib/titulo'

export default function ListaDeUsuarios() {
  useTitulo('Usuários')

  const { usuarios, busca, recarregar } = useUsuarios()
  const { usuario: eu } = useSession()

  const [editando, setEditando] = useState(null)
  const [excluindo, setExcluindo] = useState(null)

  if (usuarios.length === 0) {
    return (
      <Vazio>
        {busca ? `Nenhum usuário encontrado para “${busca}”.` : 'Nenhum usuário cadastrado.'}
      </Vazio>
    )
  }

  return (
    <>
      <Tabela
        colunas={[
          { rotulo: 'Usuário' },
          { rotulo: 'Papel', largura: 'w-40', some: true },
          { rotulo: 'Ações', largura: 'w-[5.75rem]', direita: true },
        ]}
      >
        {usuarios.map((u) => {
          const souEu = u.email === eu.email
          return (
            <tr key={u.id} className="transition-colors hover:bg-navy-50/50">
              <Celula>
                <Pessoa
                  nome={u.nome}
                  email={u.email}
                  sufixo={souEu && <span className="ml-2 text-xs text-navy-400">(você)</span>}
                  abaixo={<Etiqueta>{rotuloDoPapel(u.papel)}</Etiqueta>}
                />
              </Celula>

              <Celula some>
                <Etiqueta>{rotuloDoPapel(u.papel)}</Etiqueta>
              </Celula>

              <Celula direita>
                <Acoes>
                  <BotaoIcone rotulo={`Editar ${u.nome}`} onClick={() => setEditando(u)}>
                    <IconeEditar />
                  </BotaoIcone>

                  <BotaoIcone
                    variante="perigo"
                    disabled={souEu}
                    // Sem isto, o admin exclui a própria conta e fica todo
                    // mundo de fora — não há como recriar acesso sem alguém
                    // logado.
                    rotulo={souEu ? 'Você não pode excluir a própria conta' : `Excluir ${u.nome}`}
                    onClick={() => setExcluindo(u)}
                  >
                    <IconeExcluir />
                  </BotaoIcone>
                </Acoes>
              </Celula>
            </tr>
          )
        })}
      </Tabela>

      <DialogoDeEdicao
        usuario={editando}
        aoFechar={() => setEditando(null)}
        aoSalvar={recarregar}
      />

      <DialogoDeExclusao
        usuario={excluindo}
        aoFechar={() => setExcluindo(null)}
        aoExcluir={recarregar}
      />
    </>
  )
}

function DialogoDeEdicao({ usuario, aoFechar, aoSalvar }) {
  // Mantém o conteúdo enquanto a caixa sai de cena.
  const ultimo = useUltimo(usuario)
  // A chave remonta o formulário a cada usuário aberto. Sem ela o estado do
  // anterior fica dentro dos campos e edita-se a pessoa errada.
  return (
    <Dialogo
      aberto={Boolean(usuario)}
      aoFechar={aoFechar}
      titulo="Editar usuário"
      descricao="Só dados básicos e papel. O resto do cadastro não se edita por aqui."
    >
      {ultimo && (
        <FormularioDeEdicao
          key={ultimo.id}
          usuario={ultimo}
          aoFechar={aoFechar}
          aoSalvar={aoSalvar}
        />
      )}
    </Dialogo>
  )
}

function FormularioDeEdicao({ usuario, aoFechar, aoSalvar }) {
  const [nome, setNome] = useState(usuario.nome)
  const [email, setEmail] = useState(usuario.email)
  const [papel, setPapel] = useState(usuario.papel)
  const [salvando, setSalvando] = useState(false)
  const [erro, setErro] = useState(null)

  const podeSalvar = nome.trim() !== '' && email.trim() !== '' && !salvando

  async function enviar(event) {
    event.preventDefault()
    if (!podeSalvar) return

    setSalvando(true)
    setErro(null)
    try {
      await atualizarUsuario(usuario.id, {
        nome: nome.trim(),
        email: email.trim(),
        papel,
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
      <Field label="E-mail" type="email" value={email} onChange={setEmail} disabled={salvando} />
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
        <Botao type="submit" variante="primario" disabled={!podeSalvar}>
          {salvando ? 'Salvando…' : 'Salvar'}
        </Botao>
      </AcoesDoDialogo>
    </form>
  )
}

function DialogoDeExclusao({ usuario, aoFechar, aoExcluir }) {
  // Mantém o conteúdo enquanto a caixa sai de cena.
  const ultimo = useUltimo(usuario)
  const [excluindo, setExcluindo] = useState(false)
  const [erro, setErro] = useState(null)

  async function confirmar() {
    setExcluindo(true)
    setErro(null)
    try {
      await excluirUsuario(usuario.id)
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
      aberto={Boolean(usuario)}
      aoFechar={aoFechar}
      titulo="Excluir usuário"
      // O nome vai na pergunta em vez de só "tem certeza?": é o que evita
      // excluir o vizinho da lista por engano.
      descricao={ultimo && `${ultimo.nome} perde o acesso ao painel. Isso não se desfaz.`}
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
