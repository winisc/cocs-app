import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import * as auth from './auth'

/**
 * Sessão do painel.
 *
 * O estado tem três valores, não dois: `carregando`, `usuario` e "ninguém".
 * A diferença entre "ainda não sei" e "não tem ninguém" é o que impede a
 * guarda de rota de expulsar quem está logado a cada recarga de página.
 */
const SessionContext = createContext(null)

export function SessionProvider({ children }) {
  const [usuario, setUsuario] = useState(null)
  const [carregando, setCarregando] = useState(true)

  useEffect(() => {
    let vivo = true

    auth
      .restoreSession()
      .then((sessao) => {
        if (vivo) setUsuario(sessao)
      })
      .catch(() => {
        // Falha ao restaurar é o mesmo que não ter sessão: manda para o login.
        // Não é erro para mostrar na tela — quem nunca entrou também cai aqui.
        //
        // E apaga o que estiver guardado. Sem isso, um token que o servidor
        // recusa — vencido, usuário excluído, segredo rotacionado — deixa
        // `temSessaoLocal()` dizendo que há sessão: o /login manda para o
        // painel, a guarda manda de volta, e a pessoa fica no meio de um
        // vaivém sem fim. Com 30 dias no localStorage isso deixou de ser raro.
        auth.signOut()
        if (vivo) setUsuario(null)
      })
      .finally(() => {
        if (vivo) setCarregando(false)
      })

    return () => {
      vivo = false
    }
  }, [])

  const entrar = useCallback(async (credenciais) => {
    const sessao = await auth.signIn(credenciais)
    setUsuario(sessao)
    return sessao
  }, [])

  const cadastrar = useCallback(async (dados) => {
    const resultado = await auth.signUp(dados)
    if (resultado?.usuario) setUsuario(resultado.usuario)
    return resultado
  }, [])

  const sair = useCallback(async () => {
    await auth.signOut()
    setUsuario(null)
  }, [])

  const valor = useMemo(
    () => ({ usuario, carregando, entrar, cadastrar, sair }),
    [usuario, carregando, entrar, cadastrar, sair],
  )

  return <SessionContext.Provider value={valor}>{children}</SessionContext.Provider>
}

export function useSession() {
  const contexto = useContext(SessionContext)
  if (!contexto) throw new Error('useSession precisa estar dentro de <SessionProvider>')
  return contexto
}
