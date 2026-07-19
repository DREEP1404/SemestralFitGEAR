/**
 * Inline loading spinner. Inherits `currentColor`, so it picks up whatever text
 * colour the button already uses and needs no palette of its own.
 */
export function Spinner({ className = 'h-4 w-4' }: Readonly<{ className?: string }>) {
  return (
    <svg className={`${className} animate-spin`} viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle
        cx="12"
        cy="12"
        r="9"
        stroke="currentColor"
        strokeWidth="2.5"
        className="opacity-25"
      />
      <path
        d="M21 12a9 9 0 0 0-9-9"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
    </svg>
  )
}
