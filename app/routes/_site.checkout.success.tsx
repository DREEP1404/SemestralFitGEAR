import { createFileRoute } from '@tanstack/react-router'
import { CheckoutSuccessPage } from '../../src/pages/CheckoutSuccessPage'
import { CustomerGuard } from '../lib/CustomerGuard'

// `/checkout/success` — migrated from src/pages/CheckoutSuccessPage.tsx
// (Phase 3). Original wraps it only in CustomerRoute (no ProtectedRoute), so
// only CustomerGuard applies here. validateSearch keeps orderId typed through
// TanStack navigation; `payment_intent` is Stripe's own query param, appended
// automatically to return_url only on the rare redirect-required path (the
// common in-page confirm never adds it, relying on the order's stored id).
export const Route = createFileRoute('/_site/checkout/success')({
  validateSearch: (search: Record<string, unknown>): { orderId?: string; payment_intent?: string } => ({
    orderId: typeof search.orderId === 'string' ? search.orderId : undefined,
    payment_intent: typeof search.payment_intent === 'string' ? search.payment_intent : undefined,
  }),
  component: () => (
    <CustomerGuard>
      <CheckoutSuccessPage />
    </CustomerGuard>
  ),
})
