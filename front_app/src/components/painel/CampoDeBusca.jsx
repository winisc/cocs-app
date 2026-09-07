import { useId } from 'react'
import { MagnifyingGlassIcon, XMarkIcon } from '@heroicons/react/24/solid'

/**
 * Caixa de busca das listas.
 *
 * `type="search"` de propósito: o teclado do celular mostra "buscar" no lugar
 * de "enter", e o navegador entende o campo como busca. O X de limpar é nosso
 * porque o nativo do Chrome não aparece em todos os sistemas.
 */
export default function CampoDeBusca({ valor, aoMudar, rotulo, placeholder }) {
  const id = useId()

  return (
    <div className="relative">
      <label htmlFor={id} className="sr-only">
        {rotulo}
      </label>

      <MagnifyingGlassIcon
        aria-hidden="true"
        className="pointer-events-none absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-navy-300"
      />

      <input
        id={id}
        type="search"
        value={valor}
        onChange={(e) => aoMudar(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-lg border border-navy-200 bg-white py-2 pr-10 pl-10 text-[15px] text-navy-900 transition-colors placeholder:text-navy-300 hover:border-navy-300 [&::-webkit-search-cancel-button]:appearance-none"
      />

      {valor !== '' && (
        <button
          type="button"
          onClick={() => aoMudar('')}
          aria-label="Limpar busca"
          className="absolute top-1/2 right-2 flex h-7 w-7 -translate-y-1/2 cursor-pointer items-center justify-center rounded-md text-navy-400 transition-colors hover:bg-navy-100 hover:text-navy-700"
        >
          <XMarkIcon aria-hidden="true" className="h-4 w-4" />
        </button>
      )}
    </div>
  )
}
