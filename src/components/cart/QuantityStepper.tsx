'use client'
import { Minus, Plus } from 'lucide-react'
import { useI18n } from '../providers/I18nProvider'

export function QuantityStepper({
  value,
  onChange,
  max = 50,
  min = 1,
  size = 'md',
  label,
}: {
  value: number
  onChange: (v: number) => void
  max?: number
  min?: number
  size?: 'sm' | 'md'
  label?: string
}) {
  const { dict, locale } = useI18n()
  const h = size === 'sm' ? 'h-9' : 'h-11'
  const w = size === 'sm' ? 'w-9' : 'w-11'
  return (
    <div role="group" aria-label={label ?? dict.product.quantity} className={`inline-flex items-center rounded-[var(--radius-control)] border border-line bg-paper ${h}`}>
      <button
        type="button"
        onClick={() => onChange(Math.max(min, value - 1))}
        disabled={value <= min}
        aria-label={dict.product.decrease}
        className={`inline-flex ${h} ${w} items-center justify-center text-primary disabled:opacity-35`}
      >
        <Minus className="h-4 w-4" aria-hidden />
      </button>
      <output aria-live="polite" className="min-w-8 text-center font-medium tabular-nums">
        {value.toLocaleString(locale === 'bn' ? 'bn-BD' : 'en')}
      </output>
      <button
        type="button"
        onClick={() => onChange(Math.min(max, value + 1))}
        disabled={value >= max}
        aria-label={dict.product.increase}
        className={`inline-flex ${h} ${w} items-center justify-center text-primary disabled:opacity-35`}
      >
        <Plus className="h-4 w-4" aria-hidden />
      </button>
    </div>
  )
}
