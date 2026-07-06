import { env } from '../config/env'
import { NotificationLogModel } from '../models/NotificationLog'

const RESEND_ENDPOINT = 'https://api.resend.com/emails'
const DEFAULT_MAX_ATTEMPTS = 3
const DEFAULT_BASE_BACKOFF_MS = 500

export interface EmailMessage {
  to: string
  subject: string
  html: string
  text?: string
}

export interface NotificationInput extends EmailMessage {
  /** Business event that triggered the email, e.g. 'PAYMENT_FAILED'. */
  type: string
  orderId?: string
}

export interface RetryOptions {
  maxAttempts?: number
  baseBackoffMs?: number
}

export interface NotificationResult {
  status: 'sent' | 'failed' | 'skipped'
  attempts: number
  providerMessageId?: string
  error?: string
}

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

// One delivery attempt against the Resend REST API. Throws on any non-2xx or
// network error so the retry loop can decide whether to try again.
async function deliverViaResend(message: EmailMessage): Promise<string | undefined> {
  const response = await fetch(RESEND_ENDPOINT, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${env.resendApiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: env.emailFrom,
      to: message.to,
      subject: message.subject,
      html: message.html,
      ...(message.text ? { text: message.text } : {}),
    }),
  })

  if (!response.ok) {
    const body = await response.text().catch(() => '')
    throw new Error(`Resend responded ${response.status}: ${body.slice(0, 300)}`)
  }

  const data = (await response.json().catch(() => ({}))) as { id?: string }
  return data.id
}

// Audit writes are best-effort — they must never break the email flow itself.
async function safeUpdateLog(logId: string, update: Record<string, unknown>) {
  try {
    await NotificationLogModel.findByIdAndUpdate(logId, update)
  } catch (error) {
    console.error('[notification] failed to update audit log', { logId, error })
  }
}

/**
 * Sends a transactional email with an at-most-`maxAttempts` retry loop using
 * exponential backoff, and records the outcome in the NotificationLog audit
 * trail. Graceful fallback: when RESEND_API_KEY is not configured the email is
 * logged and recorded as `skipped` (never throws) so dev/test keep working.
 *
 * Prefer `dispatchNotification` from request/webhook handlers so the send never
 * blocks the HTTP response.
 */
export async function sendNotification(
  input: NotificationInput,
  options: RetryOptions = {},
): Promise<NotificationResult> {
  const maxAttempts = options.maxAttempts ?? DEFAULT_MAX_ATTEMPTS
  const baseBackoffMs = options.baseBackoffMs ?? DEFAULT_BASE_BACKOFF_MS

  // Create the audit record up-front so a crash mid-send still leaves a trace.
  let logId: string | undefined
  try {
    const log = await NotificationLogModel.create({
      type: input.type,
      channel: 'EMAIL',
      to: input.to,
      subject: input.subject,
      status: 'pending',
      attempts: 0,
      orderId: input.orderId,
    })
    logId = log.id
  } catch (error) {
    console.error('[notification] failed to create audit log', error)
  }

  // Graceful fallback — no provider key configured.
  if (!env.resendApiKey) {
    console.warn(
      `[notification] RESEND_API_KEY missing — email "${input.subject}" to ${input.to} NOT sent (dev fallback)`,
    )
    if (logId) await safeUpdateLog(logId, { status: 'skipped', attempts: 0 })
    return { status: 'skipped', attempts: 0 }
  }

  let lastError: string | undefined

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const providerMessageId = await deliverViaResend(input)
      if (logId) {
        await safeUpdateLog(logId, {
          status: 'sent',
          attempts: attempt,
          sentAt: new Date(),
          providerMessageId,
          lastError: undefined,
        })
      }
      return { status: 'sent', attempts: attempt, providerMessageId }
    } catch (error) {
      lastError = error instanceof Error ? error.message : String(error)
      console.error(
        `[notification] attempt ${attempt}/${maxAttempts} failed for "${input.subject}" -> ${input.to}: ${lastError}`,
      )

      // Exponential backoff between attempts (e.g. 500ms, 1000ms) — skip after the last try.
      if (attempt < maxAttempts) {
        await delay(baseBackoffMs * 2 ** (attempt - 1))
      }
    }
  }

  if (logId) await safeUpdateLog(logId, { status: 'failed', attempts: maxAttempts, lastError })
  return { status: 'failed', attempts: maxAttempts, error: lastError }
}

/**
 * Fire-and-forget wrapper for request/webhook paths: dispatches the send in the
 * background so it never blocks the HTTP response (the "async, non-blocking"
 * acceptance criterion). Failures are logged and audited, never thrown.
 */
export function dispatchNotification(input: NotificationInput, options: RetryOptions = {}): void {
  void sendNotification(input, options).catch((error) => {
    console.error('[notification] unexpected dispatch failure', error)
  })
}
