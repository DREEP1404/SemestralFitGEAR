import { createClerkClient } from '@clerk/backend'
import { env } from '../config/env'

export interface AuthContext {
  userId: string | null
  authenticated: boolean
}

let _clerk: ReturnType<typeof createClerkClient> | null = null

function getClerk() {
  if (!env.clerkSecretKey) return null
  if (!_clerk) _clerk = createClerkClient({ secretKey: env.clerkSecretKey })
  return _clerk
}

/**
 * Soft-auth: extracts and validates a Clerk JWT when present.
 * Returns { authenticated: false } if no token is provided or if CLERK_SECRET_KEY
 * is not configured — does NOT throw. Use requireAuthStrict for protected tools.
 */
export async function requireAuth(bearerToken?: string): Promise<AuthContext> {
  if (!bearerToken) return { userId: null, authenticated: false }

  const clerk = getClerk()
  if (!clerk) return { userId: null, authenticated: false }

  try {
    const token = bearerToken.replace(/^Bearer\s+/i, '')
    const payload = await clerk.verifyToken(token)
    return { userId: payload.sub, authenticated: true }
  } catch {
    return { userId: null, authenticated: false }
  }
}

/**
 * Strict-auth: throws if the token is missing or invalid.
 * Use this for tools that require authentication.
 */
export async function requireAuthStrict(bearerToken?: string): Promise<AuthContext> {
  const ctx = await requireAuth(bearerToken)
  if (!ctx.authenticated) throw new Error('Unauthorized: valid Clerk JWT required')
  return ctx
}
