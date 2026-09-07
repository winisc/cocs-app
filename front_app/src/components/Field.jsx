import { useId } from 'react'

/**
 * Campo de formulário com rótulo e estado de erro.
 *
 * O id sai do useId em vez de vir por prop: o rótulo precisa apontar para o
 * input com htmlFor, e depender de quem usa lembrar de passar um id único é
 * como se perde acessibilidade sem ninguém perceber.
 *
 * O posicionamento de `acao` é do campo, não de quem passa: assim um botão
 * novo não precisa saber de `absolute`, e dois controles lado a lado se
 * arrumam sozinhos.
 */
export default function Field({
  label,
  type = 'text',
  value,
  onChange,
  autoComplete,
  disabled = false,
  invalid = false,
  acao = null,
  /** Espaço reservado à direita para os controles. Um controle cabe em pr-11. */
  reserva = 'pr-11',
  /** Acesso ao <input> para quem precisa mexer no cursor — máscara, por exemplo. */
  inputRef = null,
  ...rest
}) {
  const id = useId()

  return (
    <div>
      <label htmlFor={id} className="block font-display text-sm font-medium text-navy-700">
        {label}
      </label>

      <div className="relative mt-1.5">
        <input
          ref={inputRef}
          id={id}
          type={type}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          autoComplete={autoComplete}
          disabled={disabled}
          aria-invalid={invalid || undefined}
          className={`w-full rounded-lg border bg-white px-3.5 py-2 text-[15px] text-navy-900 transition-colors placeholder:text-navy-300 disabled:cursor-not-allowed disabled:bg-navy-50 ${
            invalid ? 'border-red-400' : 'border-navy-200 hover:border-navy-300'
          } ${acao ? reserva : ''}`}
          {...rest}
        />

        {acao && (
          <div className="absolute inset-y-0 right-0 flex items-center gap-1 pr-2">{acao}</div>
        )}
      </div>
    </div>
  )
}
