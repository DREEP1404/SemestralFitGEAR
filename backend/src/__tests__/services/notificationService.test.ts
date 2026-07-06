import { describe, it, expect, mock, beforeEach, afterEach } from 'bun:test'

// Audit writes go to Mongo in production — mock the model so tests need no DB.
const mockCreate = mock(async () => ({ id: 'log_1' }))
const mockFindByIdAndUpdate = mock(async () => ({}))
mock.module('../../models/NotificationLog', () => ({
  NotificationLogModel: { create: mockCreate, findByIdAndUpdate: mockFindByIdAndUpdate },
}))

const { env } = await import('../../config/env')
const { sendNotification } = await import('../../services/notificationService')

interface FakeResponse {
  ok: boolean
  status: number
  json: () => Promise<{ id?: string }>
  text: () => Promise<string>
}
const okResponse = (id = 'email_123'): FakeResponse => ({
  ok: true,
  status: 200,
  json: async () => ({ id }),
  text: async () => '',
})
const errResponse = (status = 500): FakeResponse => ({
  ok: false,
  status,
  json: async () => ({}),
  text: async () => 'provider error',
})

const originalFetch = globalThis.fetch
const mockFetch = mock(async () => okResponse())

const message = { type: 'TEST', to: 'user@example.com', subject: 'Hola', html: '<p>hola</p>' }

describe('sendNotification (email + retry/backoff + graceful fallback)', () => {
  beforeEach(() => {
    mockCreate.mockClear()
    mockFindByIdAndUpdate.mockClear()
    mockFetch.mockClear()
    mockFetch.mockImplementation(async () => okResponse())
    // @ts-expect-error test override of the global fetch
    globalThis.fetch = mockFetch
    env.resendApiKey = 'test_resend_key'
  })

  afterEach(() => {
    globalThis.fetch = originalFetch
  })

  it('graceful fallback: skips the send (no fetch) when RESEND_API_KEY is missing', async () => {
    env.resendApiKey = undefined

    const result = await sendNotification(message)

    expect(result.status).toBe('skipped')
    expect(mockFetch).not.toHaveBeenCalled()
    expect(mockFindByIdAndUpdate).toHaveBeenCalledWith(
      'log_1',
      expect.objectContaining({ status: 'skipped' }),
    )
  })

  it('sends successfully on the first attempt and records the provider id', async () => {
    const result = await sendNotification(message, { baseBackoffMs: 1 })

    expect(result).toMatchObject({ status: 'sent', attempts: 1, providerMessageId: 'email_123' })
    expect(mockFetch).toHaveBeenCalledTimes(1)
    expect(mockFindByIdAndUpdate).toHaveBeenLastCalledWith(
      'log_1',
      expect.objectContaining({ status: 'sent', attempts: 1 }),
    )
  })

  it('retries with backoff and succeeds on the second attempt', async () => {
    mockFetch.mockImplementationOnce(async () => errResponse(500))

    const result = await sendNotification(message, { baseBackoffMs: 1 })

    expect(result).toMatchObject({ status: 'sent', attempts: 2 })
    expect(mockFetch).toHaveBeenCalledTimes(2)
  })

  it('gives up as failed after exactly 3 attempts', async () => {
    mockFetch.mockImplementation(async () => errResponse(500))

    const result = await sendNotification(message, { baseBackoffMs: 1 })

    expect(result.status).toBe('failed')
    expect(result.attempts).toBe(3)
    expect(mockFetch).toHaveBeenCalledTimes(3)
    expect(mockFindByIdAndUpdate).toHaveBeenLastCalledWith(
      'log_1',
      expect.objectContaining({ status: 'failed', attempts: 3 }),
    )
  })
})
