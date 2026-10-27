'use client'
import { useState } from 'react'

export function OrdersExport() {
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')
  const [status, setStatus] = useState('')
  const qs = new URLSearchParams()
  if (from) qs.set('from', from)
  if (to) qs.set('to', to)
  if (status) qs.set('status', status)
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'end', margin: '0 0 16px' }}>
      <label style={{ display: 'grid', gap: 4 }}>
        <span>From</span>
        <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
      </label>
      <label style={{ display: 'grid', gap: 4 }}>
        <span>To</span>
        <input type="date" value={to} onChange={(e) => setTo(e.target.value)} />
      </label>
      <label style={{ display: 'grid', gap: 4 }}>
        <span>Status</span>
        <select value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="">All</option>
          {['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'].map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </label>
      <a className="btn btn--style-secondary btn--size-small" style={{ margin: 0 }} href={`/api/orders/export.csv?${qs.toString()}`}>
        Export CSV
      </a>
    </div>
  )
}
