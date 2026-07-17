import { useEffect, useRef, useSyncExternalStore } from 'react'
import { prefersReducedMotion } from '../lib/gsap'

// The hover/pointer capability doesn't change during a session, so a no-op
// subscribe is enough; useSyncExternalStore just gives us an SSR-safe read
// (server snapshot = disabled) without a setState-in-effect.
const noopSubscribe = () => () => {}
const isSpotlightCapable = () =>
  !prefersReducedMotion() && window.matchMedia('(hover: hover) and (pointer: fine)').matches

/**
 * Interactive layer for the Shop catalog backdrop: a brighter copy of
 * SectionDecor's lime dot grid (same 26px cell, so the dots line up), revealed
 * only inside a soft circle that follows the cursor. The circle is a CSS mask
 * positioned from --spotlight-x/--spotlight-y, updated from a passive
 * `pointermove` listener throttled to one write per animation frame.
 *
 * Enhancement-only: it renders nothing (leaving the plain static dots from
 * SectionDecor) on touch / coarse pointers — `(hover: hover) and (pointer:
 * fine)` — and under prefers-reduced-motion. Meant to sit as an absolutely
 * positioned sibling of <SectionDecor pattern="dots" /> in the same box.
 */
export function ShopSpotlight() {
  const ref = useRef<HTMLDivElement>(null)
  const enabled = useSyncExternalStore(noopSubscribe, isSpotlightCapable, () => false)

  useEffect(() => {
    if (!enabled) {
      return
    }
    const element = ref.current
    if (!element) {
      return
    }

    let frame = 0
    let pending: { x: number; y: number } | null = null

    const apply = () => {
      frame = 0
      if (!pending) {
        return
      }
      const rect = element.getBoundingClientRect()
      const x = pending.x - rect.left
      const y = pending.y - rect.top
      const inside = x >= 0 && y >= 0 && x <= rect.width && y <= rect.height
      element.style.setProperty('--spotlight-x', `${x}px`)
      element.style.setProperty('--spotlight-y', `${y}px`)
      // Fade out when the pointer leaves the catalog area so no bright spot sticks.
      element.style.opacity = inside ? '1' : '0'
    }

    const handlePointerMove = (event: PointerEvent) => {
      pending = { x: event.clientX, y: event.clientY }
      if (!frame) {
        frame = requestAnimationFrame(apply)
      }
    }

    window.addEventListener('pointermove', handlePointerMove, { passive: true })
    return () => {
      window.removeEventListener('pointermove', handlePointerMove)
      if (frame) {
        cancelAnimationFrame(frame)
      }
    }
  }, [enabled])

  if (!enabled) {
    return null
  }

  const mask =
    'radial-gradient(circle 130px at var(--spotlight-x, -999px) var(--spotlight-y, -999px), #000 0%, rgba(0,0,0,0.5) 45%, transparent 72%)'

  return (
    <div
      ref={ref}
      aria-hidden
      className="absolute inset-0 opacity-0 transition-opacity duration-300"
      style={{
        backgroundImage: 'radial-gradient(circle, rgba(163,230,53,0.9) 2px, transparent 2px)',
        backgroundSize: '26px 26px',
        WebkitMaskImage: mask,
        maskImage: mask,
      }}
    />
  )
}
