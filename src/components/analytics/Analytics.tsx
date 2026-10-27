'use client'
import Script from 'next/script'
import { useSyncExternalStore } from 'react'
import { useI18n } from '../providers/I18nProvider'

const KEY = 'analytics_consent_v1'
type Consent = 'granted' | 'denied' | null

// Consent is an external (browser-storage) value; read it with useSyncExternalStore so SSR renders nothing.
const listeners = new Set<() => void>()
let memoryConsent: Consent = null
function readConsent(): Consent {
  try {
    const v = localStorage.getItem(KEY)
    return v === 'granted' || v === 'denied' ? v : memoryConsent
  } catch {
    return memoryConsent
  }
}
function writeConsent(v: 'granted' | 'denied') {
  memoryConsent = v
  try {
    localStorage.setItem(KEY, v)
  } catch {
    /* storage disabled: remembered for this page view only */
  }
  listeners.forEach((l) => l())
}
function subscribe(cb: () => void) {
  listeners.add(cb)
  return () => listeners.delete(cb)
}

/**
 * Loads GA4 or GTM only when configured in admin, and — if consent is required — only after the visitor accepts.
 * Declining is remembered; no tracking scripts are requested at all.
 */
export function Analytics({ ga4Id, gtmId, requireConsent }: { ga4Id?: string | null; gtmId?: string | null; requireConsent: boolean }) {
  const { dict } = useI18n()
  const stored = useSyncExternalStore(subscribe, readConsent, () => 'ssr' as const)
  const enabled = Boolean(ga4Id || gtmId)
  if (!enabled || stored === 'ssr') return null
  const consent: 'granted' | 'denied' | 'unknown' = stored ?? (requireConsent ? 'unknown' : 'granted')
  const decide = writeConsent

  return (
    <>
      {consent === 'granted' && ga4Id && (
        <>
          <Script src={`https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(ga4Id)}`} strategy="afterInteractive" />
          <Script id="ga4-init" strategy="afterInteractive">
            {`window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config',${JSON.stringify(ga4Id)},{anonymize_ip:true});`}
          </Script>
        </>
      )}
      {consent === 'granted' && gtmId && !ga4Id && (
        <Script id="gtm-init" strategy="afterInteractive">
          {`(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src='https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);})(window,document,'script','dataLayer',${JSON.stringify(gtmId)});`}
        </Script>
      )}
      {consent === 'unknown' && (
        <div role="region" aria-label={dict.consent.message} className="fixed inset-x-3 bottom-3 z-50 mx-auto max-w-xl rounded-[var(--radius-card)] border border-line bg-paper p-4 shadow-lg md:bottom-6">
          <p className="text-sm">{dict.consent.message}</p>
          <div className="mt-3 flex gap-2">
            <button type="button" onClick={() => decide('granted')} className="h-10 rounded-[var(--radius-control)] bg-primary px-4 text-sm font-medium text-white hover:bg-primary-deep">
              {dict.consent.accept}
            </button>
            <button type="button" onClick={() => decide('denied')} className="h-10 rounded-[var(--radius-control)] border border-line px-4 text-sm hover:bg-leaf-tint">
              {dict.consent.decline}
            </button>
          </div>
        </div>
      )}
    </>
  )
}
