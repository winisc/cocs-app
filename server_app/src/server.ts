import 'dotenv/config'
import { buildApp } from './app'
import { env } from './shared/config/env'

async function start() {
  const app = await buildApp()

  try {
    await app.listen({ host: env.HOST, port: env.PORT })
    app.log.info(`API COCS pronta em http://${env.HOST}:${env.PORT}`)
  } catch (error) {
    app.log.error(error)
    process.exit(1)
  }
}

void start()
