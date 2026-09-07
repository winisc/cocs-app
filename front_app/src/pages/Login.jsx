import { useState } from 'react'
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom'
import { useSession } from '../lib/session'
import AuthLayout from '../components/AuthLayout'
import Field from '../components/Field'
import BotaoVerSenha from '../components/BotaoVerSenha'
import { Verificando } from '../components/RequireAuth'
import { temSessaoLocal } from '../lib/auth'

export default function Login() {
  const { usuario, carregando, entrar } = useSession()
  const navegar = useNavigate()
  const local = useLocation()

  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [verSenha, setVerSenha] = useState(false)
  const [erro, setErro] = useState(null)
  const [enviando, setEnviando] = useState(false)

  // Quem já está logado não tem o que fazer aqui.
  if (usuario || temSessaoLocal()) return <Navigate to="/dashboard" replace />
  if (carregando) return <Verificando />

  const podeEnviar = email.trim() !== '' && senha !== '' && !enviando

  async function aoEnviar(event) {
    event.preventDefault()
    if (!podeEnviar) return

    setEnviando(true)
    setErro(null)

    try {
      await entrar({ email: email.trim(), senha })
      // Volta para onde a pessoa tentou ir antes da guarda barrar, em vez de
      // largar todo mundo no início.
      navegar(local.state?.de?.pathname ?? '/dashboard', { replace: true })
    } catch (e) {
      setErro(e.message)
      // A senha sai da memória quando a tentativa falha. O e-mail fica: quem
      // errou a senha não quer digitar o e-mail de novo.
      setSenha('')
      setEnviando(false)
    }
  }

  return (
    <AuthLayout
      titulo="Painel da clínica"
      descricao="Entre com seu acesso para continuar."
      rodape={
        <>
          Ainda não tem acesso?{' '}
          <Link to="/cadastro" className="font-medium text-mint-300 hover:text-mint-200">
            Criar conta
          </Link>
        </>
      }
    >
      <form onSubmit={aoEnviar} noValidate className="mt-6 flex flex-col gap-4">
        <Field
          label="E-mail"
          type="email"
          value={email}
          onChange={setEmail}
          autoComplete="username"
          disabled={enviando}
          invalid={Boolean(erro)}
          placeholder="voce@cocs.com.br"
        />

        <Field
          label="Senha"
          type={verSenha ? 'text' : 'password'}
          value={senha}
          onChange={setSenha}
          autoComplete="current-password"
          disabled={enviando}
          invalid={Boolean(erro)}
          acao={<BotaoVerSenha ativo={verSenha} aoAlternar={() => setVerSenha((v) => !v)} />}
        />

        {erro && <Erro>{erro}</Erro>}

        <Enviar carregando={enviando} desabilitado={!podeEnviar}>
          Entrar
        </Enviar>
      </form>
    </AuthLayout>
  )
}

/** role="alert" para o erro ser anunciado sem o foco precisar sair do campo. */
export function Erro({ children }) {
  return (
    <p
      role="alert"
      className="rounded-lg bg-red-50 px-3.5 py-3 text-sm leading-relaxed text-red-800"
    >
      {children}
    </p>
  )
}

export function Enviar({ carregando, desabilitado, children }) {
  return (
    <button
      type="submit"
      disabled={desabilitado}
      className="cursor-pointer mt-1 rounded-lg bg-navy-900 px-5 py-3 font-display text-xs font-semibold tracking-[0.14em] text-white uppercase transition-colors hover:bg-navy-800 disabled:cursor-not-allowed disabled:bg-navy-300"
    >
      {carregando ? 'Aguarde…' : children}
    </button>
  )
}
