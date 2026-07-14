const STORAGE_KEY = 'fitgear.checkout.pendingOrder'

interface PendingCheckoutOrder {
  orderId: string
  fingerprint: string
}

// Session-scoped (not localStorage) record of "the order we already created
// for this cart contents" — lets CheckoutPage reuse the same PENDING order
// across remounts (back-and-forth navigation) instead of creating a new one
// every time, mirroring the dedup CartDrawer used to do in-memory before
// checkout became its own page. Cleared once the order is actually paid.
export function readPendingCheckoutOrder(): PendingCheckoutOrder | null {
  if (typeof window === 'undefined') {
    return null
  }
  try {
    const raw = window.sessionStorage.getItem(STORAGE_KEY)
    if (!raw) {
      return null
    }
    const parsed = JSON.parse(raw) as Partial<PendingCheckoutOrder>
    if (typeof parsed.orderId === 'string' && typeof parsed.fingerprint === 'string') {
      return { orderId: parsed.orderId, fingerprint: parsed.fingerprint }
    }
    return null
  } catch {
    return null
  }
}

export function writePendingCheckoutOrder(order: PendingCheckoutOrder): void {
  if (typeof window === 'undefined') {
    return
  }
  try {
    window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(order))
  } catch {
    // Best-effort: worst case, the next visit creates a fresh order.
  }
}

export function clearPendingCheckoutOrder(): void {
  if (typeof window === 'undefined') {
    return
  }
  try {
    window.sessionStorage.removeItem(STORAGE_KEY)
  } catch {
    // Best-effort.
  }
}
