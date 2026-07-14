import { test, expect } from '@playwright/test'
import { requireCustomerAccount, customerEmail, signInAs } from '../support/auth'

// Funcionalidad: "Login y autenticacion con Clerk", "Creacion de pedidos
// reales en backend", "Checkout con Stripe" (README) — the parts of these
// flows that genuinely need a signed-in session. Unlike e2e/public/**, these
// specs do NOT mock the backend: they exercise the real frontend + backend +
// MongoDB + Clerk, because there is no way to fake "a real order was created
// for this account" without actually creating one.
//
// Requires (see docs/e2e-testing.md):
//   - E2E_CUSTOMER_EMAIL: an existing Clerk user's email (any role)
//   - backend + MongoDB running and reachable, with at least one active product
// Skips (not fails) when E2E_CUSTOMER_EMAIL is unset.
test.describe('Customer account access', () => {
  test.beforeEach(() => {
    requireCustomerAccount()
  })

  test('signs in and reaches the account page without being redirected to /login', async ({ page }) => {
    await page.goto('/')
    await signInAs(page, customerEmail()!)

    await page.goto('/account')

    // ProtectedGuard would bounce a signed-out visitor to /login after ~600ms;
    // give it that long before asserting we were NOT redirected.
    await page.waitForTimeout(800)
    await expect(page).toHaveURL(/\/account/)
  })

  test('signs in and reaches the order history page', async ({ page }) => {
    await page.goto('/')
    await signInAs(page, customerEmail()!)

    await page.goto('/orders')

    await expect(page.getByRole('heading', { name: 'Historial de compras' })).toBeVisible()
  })
})

test.describe('Order creation + embedded checkout', () => {
  test.beforeEach(() => {
    requireCustomerAccount()
  })

  test('adds a real catalog product to the cart and reaches the embedded checkout', async ({ page }) => {
    await page.goto('/')
    await signInAs(page, customerEmail()!)

    await page.goto('/shop')
    const firstAddButton = page.getByRole('button', { name: 'Agregar' }).first()

    // No seed script exists yet (see README "Proximos pasos opcionales") — skip
    // rather than fail if the target database has no active, sizeless product.
    test.skip(
      (await firstAddButton.count()) === 0,
      'No product without required sizes found in the catalog to add to the cart — seed the DB first.',
    )

    await firstAddButton.click()
    await page.getByRole('button', { name: 'Ver carrito' }).click()

    const drawer = page.getByRole('dialog', { name: 'Carrito de compras' })
    await drawer.getByRole('button', { name: 'Pagar con tarjeta' }).click()

    // A real order + PaymentIntent are created, then the app navigates
    // client-side to FITGEAR's own embedded checkout (no more leaving the
    // site for a Stripe-hosted page) — assert we land there and Stripe's
    // AddressElement (step 1 of the checkout) actually mounts inside it.
    // The PaymentElement/"Pagar ahora" step only mounts after the address
    // step's "Siguiente", which needs a filled Stripe AddressElement (out of
    // scope for this spec) — reaching step 1 is what this test verifies.
    await page.waitForURL(/\/checkout(\?|$)/, { timeout: 20_000 })
    await expect(page.getByRole('button', { name: 'Siguiente' })).toBeVisible({ timeout: 10_000 })
    await expect(page.frameLocator('iframe[name^="__privateStripeFrame"]').first().locator('body')).toBeVisible({
      timeout: 10_000,
    })
  })
})
