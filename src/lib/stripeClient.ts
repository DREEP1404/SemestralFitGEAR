import { loadStripe } from '@stripe/stripe-js'

// Loaded once at module scope — Stripe's own guidance is to call loadStripe()
// outside component render so the same Stripe object is reused across
// mounts/remounts instead of reloading stripe.js repeatedly.
export const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY, {
  // Hides the floating "Stripe testing assistant" badge that Stripe.js mounts
  // in sandbox/test mode (pk_test_ keys) — dev-only, doesn't affect real
  // payments, and stripe.js never shows it in live mode regardless.
  developerTools: { assistant: { enabled: false } },
})

// Mirrors the dark/lime theming already applied to Clerk's embedded
// <UserProfile> in AccountPage.tsx, so Stripe's Elements (PaymentElement,
// AddressElement) read as part of FITGEAR's own design system instead of a
// generic third-party widget.
export const fitgearStripeAppearance = {
  theme: 'night' as const,
  variables: {
    colorPrimary: '#a3e635',
    colorBackground: '#0f172a',
    colorText: '#e2e8f0',
    colorTextSecondary: '#94a3b8',
    colorDanger: '#fb7185',
    colorBorder: 'rgba(255, 255, 255, 0.12)',
    borderRadius: '16px',
    fontFamily: '"Inter", sans-serif',
  },
  rules: {
    '.Input': {
      backgroundColor: '#0b1220',
      border: '1px solid rgba(255, 255, 255, 0.1)',
    },
    '.Input:focus': {
      border: '1px solid rgba(163, 230, 53, 0.6)',
      boxShadow: '0 0 0 2px rgba(163, 230, 53, 0.3)',
    },
    '.Label': {
      color: '#cbd5e1',
    },
  },
}
