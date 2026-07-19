import { useCart } from '../context/CartContext'

/**
 * Add-to-cart confirmation, rendered once at the site layout so the exact same
 * message appears whether the shopper added from a catalog card, the quick view
 * or the product detail page.
 *
 * Single-slot and self-dismissing (3s, owned by CartContext).
 *
 * The entrance is a plain CSS animation rather than Framer's AnimatePresence on
 * purpose: AnimatePresence only unmounts a child once its *exit* animation has
 * finished, and Framer drives that with requestAnimationFrame — so in any tab
 * where rAF is throttled (backgrounded tab) the toast would linger on screen
 * well past its 3s. Rendering conditionally means React removes it the moment
 * the notice clears, no matter what rAF is doing.
 */
export function CartToast() {
  const { notice } = useCart()

  const isError = notice?.type === 'error'

  return (
    <div
      // Non-interactive layer: never blocks the sticky "Agregar al carrito" bar
      // or the cart button underneath it.
      className="pointer-events-none fixed inset-x-0 bottom-24 z-40 flex justify-center px-4 lg:bottom-8"
      // Announced politely so screen readers get the confirmation without
      // interrupting whatever the shopper is doing.
      role="status"
      aria-live="polite"
    >
      {notice ? (
        <div
          // Remount on each new notice so the entrance animation replays even
          // when the same message is shown twice in a row.
          key={notice.id}
          className={`animate-toast-in flex items-center gap-3 rounded-full border px-5 py-3 text-sm font-semibold shadow-2xl shadow-black/40 backdrop-blur-md ${
            isError
              ? 'border-rose-400/30 bg-slate-900/95 text-rose-200'
              : 'border-lime-400/30 bg-slate-900/95 text-white'
          }`}
        >
          <span
            className={`inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full ${
              isError ? 'bg-rose-500/15 text-rose-300' : 'bg-lime-400 text-slate-900'
            }`}
            aria-hidden
          >
            {isError ? (
              <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none">
                <path
                  d="M12 8v5m0 3.5h.01"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                />
              </svg>
            ) : (
              <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none">
                <path
                  d="M20 6L9 17l-5-5"
                  stroke="currentColor"
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            )}
          </span>
          {notice.message}
        </div>
      ) : null}
    </div>
  )
}
