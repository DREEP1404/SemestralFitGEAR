import { createFileRoute } from '@tanstack/react-router'
import { CheckoutPage } from '../../src/pages/CheckoutPage'
import { CustomerGuard } from '../lib/CustomerGuard'
import { ProtectedGuard } from '../lib/ProtectedGuard'

// `/checkout` — the embedded Stripe Elements checkout page (replaces the old
// redirect to Stripe's hosted Checkout). Same guard composition as `/orders`:
// signed-in customers only. `orderId` is optional in the URL — present when
// retrying an existing PENDING order (from "Mis pedidos" or the cancel page),
// absent for a fresh checkout derived from the current cart.
export const Route = createFileRoute('/_site/checkout_')({
  validateSearch: (search: Record<string, unknown>): { orderId?: string } => ({
    orderId: typeof search.orderId === 'string' ? search.orderId : undefined,
  }),
  component: () => (
    <CustomerGuard>
      <ProtectedGuard>
        <CheckoutPage />
      </ProtectedGuard>
    </CustomerGuard>
  ),
})
