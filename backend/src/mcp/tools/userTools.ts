import { z } from 'zod'
import { getUserById, listUsers } from '../../services/userService'
import { requireMcpAuth } from '../auth'
import { toolError } from '../toolError'

export const userToolDefs = [
  {
    name: 'listUsers',
    description: 'List all registered users. Requires a valid Clerk JWT (admin).',
    schema: {
      token: z.string().describe('Clerk JWT session token'),
    },
    handler: async (params: { token: string }) => {
      try {
        await requireMcpAuth(params.token)
        const users = await listUsers()
        return { content: [{ type: 'text' as const, text: JSON.stringify(users, null, 2) }] }
      } catch (err) {
        return { content: [{ type: 'text' as const, text: toolError(err) }], isError: true }
      }
    },
  },
  {
    name: 'getUser',
    description: 'Get a user by ID. Requires a valid Clerk JWT.',
    schema: {
      token: z.string().describe('Clerk JWT session token'),
      id: z.string().describe('User ObjectId'),
    },
    handler: async (params: { token: string; id: string }) => {
      try {
        await requireMcpAuth(params.token)
        const user = await getUserById(params.id)
        return { content: [{ type: 'text' as const, text: JSON.stringify(user, null, 2) }] }
      } catch (err) {
        return { content: [{ type: 'text' as const, text: toolError(err) }], isError: true }
      }
    },
  },
] as const
