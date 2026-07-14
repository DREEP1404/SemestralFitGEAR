import { useQuery } from '@tanstack/react-query'
import { ApiError } from '../api/apiClient'
import { confirmPayment } from '../api/fitgearApi'
import { queryKeys } from '../lib/queryKeys'

const PAYMENT_CONFIRMATION_RETRYABLE_STATUS = 409

// `authReady` gates the query until Clerk has resolved the session and the
// auth-token getter is registered (AuthContext). The embedded checkout
// confirms in-page most of the time (no gate needed there — see
// CheckoutForm), but the rare case that still needs a Stripe redirect (e.g. a
// payment method requiring one despite allow_redirects:'never') lands here via
// a full page load, so this gate stays as a safety net.
export function usePaymentConfirmationQuery(
  orderId: string | null,
  paymentIntentId: string | null,
  authReady: boolean,
) {
  return useQuery({
    queryKey: queryKeys.payments.confirmation(orderId ?? 'unknown', paymentIntentId ?? 'none'),
    enabled: Boolean(orderId) && authReady,
    staleTime: Infinity,
    gcTime: 1000 * 60 * 30,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    refetchOnMount: false,
    retry: (failureCount, error) => {
      const isRetryable =
        error instanceof ApiError &&
        error.status === PAYMENT_CONFIRMATION_RETRYABLE_STATUS

      return isRetryable && failureCount < 3
    },
    retryDelay: (attemptIndex) => Math.min(1000 * (attemptIndex + 1), 3000),
    queryFn: () =>
      confirmPayment({
        orderId: orderId!,
        paymentIntentId: paymentIntentId ?? undefined,
      }),
  })
}
