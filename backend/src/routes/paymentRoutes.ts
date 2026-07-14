import { Hono } from 'hono'
import type { AppEnv } from '../app'
import {
  confirmPaymentController,
  createPaymentIntentController,
} from '../controllers/paymentController'
import { requireAuthMiddleware } from '../middlewares/requireAuth'
import { validateBody } from '../middlewares/validate'
import {
  confirmPaymentSchema,
  createPaymentIntentSchema,
} from '../validations/paymentValidation'

export const paymentRouter = new Hono<AppEnv>()

// Checkout actions require a valid Clerk JWT (the Stripe webhook is
// registered separately in app.ts, before this router, and is unauthenticated).
paymentRouter.use('*', requireAuthMiddleware())

paymentRouter.post(
  '/create-payment-intent',
  validateBody(createPaymentIntentSchema),
  createPaymentIntentController,
)

paymentRouter.post(
  '/confirm-payment',
  validateBody(confirmPaymentSchema),
  confirmPaymentController,
)
