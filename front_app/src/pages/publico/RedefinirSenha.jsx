import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { abrirRedefinicao, concluirRedefinicao, tempoRestante } from '../../lib/redefinicoes'
import AuthLayout from '../../components/AuthLayout'
import Field from '../../components/Field'
import BotaoVerSenha from '../../components/BotaoVerSenha'
import { Verificando } from '../../components/RequireAuth'
import { Enviar, Erro } from '../Login'
import { Dica } from '../Register'
import { useTitulo } from '../../lib/titulo'

/** A regra de verdade é do servidor. Aqui só para responder rápido. */
const MINIMO_SENHA = 8

/**
 * A pessoa escolhe a senha nova, pelo link que um administrador gerou.
 *
 * Pública, e fora da guarda: quem chega aqui é justamente quem não consegue
 * entrar. O token é a credencial, e vale uma hora.
 */
export default function RedefinirSenha() {
  useTitulo('Nova senha')

  const { token } = useParams()

  const [convite, setConvite] = useState(null)
  const [carregando, setCarregando] = useState(true)
  const [invalido, setInvalido] = useState(null)

  const [senha, setSenha] = useState('')
  const [confirmacao, setConfirmacao] = useState('')
  // Um estado por campo: revelar a senha não revela a confirmação.
  const [verSenha, setVerSenha] = useState(false)
  const [verConfirmacao, setVerConfirmacao] = useState(false)
  const [erro, setErro] = useState(null)
  const [enviando, setEnviando] = useState(false)
  const [pronto, setPronto] = useState(false)

  useEffect(() => {
    let vivo = true
    abrirRedefinicao(token)
      .then((achado) => vivo && setConvite(achado))
      .catch((e) => vivo && setInvalido(e.message))
      .finally(() => vivo && setCarregando(false))
    return () => {
      vivo = false
    }
  }, [token])

  if (carregando) return <Verificando />

  if (invalido) {
    return (
      <AuthLayout titulo="Link inválido" descricao={invalido} rodape={<VoltarAoLogin />}>
        <p className="mt-6 rounded-xl border border-navy-200 bg-navy-50 px-4 py-4 text-sm leading-relaxed text-navy-600">
          Links de senha valem por uma hora e servem uma vez só. Peça outro a um administrador da
          clínica.
        </p>
      </AuthLayout>
    )
  }

  if (pronto) {
    return (
      <AuthLayout
        titulo="Senha alterada"
        descricao="Pronto. Já dá para entrar com a senha nova."
        rodape={<VoltarAoLogin />}
      >
        <div className="mt-6 rounded-xl border border-mint-200 bg-mint-50 px-4 py-4 text-sm leading-relaxed text-mint-900">
          Este link não serve mais. Guarde a senha nova onde você guarda as suas.
        </div>
      </AuthLayout>
    )
  }

  const senhaCurta = senha !== '' && senha.length < MINIMO_SENHA
  // Só acusa divergência quando o digitado deixa de ser um começo possível da
  // senha: comparar em cheio faria o erro piscar enquanto se digita certo.
  const divergiu = confirmacao !== '' && !senha.startsWith(confirmacao)
  const confere = senha !== '' && senha === confirmacao
  const podeEnviar = senha.length >= MINIMO_SENHA && confere && !enviando

  async function aoEnviar(event) {
    event.preventDefault()
    if (!podeEnviar) return

    setEnviando(true)
    setErro(null)

    try {
      await concluirRedefinicao(token, senha)
      setPronto(true)
    } catch (e) {
      setErro(e.message)
      // A senha sai da memória quando falha, como no login.
      setSenha('')
      setConfirmacao('')
    } finally {
      setEnviando(false)
    }
  }

  return (
    <AuthLayout
      titulo={`Olá, ${primeiroNome(convite.nome)}`}
      descricao="Escolha a senha que você vai usar para entrar no painel."
      rodape={<VoltarAoLogin />}
    >
      <form onSubmit={aoEnviar} noValidate className="mt-6 flex flex-col gap-4">
        <div>
          <Field
            label="Nova senha"
            type={verSenha ? 'text' : 'password'}
            value={senha}
            onChange={setSenha}
            autoComplete="new-password"
            disabled={enviando}
            invalid={Boolean(erro) || senhaCurta}
            placeholder="Nova senha"
            acao={<BotaoVerSenha ativo={verSenha} aoAlternar={() => setVerSenha((v) => !v)} />}
          />
          <Dica erro={senhaCurta}>Pelo menos {MINIMO_SENHA} caracteres.</Dica>
        </div>

        <div>
          <Field
            label="Repita a senha"
            type={verConfirmacao ? 'text' : 'password'}
            value={confirmacao}
            onChange={setConfirmacao}
            autoComplete="new-password"
            disabled={enviando}
            invalid={Boolean(erro) || divergiu}
            placeholder="A mesma de cima"
            acao={
              <BotaoVerSenha
                ativo={verConfirmacao}
                aoAlternar={() => setVerConfirmacao((v) => !v)}
              />
            }
          />
          {divergiu && <Dica erro>As senhas não conferem.</Dica>}
        </div>

        {erro && <Erro>{erro}</Erro>}

        <p className="text-xs text-navy-400">
          Este link vale por mais {tempoRestante(convite.expiraEm)}.
        </p>

        <Enviar carregando={enviando} desabilitado={!podeEnviar}>
          Salvar senha
        </Enviar>
      </form>
    </AuthLayout>
  )
}

function VoltarAoLogin() {
  return (
    <Link to="/login" className="font-medium text-mint-300 hover:text-mint-200">
      Ir para o login
    </Link>
  )
}

function primeiroNome(nome = '') {
  return nome.trim().split(/\s+/)[0]
}
