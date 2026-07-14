import type { Context } from 'hono'
import type { AppEnv } from '../app'
import {
  confirmPayment,
  constructWebhookEvent,
  createPaymentIntent,
  handleStripeEvent,
} from '../services/paymentService'

export const createPaymentIntentController = async (c: Context<AppEnv>) => {
  const { orderId } = c.get('validatedBody') as { orderId: string }
  const paymentIntent = await createPaymentIntent(orderId)
  return c.json(paymentIntent, 200)
}

export const confirmPaymentController = async (c: Context<AppEnv>) => {
  const { orderId, paymentIntentId } = c.get('validatedBody') as {
    orderId: string
    paymentIntentId?: string
  }
  const result = await confirmPayment(orderId, paymentIntentId)
  return c.json(result, 200)
}

export const stripeWebhookController = async (c: Context<AppEnv>) => {
  const signature = c.req.header('stripe-signature')
  // c.req.text() preserves the exact raw body bytes Stripe signed. Re-encoding
  // via arrayBuffer()/Buffer under Bun breaks signature verification.
  const rawBody = await c.req.text()

  const event = await constructWebhookEvent(rawBody, signature)
  await handleStripeEvent(event)

  return c.json({ received: true }, 200)
}
