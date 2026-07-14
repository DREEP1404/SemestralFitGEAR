import { z } from 'zod'
import { objectIdSchema } from './commonValidation'

export const createPaymentIntentSchema = z.object({
  orderId: objectIdSchema,
})

export const confirmPaymentSchema = z.object({
  orderId: objectIdSchema,
  paymentIntentId: z
    .string()
    .trim()
    .min(1, 'paymentIntentId cannot be empty')
    .max(500, 'paymentIntentId is too long')
    .optional(),
})
