/**
 * `perigo` é vermelho sólido e só deve aparecer no momento da confirmação.
 * Numa lista com várias linhas, um botão desses por linha faz o olho ir para
 * "excluir" antes de ir para o nome das pessoas — e a ação destrutiva vira a
 * coisa mais visível da tela.
 *
 * Na lista use `perigoDiscreto`: mesma afordância, sem gritar.
 */
const ESTILOS = {
  primario: 'bg-navy-900 text-white hover:bg-navy-800 disabled:bg-navy-300',
  secundario:
    'border border-navy-200 bg-white text-navy-700 hover:bg-navy-50 disabled:text-navy-300',
  perigoDiscreto:
    'border border-navy-200 bg-white text-red-700 hover:border-red-200 hover:bg-red-50 disabled:border-navy-100 disabled:text-navy-300',
  perigo: 'bg-red-600 text-white hover:bg-red-700 disabled:bg-red-300',
}

export default function Botao({ variante = 'secundario', className = '', ...rest }) {
  return (
    <button
      className={`cursor-pointer rounded-lg px-4 py-2 font-display text-xs font-semibold tracking-wide uppercase transition-colors disabled:cursor-not-allowed ${ESTILOS[variante]} ${className}`}
      {...rest}
    />
  )
}
