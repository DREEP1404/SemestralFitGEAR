import { HttpError } from '../utils/httpError'
import { McpAuthError } from './auth'

export function toolError(err: unknown): string {
  if (err instanceof McpAuthError) return err.message
  if (err instanceof HttpError) return `Error ${err.statusCode}: ${err.message}`
  if (err instanceof Error) return err.message
  return 'Unknown error'
}
