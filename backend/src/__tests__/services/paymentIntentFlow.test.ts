import { describe, it, expect, mock, beforeEach } from 'bun:test'

// --- Mocks registered before importing paymentService ----------------------

// Stripe client: getStripeClient().paymentIntents.{create,retrieve}(...).
const mockPaymentIntentCreate = mock(async () => ({
  id: 'pi_test_new',
  client_secret: 'pi_test_new_secret',
  amount: 2131,
}))
const mockPaymentIntentRetrieve = mock(async () => ({
  id: 'pi_test_existing',
  status: 'succeeded',
  amount: 2131,
  client_secret: 'pi_test_existing_secret',
  metadata: { orderId: 'order_abcdef' },
}))
mock.module('../../config/stripe', () => ({
  getStripeClient: () => ({
    paymentIntents: { create: mockPaymentIntentCreate, retrieve: mockPaymentIntentRetrieve },
  }),
}))

// Order model: findById().populate() -> order document; findByIdAndUpdate() persists the PI id.
const fakeOrder: Record<string, unknown> = {}
const mockOrderPopulate = mock(async () => fakeOrder as unknown)
const mockOrderFindById = mock(() => ({ populate: mockOrderPopulate }))
const mockOrderFindByIdAndUpdate = mock(async () => ({}))
mock.module('../../models/Order', () => ({
  OrderModel: { findById: mockOrderFindById, findByIdAndUpdate: mockOrderFindByIdAndUpdate },
}))

// OrderItem model: .select() backs both the stock check (ensureOrderHasAvailableStock)
// and createPaymentIntent's own amount calculation — same fixture serves both.
let fakeItems: Array<Record<string, unknown>> = []
const mockItemSelect = mock(async () => fakeItems)
const mockItemFind = mock(() => ({ select: mockItemSelect }))
mock.module('../../models/OrderItem', () => ({ OrderItemModel: { find: mockItemFind } }))

// Product model: .select() backs the stock/isActive check in ensureOrderHasAvailableStock.
let fakeProducts: Array<Record<string, unknown>> = []
const mockProductSelect = mock(async () => fakeProducts)
const mockProductFind = mock(() => ({ select: mockProductSelect }))
mock.module('../../models/Product', () => ({ ProductModel: { find: mockProductFind } }))

const { createPaymentIntent, confirmPayment, extractShippingAddressFromPaymentIntent } =
  await import('../../services/paymentService')

const PRODUCT_ID = '507f1f77bcf86cd799439011'

describe('createPaymentIntent', () => {
  beforeEach(() => {
    mockPaymentIntentCreate.mockClear()
    mockPaymentIntentCreate.mockImplementation(async () => ({
      id: 'pi_test_new',
      client_secret: 'pi_test_new_secret',
      amount: 2131,
    }))
    mockPaymentIntentRetrieve.mockClear()
    mockOrderFindById.mockClear()
    mockOrderPopulate.mockClear()
    mockOrderFindByIdAndUpdate.mockClear()
    mockItemFind.mockClear()
    mockItemSelect.mockClear()
    mockProductFind.mockClear()
    mockProductSelect.mockClear()

    Object.keys(fakeOrder).forEach((key) => delete fakeOrder[key])
    Object.assign(fakeOrder, {
      _id: 'order_abcdef',
      status: 'PENDING',
      userId: { email: 'buyer@example.com', role: 'CUSTOMER' },
    })

    // subtotal 19.99 -> tax 1.40 -> shipping 4.99 -> total 26.38 -> 2638 cents.
    fakeItems = [{ productId: PRODUCT_ID, quantity: 1, size: null, unitPrice: 19.99 }]
    fakeProducts = [{ _id: PRODUCT_ID, name: 'Guantes', stock: 5, isActive: true, sizes: [] }]
  })

  it('creates a fresh PaymentIntent when the order has none yet', async () => {
    const result = await createPaymentIntent('order_abcdef')

    expect(mockPaymentIntentRetrieve).not.toHaveBeenCalled()
    expect(mockPaymentIntentCreate).toHaveBeenCalledTimes(1)
    const [params] = mockPaymentIntentCreate.mock.calls[0] as unknown as [
      {
        amount: number
        currency: string
        metadata: { orderId: string }
        payment_method_types: string[]
      },
    ]
    expect(params.metadata).toEqual({ orderId: 'order_abcdef' })
    expect(params.currency).toBe('usd')
    expect(params.payment_method_types).toEqual(['card'])
    // 19.99 -> 1999c, tax 1.40 -> 140c, shipping 4.99 -> 499c = 2638c.
    expect(params.amount).toBe(2638)
    expect(result).toEqual({
      clientSecret: 'pi_test_new_secret',
      paymentIntentId: 'pi_test_new',
      amount: 2638,
      subtotal: 1999,
      taxAmount: 140,
      shippingAmount: 499,
    })
    expect(mockOrderFindByIdAndUpdate).toHaveBeenCalledWith('order_abcdef', {
      stripePaymentIntentId: 'pi_test_new',
      paymentProvider: 'STRIPE',
    })
  })

  it('reuses an existing PaymentIntent that is still payable and matches the amount', async () => {
    fakeOrder.stripePaymentIntentId = 'pi_test_existing'
    mockPaymentIntentRetrieve.mockImplementationOnce(async () => ({
      id: 'pi_test_existing',
      status: 'requires_payment_method',
      amount: 2638,
      client_secret: 'pi_test_existing_secret',
      payment_method_types: ['card'],
    }))

    const result = await createPaymentIntent('order_abcdef')

    expect(mockPaymentIntentRetrieve).toHaveBeenCalledWith('pi_test_existing')
    expect(mockPaymentIntentCreate).not.toHaveBeenCalled()
    expect(mockOrderFindByIdAndUpdate).not.toHaveBeenCalled()
    expect(result).toEqual({
      clientSecret: 'pi_test_existing_secret',
      paymentIntentId: 'pi_test_existing',
      amount: 2638,
      subtotal: 1999,
      taxAmount: 140,
      shippingAmount: 499,
    })
  })

  it('creates a new PaymentIntent when the existing one offers payment methods beyond card (e.g. a pre-card-only or Checkout Session-era intent)', async () => {
    fakeOrder.stripePaymentIntentId = 'pi_test_legacy'
    mockPaymentIntentRetrieve.mockImplementationOnce(async () => ({
      id: 'pi_test_legacy',
      status: 'requires_payment_method',
      amount: 2638,
      client_secret: 'pi_test_legacy_secret',
      payment_method_types: ['card', 'klarna', 'us_bank_account'],
    }))

    const result = await createPaymentIntent('order_abcdef')

    expect(mockPaymentIntentRetrieve).toHaveBeenCalledWith('pi_test_legacy')
    expect(mockPaymentIntentCreate).toHaveBeenCalledTimes(1)
    expect(result.paymentIntentId).toBe('pi_test_new')
  })

  it('creates a new PaymentIntent when the existing one is no longer reusable', async () => {
    fakeOrder.stripePaymentIntentId = 'pi_test_old'
    mockPaymentIntentRetrieve.mockImplementationOnce(async () => ({
      id: 'pi_test_old',
      status: 'canceled',
      amount: 2638,
      client_secret: 'pi_test_old_secret',
    }))

    await createPaymentIntent('order_abcdef')

    expect(mockPaymentIntentRetrieve).toHaveBeenCalledWith('pi_test_old')
    expect(mockPaymentIntentCreate).toHaveBeenCalledTimes(1)
  })

  it('creates a new PaymentIntent when the existing one no longer matches the amount', async () => {
    fakeOrder.stripePaymentIntentId = 'pi_test_stale'
    mockPaymentIntentRetrieve.mockImplementationOnce(async () => ({
      id: 'pi_test_stale',
      status: 'requires_payment_method',
      amount: 1000,
      client_secret: 'pi_test_stale_secret',
    }))

    await createPaymentIntent('order_abcdef')

    expect(mockPaymentIntentCreate).toHaveBeenCalledTimes(1)
  })

  it('rejects an already-paid order', async () => {
    fakeOrder.status = 'PAID'

    await expect(createPaymentIntent('order_abcdef')).rejects.toThrow('Order is already paid')
    expect(mockPaymentIntentCreate).not.toHaveBeenCalled()
  })

  it('rejects a cancelled order', async () => {
    fakeOrder.status = 'CANCELLED'

    await expect(createPaymentIntent('order_abcdef')).rejects.toThrow(
      'Order is cancelled and cannot be paid',
    )
  })
})

describe('confirmPayment', () => {
  beforeEach(() => {
    mockPaymentIntentRetrieve.mockClear()
    mockPaymentIntentRetrieve.mockImplementation(async () => ({
      id: 'pi_test_existing',
      status: 'succeeded',
      amount: 2638,
      metadata: { orderId: 'order_abcdef' },
    }))
    mockOrderFindById.mockClear()
    mockOrderPopulate.mockClear()

    Object.keys(fakeOrder).forEach((key) => delete fakeOrder[key])
    Object.assign(fakeOrder, {
      _id: 'order_abcdef',
      status: 'PENDING',
      stripePaymentIntentId: 'pi_test_existing',
      userId: { email: 'buyer@example.com', role: 'CUSTOMER' },
    })
  })

  it('short-circuits without calling Stripe when the order is already PAID', async () => {
    fakeOrder.status = 'PAID'

    const result = await confirmPayment('order_abcdef')

    expect(result).toEqual({ status: 'PAID' })
    expect(mockPaymentIntentRetrieve).not.toHaveBeenCalled()
  })

  it('throws 409 when the payment intent has not succeeded yet', async () => {
    mockPaymentIntentRetrieve.mockImplementationOnce(async () => ({
      id: 'pi_test_existing',
      status: 'requires_payment_method',
      amount: 2638,
      metadata: { orderId: 'order_abcdef' },
    }))

    await expect(confirmPayment('order_abcdef')).rejects.toThrow('Payment is not confirmed yet')
  })

  it('throws when the payment intent belongs to a different order', async () => {
    mockPaymentIntentRetrieve.mockImplementationOnce(async () => ({
      id: 'pi_test_existing',
      status: 'succeeded',
      amount: 2638,
      metadata: { orderId: 'order_other' },
    }))

    await expect(confirmPayment('order_abcdef')).rejects.toThrow(
      'Payment intent does not belong to this order',
    )
  })

  it('throws when no payment intent id is available', async () => {
    delete fakeOrder.stripePaymentIntentId

    await expect(confirmPayment('order_abcdef')).rejects.toThrow(
      'Missing Stripe payment intent id for this order',
    )
    expect(mockPaymentIntentRetrieve).not.toHaveBeenCalled()
  })

  it('resolves the payment intent id explicitly when provided, over the order default', async () => {
    // Uses a non-succeeded status so this stops at the 409 guard rather than
    // proceeding into markOrderAsPaidAndDeductStock's transactional path,
    // which needs a real Mongo connection and isn't unit-tested here (see
    // the equivalent scoping decision in paymentFailedWebhook.test.ts).
    mockPaymentIntentRetrieve.mockImplementationOnce(async () => ({
      id: 'pi_test_explicit',
      status: 'requires_payment_method',
      amount: 2638,
      metadata: { orderId: 'order_abcdef' },
    }))

    await expect(confirmPayment('order_abcdef', 'pi_test_explicit')).rejects.toThrow(
      'Payment is not confirmed yet',
    )

    expect(mockPaymentIntentRetrieve).toHaveBeenCalledWith('pi_test_explicit')
  })
})

describe('extractShippingAddressFromPaymentIntent', () => {
  it('returns undefined when no shipping was collected', () => {
    expect(extractShippingAddressFromPaymentIntent({ shipping: null })).toBeUndefined()
  })

  it('returns undefined when shipping has no address', () => {
    expect(
      extractShippingAddressFromPaymentIntent({ shipping: { name: 'Juan Pérez' } } as never),
    ).toBeUndefined()
  })

  it('maps the collected address, dropping fields Stripe left null', () => {
    const result = extractShippingAddressFromPaymentIntent({
      shipping: {
        name: 'Juan Pérez',
        address: {
          line1: 'Calle 50',
          line2: null,
          city: 'Panamá',
          state: null,
          postal_code: '0801',
          country: 'PA',
        },
      },
    } as never)

    expect(result).toEqual({
      name: 'Juan Pérez',
      line1: 'Calle 50',
      line2: undefined,
      city: 'Panamá',
      state: undefined,
      postalCode: '0801',
      country: 'PA',
    })
  })
})
