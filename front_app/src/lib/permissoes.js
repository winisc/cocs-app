export const ROLES = {
  ADMIN: 'admin',
  DENTISTA: 'dentista',
  RECEPCAO: 'recepcao',
}

export const PERMISSOES = {
  usuarios: [ROLES.ADMIN],
  pacientes: [ROLES.ADMIN, ROLES.DENTISTA, ROLES.RECEPCAO],
  anamnese: [ROLES.ADMIN, ROLES.RECEPCAO],
  visualizarAnamnesePaciente: [ROLES.ADMIN, ROLES.DENTISTA, ROLES.RECEPCAO],
  criarAnamnese: [ROLES.ADMIN, ROLES.RECEPCAO],
  excluirAnamnese: [ROLES.ADMIN],
  gerenciarPacientes: [ROLES.ADMIN, ROLES.RECEPCAO],
  excluirPacientes: [ROLES.ADMIN],
}

export function papelDo(usuario) {
  return usuario?.papel ?? usuario?.role ?? null
}

export function pode(usuario, permissao) {
  const papel = papelDo(usuario)
  return Boolean(papel && PERMISSOES[permissao]?.includes(papel))
}
