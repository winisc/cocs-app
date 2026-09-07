/**
 * Casca das seções que ainda não têm conteúdo. Some quando cada uma ganhar
 * o seu — não é para virar componente de layout.
 */
export function AindaVazio({ children }) {
  return (
    <div className="rounded-2xl border border-dashed border-navy-200 bg-white p-10 text-center">
      <p className="font-display text-sm font-medium text-navy-700">Ainda não há nada aqui</p>
      <p className="mx-auto mt-1 max-w-sm text-sm leading-relaxed text-navy-400">{children}</p>
    </div>
  )
}
