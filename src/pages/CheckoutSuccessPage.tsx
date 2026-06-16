import { useEffect } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { useSearchParams } from 'react-router-dom'
import { ApiError } from '../api/apiClient'
import { useAuth } from '../context/AuthContext'
import { useCart } from '../context/CartContext'
import { useCheckoutPaymentConfirmationQuery } from '../hooks/usePaymentQueries'
import { queryKeys } from '../lib/queryKeys'

export function CheckoutSuccessPage() {
  const [searchParams] = useSearchParams()
  const orderId = searchParams.get('orderId')
  const sessionId = searchParams.get('session_id')
  const { backendUser } = useAuth()
  const { clearCart } = useCart()
  const queryClient = useQueryClient()

  const confirmationQuery = useCheckoutPaymentConfirmationQuery(orderId, sessionId)

  const isPaid = confirmationQuery.data?.status === 'PAID'
  const isPendingConfirmation =
    confirmationQuery.error instanceof ApiError && confirmationQuery.error.status === 409

  useEffect(() => {
    if (!isPaid) {
      return
    }

    if (backendUser?.id) {
      void queryClient.invalidateQueries({
        queryKey: queryKeys.orders.byUser(backendUser.id),
      })
    }

    if (orderId) {
      void queryClient.invalidateQueries({
        queryKey: queryKeys.orders.detail(orderId),
      })
    }

    void queryClient.invalidateQueries({
      queryKey: queryKeys.orders.all,
    })

    void queryClient.invalidateQueries({
      queryKey: queryKeys.cart.all,
    })

    if (isPaid) {
      clearCart()
    }
  }, [backendUser?.id, clearCart, isPaid, orderId, queryClient])

  const paymentError =
    !orderId
      ? 'No se encontro la orden para confirmar el pago.'
      : isPendingConfirmation
        ? 'El pago aun se esta confirmando en Stripe. Puedes recargar en unos segundos.'
        : confirmationQuery.error instanceof Error
        ? confirmationQuery.error.message
        : confirmationQuery.error
          ? 'No se pudo confirmar el pago. Intenta recargar la pagina.'
          : null

  const title = isPaid ? 'Gracias por tu compra' : 'Estamos validando tu pago'
  const badge = isPaid ? 'Pago confirmado' : 'Confirmando pago'
  const description = isPaid
    ? 'Stripe confirmo el pago y la orden ya puede pasar al flujo logistico.'
    : 'Estamos sincronizando el estado de pago con el backend para dejar la orden al dia.'

  return (
    <motion.section
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.28, ease: 'easeOut' }}
      className="mx-auto max-w-xl rounded-3xl border border-lime-400/20 bg-slate-900 p-10 text-center"
    >
      <div
        className={`mx-auto inline-flex h-16 w-16 items-center justify-center rounded-2xl ${
          isPaid ? 'bg-lime-400/15 text-lime-400' : 'bg-white/[0.04] text-slate-400'
        }`}
      >
        {isPaid ? (
          <svg className="h-8 w-8" viewBox="0 0 24 24" fill="none" aria-hidden>
            <path d="M20 6L9 17l-5-5" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        ) : (
          <span className="h-6 w-6 animate-spin rounded-full border-2 border-slate-600 border-t-lime-400" aria-hidden />
        )}
      </div>

      <p className="mt-6 text-xs font-bold uppercase tracking-[0.24em] text-lime-400">{badge}</p>
      <h1 className="mt-3 text-4xl font-bold tracking-tight text-white">{title}</h1>
      <p className="mt-3 text-slate-400">{description}</p>
      {orderId ? (
        <p className="mt-3 inline-block rounded-full bg-white/[0.04] px-3 py-1 font-mono text-xs text-slate-400">
          Orden: {orderId}
        </p>
      ) : null}
      {confirmationQuery.isLoading || confirmationQuery.isFetching ? (
        <div className="mt-5 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-4 py-2 text-sm text-slate-300">
          <span className="h-2.5 w-2.5 animate-pulse rounded-full bg-lime-400" aria-hidden />
          Confirmando pago y actualizando inventario...
        </div>
      ) : null}
      {paymentError ? (
        <p className="mt-5 rounded-xl border border-amber-400/20 bg-amber-400/10 px-4 py-3 text-sm text-amber-200">
          {paymentError}
        </p>
      ) : null}
      <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
        <button
          type="button"
          onClick={() => window.location.assign('/shop')}
          className="inline-flex items-center gap-2 rounded-full bg-lime-400 px-6 py-3 text-sm font-bold text-slate-900 transition hover:bg-lime-300"
        >
          Seguir comprando
        </button>
        <button
          type="button"
          onClick={() => window.location.assign('/orders')}
          className="inline-flex items-center gap-2 rounded-full border border-white/15 px-6 py-3 text-sm font-semibold text-white transition hover:border-white/30 hover:bg-white/5"
        >
          Ver mis pedidos
        </button>
      </div>
    </motion.section>
  )
}
