import { useCallback, useEffect, useRef, useState } from 'react'
import { useCart } from '../context/CartContext'
import type { Product, SizeLabel } from '../types'

export type AddToCartStatus = 'idle' | 'loading' | 'success'

/**
 * How long the button shows "Agregando…" before the item lands in the cart.
 *
 * The cart is local state (a reducer + localStorage), so the add itself is
 * instant and there is nothing to actually wait on. This short, deliberate beat
 * is what makes the click read as an action that was received and processed
 * rather than a counter that silently ticked up — keep it small enough that the
 * flow never feels laggy.
 */
const LOADING_MS = 450

/** How long the button stays on "Agregado al carrito ✓" before reverting. */
const SUCCESS_MS = 2000

const SUCCESS_MESSAGE = 'Producto agregado al carrito correctamente'
const ERROR_MESSAGE = 'No se pudo agregar el producto al carrito'

/**
 * Per-button add-to-cart feedback: idle → loading → success → idle.
 *
 * Each button owns its own instance, so a spinner on one product card never
 * affects another. The shared confirmation toast and the Navbar counter bump
 * come from CartContext, so the feedback is identical from the catalog cards,
 * the quick view and the product detail page.
 */
export function useAddToCart() {
  const { addItem, showCartNotice } = useCart()
  const [status, setStatus] = useState<AddToCartStatus>('idle')
  const timersRef = useRef<Array<ReturnType<typeof setTimeout>>>([])

  const clearTimers = useCallback(() => {
    timersRef.current.forEach(clearTimeout)
    timersRef.current = []
  }, [])

  // A card can unmount mid-flight (navigation, filtering, closing the quick
  // view) — don't let a pending timer set state on a dead component.
  useEffect(() => clearTimers, [clearTimers])

  const add = useCallback(
    (product: Product, quantity = 1, size?: SizeLabel) => {
      // Guard duplicate clicks: the button is also disabled while loading, but
      // this covers rapid double-fires (Enter key repeat, double tap).
      if (status === 'loading') {
        return
      }

      clearTimers()
      setStatus('loading')

      timersRef.current.push(
        setTimeout(() => {
          const added = addItem(product, quantity, size)

          if (!added) {
            // Already holding all available stock — restore the button to normal
            // and let the toast explain why nothing happened.
            setStatus('idle')
            showCartNotice('error', ERROR_MESSAGE)
            return
          }

          setStatus('success')
          showCartNotice('success', SUCCESS_MESSAGE)
          timersRef.current.push(setTimeout(() => setStatus('idle'), SUCCESS_MS))
        }, LOADING_MS),
      )
    },
    [addItem, clearTimers, showCartNotice, status],
  )

  return {
    /** Current button state — drives the label, spinner and disabled flag. */
    status,
    /** True while the add is in flight; disable the button on this. */
    isAdding: status === 'loading',
    /** True right after a successful add, for the "Agregado ✓" label. */
    isAdded: status === 'success',
    add,
  }
}
