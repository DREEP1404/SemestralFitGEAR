interface CategoryFilterProps {
  categories: ReadonlyArray<{ value: string; label: string }>
  selected: string
  onSelect: (category: string) => void
}

// min-h-[--size-touch-min] enforces the 44px touch-target floor (WCAG 2.5.5);
// inline-flex keeps the label centered now that the chip is taller than its text.
const baseChip =
  'inline-flex min-h-[var(--size-touch-min)] items-center rounded-full px-4 py-2 text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lime-400/40'
const activeChip = 'bg-lime-400 text-slate-900 shadow-[0_0_20px_-6px_rgba(163,230,53,0.7)]'
const inactiveChip =
  'border border-white/10 bg-white/[0.03] text-slate-300 hover:border-white/25 hover:text-white'

export function CategoryFilter({ categories, selected, onSelect }: CategoryFilterProps) {
  return (
    <div className="flex flex-wrap gap-2">
      <button
        type="button"
        onClick={() => onSelect('all')}
        className={`${baseChip} ${selected === 'all' ? activeChip : inactiveChip}`}
      >
        Todas
      </button>
      {categories.map((category) => (
        <button
          key={category.value}
          type="button"
          onClick={() => onSelect(category.value)}
          className={`${baseChip} ${selected === category.value ? activeChip : inactiveChip}`}
        >
          {category.label}
        </button>
      ))}
    </div>
  )
}
