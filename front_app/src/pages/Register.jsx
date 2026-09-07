import { useState } from 'react'
import { Link, Navigate } from 'react-router-dom'
import { useSession } from '../lib/session'
import AuthLayout from '../components/AuthLayout'
import Field from '../components/Field'
import BotaoVerSenha from '../components/BotaoVerSenha'
import { Verificando } from '../components/RequireAuth'
import { Enviar, Erro } from './Login'
import { temSessaoLocal } from '../lib/auth'

/** Mínimo suficiente para não aceitar senha trivial. A regra de verdade é do
 *  servidor — validação de tela só existe para dar resposta rápida. */
const MINIMO_SENHA = 8

export default function Register() {
  const { usuario, carregando, cadastrar } = useSession()

  const [nome, setNome] = useState('')
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [confirmacao, setConfirmacao] = useState('')
  // Um estado por campo: revelar a senha não revela a confirmação.
  const [verSenha, setVerSenha] = useState(false)
  const [verConfirmacao, setVerConfirmacao] = useState(false)
  const [erro, setErro] = useState(null)
  const [enviando, setEnviando] = useState(false)
  const [solicitacao, setSolicitacao] = useState(null)

  if (usuario || temSessaoLocal()) return <Navigate to="/dashboard" replace />
  if (carregando) return <Verificando />

  if (solicitacao) {
    return (
      <AuthLayout
        titulo="Solicitação enviada"
        descricao="Seu acesso será liberado após aprovação da administração."
        rodape={
          <>
            Já foi aprovado?{' '}
            <Link to="/login" className="font-medium text-mint-300 hover:text-mint-200">
              Entrar
            </Link>
          </>
        }
      >
        <div className="mt-6 rounded-xl border border-mint-200 bg-mint-50 px-4 py-4 text-sm leading-relaxed text-mint-900">
          <p className="font-display font-semibold">{solicitacao.nome}</p>
          <p className="mt-1">{solicitacao.email}</p>
          <p className="mt-3 text-mint-800">Acompanhe com um administrador da clínica.</p>
        </div>
      </AuthLayout>
    )
  }

  const senhaCurta = senha !== '' && senha.length < MINIMO_SENHA

  // Só acusa divergência quando o que foi digitado deixa de ser um começo
  // possível da senha. Comparar as duas em cheio faria o erro piscar a cada
  // tecla enquanto a pessoa digita certo, que é ruído, não ajuda.
  const divergiu = confirmacao !== '' && !senha.startsWith(confirmacao)
  const confere = senha !== '' && senha === confirmacao

  const podeEnviar =
    nome.trim() !== '' &&
    email.trim() !== '' &&
    senha.length >= MINIMO_SENHA &&
    confere &&
    !enviando

  async function aoEnviar(event) {
    event.preventDefault()
    if (!podeEnviar) return

    setEnviando(true)
    setErro(null)

    try {
      const resultado = await cadastrar({ nome: nome.trim(), email: email.trim(), senha })
      if (resultado?.pendente) {
        setSolicitacao(resultado.solicitacao)
        return
      }
    } catch (e) {
      setErro(e.message)
      // Os dois campos de senha saem da memória quando a tentativa falha.
      // Nome e e-mail ficam: não é isso que a pessoa precisa redigitar.
      setSenha('')
      setConfirmacao('')
      setEnviando(false)
    }
  }

  return (
    <AuthLayout
      titulo="Criar acesso"
      descricao="Preencha para entrar no painel da clínica."
      rodape={
        <>
          Já tem acesso?{' '}
          <Link to="/login" className="font-medium text-mint-300 hover:text-mint-200">
            Entrar
          </Link>
        </>
      }
    >
      <form onSubmit={aoEnviar} noValidate className="mt-6 flex flex-col gap-4">
        <Field
          label="Nome"
          value={nome}
          onChange={setNome}
          autoComplete="name"
          disabled={enviando}
          invalid={Boolean(erro)}
          placeholder="Como quer ser chamado"
        />

        <Field
          label="E-mail"
          type="email"
          value={email}
          onChange={setEmail}
          autoComplete="email"
          disabled={enviando}
          invalid={Boolean(erro)}
          placeholder="voce@cocs.com.br"
        />

        <div>
          <Field
            label="Senha"
            type={verSenha ? 'text' : 'password'}
            value={senha}
            onChange={setSenha}
            autoComplete="new-password"
            disabled={enviando}
            invalid={Boolean(erro) || senhaCurta}
            acao={<BotaoVerSenha ativo={verSenha} aoAlternar={() => setVerSenha((v) => !v)} />}
          />
          <Dica erro={senhaCurta}>Pelo menos {MINIMO_SENHA} caracteres.</Dica>
        </div>

        <div>
          <Field
            label="Confirmar senha"
            type={verConfirmacao ? 'text' : 'password'}
            value={confirmacao}
            onChange={setConfirmacao}
            autoComplete="new-password"
            disabled={enviando}
            invalid={Boolean(erro) || divergiu}
            // Dois controles cabem aqui, então o campo reserva mais espaço.
            reserva="pr-[4.5rem]"
            acao={
              <>
                {confere && <Conferiu />}
                <BotaoVerSenha
                  ativo={verConfirmacao}
                  aoAlternar={() => setVerConfirmacao((v) => !v)}
                />
              </>
            }
          />
          {divergiu && <Dica erro>As senhas não conferem.</Dica>}
        </div>

        {erro && <Erro>{erro}</Erro>}

        <Enviar carregando={enviando} desabilitado={!podeEnviar}>
          Criar acesso
        </Enviar>
      </form>
    </AuthLayout>
  )
}

function Dica({ erro = false, children }) {
  return (
    <p
      // Mensagem de erro é anunciada; texto de apoio não, senão o leitor de
      // tela repete a regra de senha a cada tecla.
      role={erro ? 'alert' : undefined}
      className={`mt-1.5 text-xs ${erro ? 'text-red-700' : 'text-navy-400'}`}
    >
      {children}
    </p>
  )
}

/** Confirmação visual de que as duas senhas batem. */
function Conferiu() {
  return (
    <span className="flex items-center text-mint-600">
      <span className="sr-only">As senhas conferem</span>
      <svg viewBox="0 0 20 20" fill="currentColor" aria-hidden="true" className="h-5 w-5">
        <path
          fillRule="evenodd"
          d="M16.7 5.3a1 1 0 0 1 0 1.4l-7.5 7.5a1 1 0 0 1-1.4 0l-3.5-3.5a1 1 0 1 1 1.4-1.4l2.8 2.79 6.8-6.79a1 1 0 0 1 1.4 0Z"
          clipRule="evenodd"
        />
      </svg>
    </span>
  )
}
