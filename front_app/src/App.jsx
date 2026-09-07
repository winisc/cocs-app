import { BrowserRouter, Navigate, Outlet, Route, Routes } from 'react-router-dom'
import { SessionProvider } from './lib/session'
import { PERMISSOES } from './lib/permissoes'
import { useSession } from './lib/session'
import RequireAuth from './components/RequireAuth'
import RequireRole from './components/RequireRole'
import Login from './pages/Login'
import Register from './pages/Register'
import Dashboard from './pages/Dashboard'
import Pacientes from './pages/Pacientes'
import SecaoUsuarios from './pages/usuarios/Secao'
import ListaDeUsuarios from './pages/usuarios/Lista'
import Solicitacoes from './pages/usuarios/Solicitacoes'
import ListaDeAnamneses from './pages/anamnese/Lista'
import AnamneseDoPaciente from './pages/anamnese/DoPaciente'
import AnamneseAtualDoPaciente from './pages/anamnese/AtualDoPaciente'
import { primeiraDoUsuario } from './components/painel/navegacao'
import NaoEncontrada from './pages/NaoEncontrada'
import AnamnesePublica from './pages/publico/Anamnese'

/**
 * O painel inteiro fica atrás da guarda; login e cadastro ficam de fora.
 *
 * As rotas protegidas são filhas de <RequireAuth>, não irmãs: assim toda
 * página nova nasce protegida por padrão. Proteger uma a uma é como se
 * esquece de proteger a próxima.
 */
export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/anamnese/:token" element={<AnamnesePublica />} />

        <Route element={<RotasComSessao />}>
          <Route path="/login" element={<Login />} />
          <Route path="/cadastro" element={<Register />} />

          {/* Pública, e fora da guarda: quem abre é o paciente, pelo link que
              recebeu, e exigir login aqui seria pedir uma conta a quem só vai
              responder cinco perguntas. O token é a credencial. */}
          <Route element={<RequireAuth />}>
            <Route path="/dashboard" element={<Dashboard />}>
              {/* /dashboard sozinho não é aba nenhuma: manda para a primeira,
                  senão a moldura aparece com o miolo vazio. */}
              <Route index element={<PrimeiraPermitida />} />
              <Route element={<RequireRole roles={PERMISSOES.pacientes} />}>
                <Route path="pacientes" element={<Pacientes />} />
              </Route>
              <Route element={<RequireRole roles={PERMISSOES.usuarios} />}>
                <Route path="usuarios" element={<SecaoUsuarios />}>
                  <Route index element={<ListaDeUsuarios />} />
                  <Route path="solicitacoes" element={<Solicitacoes />} />
                </Route>
              </Route>
              <Route element={<RequireRole roles={PERMISSOES.anamnese} />}>
                <Route path="anamnese" element={<ListaDeAnamneses />} />
              </Route>
              <Route element={<RequireRole roles={PERMISSOES.visualizarAnamnesePaciente} />}>
                {/* Duas telas, de propósito. Aberta da ficha do paciente, a
                    anamnese é uma só: a última respondida, que é o que serve
                    para atender. O histórico é a outra pergunta — o que foi
                    enviado, o que venceu, o que falta — e tem rota própria. */}
                <Route
                  path="pacientes/:pacienteId/anamnese"
                  element={<AnamneseAtualDoPaciente />}
                />
                <Route path="anamnese/:pacienteId" element={<AnamneseDoPaciente />} />
              </Route>
            </Route>
          </Route>

          {/* A raiz não é página: é atalho para o painel. Sem sessão, a guarda
              do /dashboard manda para o login. */}
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
        </Route>

          {/* Endereço que não existe mostra 404 de verdade. Redirecionar para
              o início esconde erro de link e faz o usuário achar que clicou
              errado. */}
          <Route path="*" element={<NaoEncontrada />} />
      </Routes>
    </BrowserRouter>
  )
}

function RotasComSessao() {
  return (
    <SessionProvider>
      <Outlet />
    </SessionProvider>
  )
}

function PrimeiraPermitida() {
  const { usuario } = useSession()
  return <Navigate to={primeiraDoUsuario(usuario)} replace />
}
