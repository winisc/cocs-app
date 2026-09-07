export const ROLES = {
  ADMIN: 'admin',
  DENTISTA: 'dentista',
  RECEPCAO: 'recepcao',
} as const

export type Role = (typeof ROLES)[keyof typeof ROLES]

export const TODAS_AS_ROLES: Role[] = [ROLES.ADMIN, ROLES.DENTISTA, ROLES.RECEPCAO]
export const ROLES_ATENDIMENTO: Role[] = [ROLES.ADMIN, ROLES.DENTISTA, ROLES.RECEPCAO]
export const ROLES_LISTAM_ANAMNESES: Role[] = [ROLES.ADMIN, ROLES.RECEPCAO]
export const ROLES_CRIAM_ANAMNESE: Role[] = [ROLES.ADMIN, ROLES.RECEPCAO]
export const ROLES_EXCLUEM_ANAMNESE: Role[] = [ROLES.ADMIN]
export const ROLES_GERENCIAM_PACIENTES: Role[] = [ROLES.ADMIN, ROLES.RECEPCAO]
