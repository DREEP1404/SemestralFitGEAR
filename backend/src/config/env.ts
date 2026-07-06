import dotenv from 'dotenv'

dotenv.config()

function requireEnv(name: string, fallback?: string): string {
  const value = process.env[name] ?? fallback
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`)
  }
  return value
}

export const env = {
  nodeEnv: process.env.NODE_ENV ?? 'development',
  port: Number(process.env.PORT ?? 4000),
  mongodbUri: requireEnv('MONGODB_URI', 'mongodb://127.0.0.1:27017/fitgear'),
  frontendUrl: process.env.FRONTEND_URL ?? 'http://localhost:5173',
  backendUrl: process.env.BACKEND_URL ?? `http://localhost:${Number(process.env.PORT ?? 4000)}`,
  stripeSecretKey: process.env.STRIPE_SECRET_KEY,
  stripeWebhookSecret: process.env.STRIPE_WEBHOOK_SECRET,
  clerkSecretKey: process.env.CLERK_SECRET_KEY,
  // Transactional email (Resend). When RESEND_API_KEY is absent the email
  // service degrades gracefully (logs instead of sending) so dev/test never break.
  resendApiKey: process.env.RESEND_API_KEY,
  emailFrom: process.env.EMAIL_FROM ?? 'FITGEAR <onboarding@resend.dev>',
}
