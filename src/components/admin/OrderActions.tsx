'use client'
import { useDocumentInfo } from '@payloadcms/ui'

export function OrderActions() {
  const { id } = useDocumentInfo()
  if (!id) return null
  return (
    <div style={{ display: 'grid', gap: 8, marginBottom: 24 }}>
      <a className="btn btn--style-secondary btn--size-small" href={`/api/orders/${id}/invoice`} target="_blank" rel="noopener">
        Print invoice
      </a>
    </div>
  )
}
