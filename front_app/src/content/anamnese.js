/**
 * O questionário da anamnese social, como dado.
 *
 * Fica separado da tela de propósito: a clínica vai querer trocar pergunta, e
 * mexer numa lista é diferente de mexer em JSX. A tela sabe desenhar cada
 * tipo; não sabe quais perguntas existem.
 *
 * Uma pergunta por etapa. São poucas e curtas, e no celular uma tela cheia com
 * seis perguntas empilhadas parece um formulário de cartório — uma de cada vez
 * é o que faz alguém terminar.
 *
 * Conteúdo tirado de docs/ANAMNESE SOCIAL COCS.docx.
 */

export const TITULO = 'Anamnese social'

export const ABERTURA = {
  titulo: '💙 Queremos conhecer você de verdade!',
  paragrafos: [
    'Cada paciente é único — e queremos que sua experiência na COCS Odontologia também seja.',
    'Por isso, preparamos algumas perguntas para conhecer melhor você, seus hábitos, preferências e gostos. Essas informações nos ajudam a oferecer um atendimento mais personalizado, acolhedor e pensado nos detalhes para você.',
  ],
  // Separado dos outros parágrafos porque se lê diferente: o resto é convite,
  // este é compromisso. Na tela ele ganha caixa própria.
  privacidade:
    '🔐 Sua privacidade é prioridade. Todos os dados fornecidos serão tratados com responsabilidade, segurança e confidencialidade, de acordo com a Lei nº 13.709/2018 — Lei Geral de Proteção de Dados Pessoais (LGPD).',
  chamada: ['Agora, queremos ouvir você.', 'Vamos começar? 💙'],
}

export const PERGUNTAS = [
  {
    id: 'nome',
    tipo: 'texto',
    rotulo: 'Nome e sobrenome',
    obrigatoria: true,
    // Vem preenchido do cadastro, mas continua editável: errar nome é comum.
    ajuda: 'Confirme se está escrito corretamente.',
    placeholder: 'Seu nome e sobrenome',
  },
  {
    id: 'apelido',
    tipo: 'texto',
    rotulo: 'Como você gosta de ser chamado?',
    placeholder: 'O nome que usam com você',
  },
  {
    id: 'musica',
    tipo: 'texto',
    rotulo: 'Qual música ou vídeo musical você gosta de ouvir?',
    ajuda: 'A gente coloca durante o atendimento, se você quiser.',
    placeholder: 'Artista, estilo, playlist…',
  },
  {
    id: 'hobby',
    tipo: 'sim-nao',
    rotulo: 'Tem algum hobby?',
    opcoes: [
      { id: 'sim', rotulo: 'Sim', abre: true },
      { id: 'nao', rotulo: 'Não' },
    ],
    detalhe: { rotulo: 'Qual?', placeholder: 'Conte para a gente', obrigatoria: true },
  },
  {
    id: 'time',
    tipo: 'sim-nao',
    rotulo: 'Torce para algum time de futebol?',
    opcoes: [
      { id: 'sim', rotulo: 'Sim', abre: true },
      { id: 'nao', rotulo: 'Não' },
    ],
    detalhe: { rotulo: 'Qual?', placeholder: 'Nome do time', obrigatoria: true },
  },
  {
    id: 'bebida',
    tipo: 'escolha',
    rotulo: 'O que você gostaria que servíssemos aqui na clínica?',
    ajuda: 'Escolha uma. A gente já deixa separado para o seu horário.',
    // Dois níveis: primeiro a categoria, depois qual. O papel mostrava as
    // dezessete opções de uma vez; no celular isso é uma parede que se rola.
    // Um grupo sem opções é escolha completa por si só.
    grupos: [
      {
        id: 'agua',
        titulo: 'Água',
        opcoes: [
          { id: 'agua-sem-gas', rotulo: 'Sem gás' },
          { id: 'agua-com-gas', rotulo: 'Com gás' },
        ],
      },
      {
        id: 'cha',
        titulo: 'Chá',
        opcoes: [
          { id: 'cha-quente', rotulo: 'Quente' },
          { id: 'cha-gelado', rotulo: 'Gelado' },
        ],
      },
      {
        id: 'cafe',
        titulo: 'Café',
        opcoes: [
          { id: 'cafe-com-acucar', rotulo: 'Com açúcar' },
          { id: 'cafe-sem-acucar', rotulo: 'Sem açúcar' },
          { id: 'cafe-desc-com-acucar', rotulo: 'Descafeinado, com açúcar' },
          { id: 'cafe-desc-sem-acucar', rotulo: 'Descafeinado, sem açúcar' },
        ],
      },
      {
        id: 'cappuccino',
        titulo: 'Cappuccino',
        opcoes: [
          { id: 'cappuccino-com-acucar', rotulo: 'Com açúcar' },
          { id: 'cappuccino-sem-acucar', rotulo: 'Sem açúcar' },
        ],
      },
      {
        id: 'refrigerante',
        titulo: 'Refrigerante',
        opcoes: [
          { id: 'coca', rotulo: 'Coca-Cola' },
          { id: 'coca-zero', rotulo: 'Coca-Cola Zero' },
        ],
      },
      {
        id: 'cerveja',
        titulo: 'Cerveja',
        opcoes: [
          { id: 'corona', rotulo: 'Corona' },
          { id: 'heineken', rotulo: 'Heineken' },
        ],
      },
      { id: 'nada', titulo: 'Prefiro não beber nada', opcoes: [] },
    ],
  },
]

/**
 * O que falta responder numa pergunta. Devolve a mensagem ou null.
 *
 * Fica junto das perguntas porque é parte da definição delas: quem adiciona
 * uma pergunta nova precisa dizer, no mesmo lugar, o que a torna respondida.
 */
export function validar(pergunta, resposta) {
  const valor = resposta?.valor
  const detalhe = resposta?.detalhe

  if (pergunta.tipo === 'texto') {
    if (pergunta.obrigatoria && !valor?.trim()) return 'Preencha este campo.'
    return null
  }

  if (pergunta.tipo === 'sim-nao') {
    if (!valor) return 'Escolha uma opção.'
    const escolhida = pergunta.opcoes.find((o) => o.id === valor)
    if (escolhida?.abre && pergunta.detalhe?.obrigatoria && !detalhe?.trim()) {
      return 'Conte qual.'
    }
    return null
  }

  if (pergunta.tipo === 'escolha') {
    const grupo = grupoDe(pergunta, resposta)
    if (!grupo) return 'Escolha uma opção.'
    // Categoria sem sub-opções já é a resposta inteira.
    if (grupo.opcoes.length && !valor) {
      return `Escolha uma das opções de ${grupo.titulo.toLowerCase()}.`
    }
    return null
  }

  return null
}

/** A categoria escolhida numa pergunta de dois níveis. */
export function grupoDe(pergunta, resposta) {
  return pergunta.grupos?.find((g) => g.id === resposta?.grupo) ?? null
}

/** Todas as opções de uma pergunta, sem separar por grupo. */
export function opcoesDe(pergunta) {
  return pergunta.grupos?.flatMap((g) => g.opcoes) ?? pergunta.opcoes ?? []
}

/** O texto de uma resposta, para mostrar na revisão e no painel. */
export function respostaEmTexto(pergunta, resposta) {
  if (pergunta.tipo === 'escolha') {
    const grupo = grupoDe(pergunta, resposta)
    if (!grupo) return null
    if (!grupo.opcoes.length) return grupo.titulo

    const escolhida = grupo.opcoes.find((o) => o.id === resposta.valor)
    // "Café · Sem açúcar" diz mais que "Sem açúcar" sozinho, que fora da
    // categoria não significa nada.
    return escolhida ? `${grupo.titulo} · ${escolhida.rotulo}` : null
  }

  if (!resposta?.valor) return null

  if (pergunta.tipo === 'texto') return resposta.valor.trim() || null

  const escolhida = opcoesDe(pergunta).find((o) => o.id === resposta.valor)
  if (!escolhida) return null

  return escolhida.abre && resposta.detalhe?.trim()
    ? `${escolhida.rotulo} — ${resposta.detalhe.trim()}`
    : escolhida.rotulo
}
