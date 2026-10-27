import { env } from '@/server/env'
import { gateways } from '@/server/payments/registry'

/** Server component: shows which gateways have credentials configured on the server (never the values). */
export function GatewayStatus() {
  const items = Object.values(gateways).map((g) => ({ name: g.label.en, ok: g.isConfigured() }))
  return (
    <div style={{ border: '1px solid var(--theme-elevation-150)', borderRadius: 6, padding: '12px 16px', marginBottom: 24 }}>
      <strong>Gateway credentials on this server</strong>
      <p style={{ margin: '6px 0 10px', opacity: 0.8 }}>
        Mode: {env.PAYMENTS_SANDBOX ? 'SANDBOX (test payments)' : 'LIVE'} — set with the PAYMENTS_SANDBOX environment variable. A gateway is offered at
        checkout only when it is switched on below <em>and</em> its credentials are present.
      </p>
      <ul style={{ margin: 0, paddingLeft: 18 }}>
        {items.map((i) => (
          <li key={i.name}>
            {i.name}: {i.ok ? '✅ credentials found' : '⛔ not configured (see .env.example)'}
          </li>
        ))}
      </ul>
    </div>
  )
}
