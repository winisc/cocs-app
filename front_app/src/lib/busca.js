/**
 * Normalização de busca, compartilhada pelas listas do painel.
 *
 * Estava dentro de `pacientes.js` e sairia copiada para usuários e
 * solicitações. Regra de comparação duplicada é como uma lista passa a achar
 * "Antônia" e a outra não.
 */

/**
 * Tira acento e caixa. Sem isso, procurar "antonia" não acha "Antônia" — e
 * ninguém digita acento numa caixa de busca com pressa.
 */
export function normalizar(texto = '') {
  return texto
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
}

/** Verdadeiro quando algum dos campos contém o termo, já normalizado. */
export function combina(termo, ...campos) {
  const alvo = normalizar(termo)
  if (!alvo) return true
  return campos.some((campo) => normalizar(campo).includes(alvo))
}

/**
 * Filtro por nome e e-mail — o formato de quase toda lista de pessoas do
 * painel.
 *
 * Filtra em memória porque as listas são pequenas. Quando vierem do servidor,
 * é aqui que o termo passa a ir na chamada; as telas não mudam.
 */
export function filtrarPessoas(pessoas, busca = '') {
  const termo = busca.trim()
  if (!termo) return pessoas
  return pessoas.filter((p) => combina(termo, p.nome, p.email))
}
