import { useEffect } from 'react'

const CLINICA = 'COCS Odontologia'

/**
 * O título da aba, com o contexto de onde a pessoa está.
 *
 * A recepção trabalha com várias abas abertas ao mesmo tempo — a ficha de um
 * paciente, a lista, o histórico de outro. Todas com o mesmo "Painel" no topo,
 * achar a certa vira tentativa e erro.
 *
 * Cada página põe o seu, e nenhuma o põe pela outra: efeito de filho roda antes
 * do de pai, então um título vindo da moldura sobrescreveria o mais específico
 * logo depois de ele aparecer.
 */
export function useTitulo(contexto) {
  useEffect(() => {
    document.title = contexto ? `${contexto} | ${CLINICA}` : CLINICA
  }, [contexto])
}
