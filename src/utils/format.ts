export function formatDate(value: string | undefined): string {
  if (!value) return '—'
  return new Intl.DateTimeFormat('es-PA', { dateStyle: 'medium' }).format(new Date(value))
}

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('es-PA', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value)
}
