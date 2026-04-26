import { Schema, model, type InferSchemaType } from 'mongoose'

const stripeWebhookEventSchema = new Schema(
  {
    eventId: { type: String, required: true, unique: true, index: true },
    eventType: { type: String, required: true, index: true },
    apiVersion: { type: String, required: false },
    stripeCreatedAt: { type: Date, required: true },
    livemode: { type: Boolean, required: true },
    processingState: {
      type: String,
      enum: ['received', 'processing', 'processed', 'failed'],
      required: true,
      default: 'received',
      index: true,
    },
    deliveryCount: { type: Number, required: true, default: 0 },
    processingStartedAt: { type: Date, required: false },
    processedAt: { type: Date, required: false },
    lastReceivedAt: { type: Date, required: false },
    errorMessage: { type: String, required: false },
    data: {
      orderId: { type: String, required: false },
      customerId: { type: String, required: false },
      customerEmail: { type: String, required: false },
      amountTotal: { type: Number, required: false },
      currency: { type: String, required: false },
      sessionId: { type: String, required: false },
      paymentIntentId: { type: String, required: false },
      paymentStatus: { type: String, required: false },
      rawObjectType: { type: String, required: false },
    },
    payload: { type: Schema.Types.Mixed, required: true },
  },
  { timestamps: true },
)

export type StripeWebhookEventDocument = InferSchemaType<typeof stripeWebhookEventSchema>
export const StripeWebhookEventModel = model<StripeWebhookEventDocument>(
  'StripeWebhookEvent',
  stripeWebhookEventSchema,
)