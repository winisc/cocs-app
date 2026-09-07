import { Link } from 'react-router-dom'

/**
 * Mesma página de 404 da landing, reescrita em componente.
 *
 * Lá ela é um HTML solto em public/, servido pelo Cloudflare quando o arquivo
 * não existe. Aqui as rotas vivem no navegador, então quem decide que o
 * endereço não existe é o roteador — mas a pessoa que vê as duas telas está
 * vendo o mesmo produto, e elas precisam parecer o mesmo produto.
 *
 * O botão leva ao dashboard, não à raiz: se não houver sessão, a guarda
 * manda para o login sozinha.
 */
export default function NaoEncontrada() {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center bg-navy-900 px-8 py-10 text-center">
      <h1 className="font-display text-2xl font-semibold text-navy-50">Página não encontrada</h1>

      <p className="mt-3 max-w-sm leading-relaxed text-navy-300">
        O endereço que você abriu não existe ou foi movido.
      </p>

      <Link
        to="/dashboard"
        className="mt-7 rounded-full bg-mint-400 px-7 py-3 font-display font-semibold text-navy-900 transition-colors hover:bg-mint-300"
      >
        Ir para o início
      </Link>
    </main>
  )
}
