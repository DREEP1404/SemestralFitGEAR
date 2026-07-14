import { describe, it, expect } from 'bun:test'
import {
  createPaymentIntentSchema,
  confirmPaymentSchema,
} from '../../validations/paymentValidation'

const VALID_ID = '507f1f77bcf86cd799439011'

describe('createPaymentIntentSchema', () => {
  it('accepts a valid orderId', () => {
    const result = createPaymentIntentSchema.safeParse({ orderId: VALID_ID })
    expect(result.success).toBe(true)
  })

  it('rejects invalid orderId format', () => {
    const result = createPaymentIntentSchema.safeParse({ orderId: 'bad-id' })
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues[0].path).toContain('orderId')
    }
  })

  it('rejects XSS attempt in orderId', () => {
    const result = createPaymentIntentSchema.safeParse({
      orderId: '<script>alert(1)</script>',
    })
    expect(result.success).toBe(false)
  })

  it('rejects SQL injection in orderId', () => {
    const result = createPaymentIntentSchema.safeParse({
      orderId: "'; DROP TABLE orders; --",
    })
    expect(result.success).toBe(false)
  })

  it('rejects missing orderId', () => {
    const result = createPaymentIntentSchema.safeParse({})
    expect(result.success).toBe(false)
  })
})

describe('confirmPaymentSchema', () => {
  it('accepts valid orderId with paymentIntentId', () => {
    const result = confirmPaymentSchema.safeParse({
      orderId: VALID_ID,
      paymentIntentId: 'pi_test_abc123',
    })
    expect(result.success).toBe(true)
  })

  it('accepts valid orderId without paymentIntentId', () => {
    const result = confirmPaymentSchema.safeParse({ orderId: VALID_ID })
    expect(result.success).toBe(true)
  })

  it('rejects invalid orderId', () => {
    const result = confirmPaymentSchema.safeParse({
      orderId: 'not-valid',
      paymentIntentId: 'pi_test_abc',
    })
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues[0].path).toContain('orderId')
    }
  })

  it('rejects empty paymentIntentId string', () => {
    const result = confirmPaymentSchema.safeParse({
      orderId: VALID_ID,
      paymentIntentId: '',
    })
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues[0].path).toContain('paymentIntentId')
    }
  })

  it('rejects paymentIntentId exceeding 500 characters', () => {
    const result = confirmPaymentSchema.safeParse({
      orderId: VALID_ID,
      paymentIntentId: 'p'.repeat(501),
    })
    expect(result.success).toBe(false)
  })

  it('rejects XSS in orderId', () => {
    const result = confirmPaymentSchema.safeParse({
      orderId: '<script>alert(1)</script>',
    })
    expect(result.success).toBe(false)
  })
})
