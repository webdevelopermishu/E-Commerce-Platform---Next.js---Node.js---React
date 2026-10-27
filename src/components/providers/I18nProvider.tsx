'use client'
import { createContext, useContext, type ReactNode } from 'react'
import type { Dictionary } from '@/lib/i18n/dictionaries/en'
import type { Locale } from '@/lib/i18n/config'
import { formatPrice, interpolate } from '@/lib/i18n/format'

interface I18nValue {
  locale: Locale
  dict: Dictionary
  price: (poisha: number) => string
  t: (template: string, vars?: Record<string, string | number>) => string
}

const I18nContext = createContext<I18nValue | null>(null)

export function I18nProvider({ locale, dict, children }: { locale: Locale; dict: Dictionary; children: ReactNode }) {
  const value: I18nValue = {
    locale,
    dict,
    price: (p) => formatPrice(p, locale),
    t: (template, vars) => (vars ? interpolate(template, numberVars(vars, locale)) : template),
  }
  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>
}

/** Render numbers in Bengali digits for the Bangla UI. */
function numberVars(vars: Record<string, string | number>, locale: Locale): Record<string, string | number> {
  if (locale !== 'bn') return vars
  const out: Record<string, string | number> = {}
  for (const [k, v] of Object.entries(vars)) out[k] = typeof v === 'number' ? v.toLocaleString('bn-BD') : v
  return out
}

export function useI18n(): I18nValue {
  const ctx = useContext(I18nContext)
  if (!ctx) throw new Error('useI18n must be used inside I18nProvider')
  return ctx
}
