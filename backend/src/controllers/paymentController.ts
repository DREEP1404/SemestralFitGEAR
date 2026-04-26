import type { Request, Response } from 'express'
import { asyncHandler } from '../utils/asyncHandler'
import {
  confirmCheckoutPayment,
  constructWebhookEvent,
  createCheckoutSession,
  handleStripeEvent,
} from '../services/paymentService'

export const createCheckoutSessionController = asyncHandler(
  async (_req: Request, res: Response) => {
    const { orderId } = res.locals.validatedBody as { orderId: string }
    const session = await createCheckoutSession(orderId)
    res.status(200).json(session)
  },
)

export const confirmCheckoutPaymentController = asyncHandler(
  async (_req: Request, res: Response) => {
    const { orderId, sessionId } = res.locals.validatedBody as {
      orderId: string
      sessionId?: string
    }

    const result = await confirmCheckoutPayment(orderId, sessionId)
    res.status(200).json(result)
  },
)

export const stripeWebhookController = asyncHandler(async (req: Request, res: Response) => {
  const signatureHeader = req.headers['stripe-signature']
  const signature = Array.isArray(signatureHeader)
    ? signatureHeader[0]
    : signatureHeader

  const rawPayload = Buffer.isBuffer(req.body)
    ? req.body
    : typeof req.body === 'string'
      ? Buffer.from(req.body)
      : req.body instanceof Uint8Array
        ? Buffer.from(req.body)
        : Buffer.from(JSON.stringify(req.body ?? {}))

  const event = await constructWebhookEvent(rawPayload, signature)
  await handleStripeEvent(event)

  res.status(200).json({ received: true })
})
