import { z } from 'zod'
import {
  createOrder,
  getOrderById,
  listOrders,
  listOrdersByUserId,
} from '../../services/orderService'
import { requireMcpAuth } from '../auth'
import { toolError } from '../toolError'

export const orderToolDefs = [
  {
    name: 'listOrders',
    description: 'List all orders. Requires a valid Clerk JWT (admin).',
    schema: {
      token: z.string().describe('Clerk JWT session token'),
    },
    handler: async (params: { token: string }) => {
      try {
        await requireMcpAuth(params.token)
        const orders = await listOrders()
        return { content: [{ type: 'text' as const, text: JSON.stringify(orders, null, 2) }] }
      } catch (err) {
        return { content: [{ type: 'text' as const, text: toolError(err) }], isError: true }
      }
    },
  },
  {
    name: 'getOrder',
    description: 'Get a single order by ID. Requires a valid Clerk JWT.',
    schema: {
      token: z.string().describe('Clerk JWT session token'),
      id: z.string().describe('Order ObjectId'),
    },
    handler: async (params: { token: string; id: string }) => {
      try {
        await requireMcpAuth(params.token)
        const order = await getOrderById(params.id)
        return { content: [{ type: 'text' as const, text: JSON.stringify(order, null, 2) }] }
      } catch (err) {
        return { content: [{ type: 'text' as const, text: toolError(err) }], isError: true }
      }
    },
  },
  {
    name: 'getUserOrders',
    description: "Get orders for a specific user. Requires a valid Clerk JWT.",
    schema: {
      token: z.string().describe('Clerk JWT session token'),
      userId: z.string().describe('User ObjectId'),
    },
    handler: async (params: { token: string; userId: string }) => {
      try {
        await requireMcpAuth(params.token)
        const orders = await listOrdersByUserId(params.userId)
        return { content: [{ type: 'text' as const, text: JSON.stringify(orders, null, 2) }] }
      } catch (err) {
        return { content: [{ type: 'text' as const, text: toolError(err) }], isError: true }
      }
    },
  },
  {
    name: 'createOrder',
    description: 'Create a new order. Requires a valid Clerk JWT (authenticated user).',
    schema: {
      token: z.string().describe('Clerk JWT session token'),
      userId: z.string().describe('User ObjectId'),
      items: z.array(
        z.object({
          productId: z.string().describe('Product ObjectId'),
          quantity: z.number().int().gt(0),
        }),
      ).min(1),
    },
    handler: async (params: {
      token: string
      userId: string
      items: Array<{ productId: string; quantity: number }>
    }) => {
      try {
        await requireMcpAuth(params.token)
        const order = await createOrder({ userId: params.userId, items: params.items })
        return { content: [{ type: 'text' as const, text: JSON.stringify(order, null, 2) }] }
      } catch (err) {
        return { content: [{ type: 'text' as const, text: toolError(err) }], isError: true }
      }
    },
  },
] as const
