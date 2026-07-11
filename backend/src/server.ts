import { connectDatabase } from './config/db'
import { env } from './config/env'
import { app } from './app'
import { logger } from './utils/logger'

try {
  await connectDatabase()
} catch (error) {
  logger.error('Failed to start server', { error })
  process.exit(1)
}

Bun.serve({
  port: env.port,
  fetch: app.fetch,
})

logger.info('FITGEAR API running', { url: `http://localhost:${env.port}` })
