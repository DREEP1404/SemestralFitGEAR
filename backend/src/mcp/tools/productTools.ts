import { z } from 'zod'
import { getProductById, listProducts } from '../../services/productService'
import { toolError } from '../toolError'

export const productToolDefs = [
  {
    name: 'listProducts',
    description: 'List products from the catalog. Public — no token required.',
    schema: {
      search: z.string().optional().describe('Search by name'),
      categoryId: z.string().optional().describe('Filter by category ObjectId'),
      sortBy: z.enum(['createdAt', 'name', 'price']).optional(),
      sortOrder: z.enum(['asc', 'desc']).optional(),
    },
    handler: async (params: {
      search?: string
      categoryId?: string
      sortBy?: 'createdAt' | 'name' | 'price'
      sortOrder?: 'asc' | 'desc'
    }) => {
      try {
        const products = await listProducts(params)
        return { content: [{ type: 'text' as const, text: JSON.stringify(products, null, 2) }] }
      } catch (err) {
        return { content: [{ type: 'text' as const, text: toolError(err) }], isError: true }
      }
    },
  },
  {
    name: 'getProduct',
    description: 'Get a single product by ID. Public — no token required.',
    schema: {
      id: z.string().describe('Product ObjectId (24-char hex)'),
    },
    handler: async (params: { id: string }) => {
      try {
        const product = await getProductById(params.id)
        return { content: [{ type: 'text' as const, text: JSON.stringify(product, null, 2) }] }
      } catch (err) {
        return { content: [{ type: 'text' as const, text: toolError(err) }], isError: true }
      }
    },
  },
] as const
