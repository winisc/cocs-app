/**
 * Alterna entre esconder e mostrar uma senha.
 *
 * Cada campo tem o seu. Um botão só, controlando dois campos, faz a pessoa
 * revelar a senha inteira quando ela só queria conferir o que acabou de
 * digitar — e senha na tela é o tipo de coisa que se revela por escolha, um
 * campo de cada vez.
 *
 * Ícone sólido, igual ao visto de "as senhas conferem" que fica ao lado. Os
 * dois dividem o mesmo canto do campo: com um em contorno e outro preenchido,
 * o par lê como dois pesos diferentes em vez de um grupo de controles.
 */
export default function BotaoVerSenha({ ativo, aoAlternar }) {
  return (
    <button
      type="button"
      onClick={aoAlternar}
      // O rótulo diz o que o clique faz; o aria-pressed diz o estado atual.
      // Sem os dois, o leitor de tela ou anuncia a ação errada ou não anuncia
      // que a senha está visível.
      aria-label={ativo ? 'Ocultar senha' : 'Mostrar senha'}
      aria-pressed={ativo}
      className="cursor-pointer flex h-8 w-8 items-center justify-center rounded-md text-navy-400 transition-colors hover:bg-navy-50 hover:text-navy-700"
    >
      {ativo ? <OlhoCortado /> : <Olho />}
    </button>
  )
}

function Olho() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" className="h-5 w-5">
      <path d="M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z" />
      <path
        fillRule="evenodd"
        d="M1.32 11.45C2.81 6.98 7.03 3.75 12 3.75s9.19 3.22 10.68 7.69c.12.36.12.75 0 1.11-1.49 4.47-5.71 7.7-10.68 7.7s-9.19-3.22-10.68-7.69a1.76 1.76 0 0 1 0-1.11ZM17.25 12a5.25 5.25 0 1 1-10.5 0 5.25 5.25 0 0 1 10.5 0Z"
        clipRule="evenodd"
      />
    </svg>
  )
}

function OlhoCortado() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" className="h-5 w-5">
      <path d="M3.53 2.47a.75.75 0 0 0-1.06 1.06l18 18a.75.75 0 1 0 1.06-1.06l-18-18ZM22.68 12.55a11.25 11.25 0 0 1-2.64 4.31l-3.1-3.1a5.25 5.25 0 0 0-6.71-6.71L7.76 4.58A11.22 11.22 0 0 1 12 3.75c4.97 0 9.19 3.22 10.68 7.69.12.36.12.75 0 1.11Z" />
      <path d="M15.75 12c0 .18-.01.36-.04.53l-4.24-4.24A3.75 3.75 0 0 1 15.75 12ZM12.53 15.71l-4.24-4.24a3.75 3.75 0 0 0 4.24 4.24Z" />
      <path d="M6.75 12c0-.62.11-1.21.3-1.76l-3.1-3.1a11.25 11.25 0 0 0-2.63 4.31c-.12.36-.12.75 0 1.11 1.49 4.47 5.7 7.69 10.68 7.69 1.5 0 2.93-.29 4.24-.83l-2.48-2.48A5.25 5.25 0 0 1 6.75 12Z" />
    </svg>
  )
}
