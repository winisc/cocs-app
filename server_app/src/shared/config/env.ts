const DEFAULT_PORT = 3333
const NODE_ENV = process.env.NODE_ENV ?? 'development'

function required(name: string, fallback?: string) {
  const value = process.env[name] ?? fallback
  if (!value) throw new Error(`Variavel de ambiente obrigatoria ausente: ${name}`)
  return value
}

function numberEnv(name: string, fallback: number) {
  const value = Number(process.env[name] ?? fallback)
  if (!Number.isFinite(value)) throw new Error(`Variavel de ambiente invalida: ${name}`)
  return value
}

function corsOrigins() {
  const value = process.env.CORS_ORIGIN
  if (!value) {
    if (NODE_ENV === 'production') throw new Error('CORS_ORIGIN obrigatorio em producao.')
    return true
  }
  return value.split(',').map((origin) => origin.trim()).filter(Boolean)
}

export const env = {
  NODE_ENV,
  HOST: process.env.HOST ?? '127.0.0.1',
  PORT: numberEnv('PORT', DEFAULT_PORT),
  JWT_SECRET: required('JWT_SECRET', NODE_ENV === 'production' ? undefined : 'dev-cocs-secret'),
  CORS_ORIGIN: corsOrigins(),
  DATABASE_URL: required(
    'DATABASE_URL',
    NODE_ENV === 'production' ? undefined : 'postgres://cocs:cocs@127.0.0.1:5432/cocs',
  ),
}
