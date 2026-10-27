'use client'
import { useState } from 'react'

/** Export all products to CSV, or import a CSV to update prices / create simple products. */
export function ProductImportExport() {
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState<string | null>(null)

  async function onFile(file: File) {
    setBusy(true)
    setMessage(null)
    try {
      const body = new FormData()
      body.append('file', file)
      const res = await fetch('/api/products/import', { method: 'POST', body, credentials: 'include' })
      const json = (await res.json()) as { created?: number; updated?: number; errors?: string[]; error?: string }
      if (!res.ok) throw new Error(json.error || `Import failed (HTTP ${res.status})`)
      const errs = json.errors?.length ? ` — ${json.errors.length} row(s) skipped: ${json.errors.slice(0, 5).join(' | ')}` : ''
      setMessage(`Created ${json.created ?? 0}, updated ${json.updated ?? 0}${errs}. Reload the list to see changes.`)
    } catch (e) {
      setMessage(e instanceof Error ? e.message : 'Import failed')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'center', margin: '0 0 16px' }}>
      <a className="btn btn--style-secondary btn--size-small" style={{ margin: 0 }} href="/api/products/export.csv">
        Export CSV
      </a>
      <label className="btn btn--style-secondary btn--size-small" style={{ margin: 0, cursor: busy ? 'wait' : 'pointer' }}>
        {busy ? 'Importing…' : 'Import CSV'}
        <input
          type="file"
          accept=".csv,text/csv"
          hidden
          disabled={busy}
          onChange={(e) => {
            const f = e.target.files?.[0]
            if (f) void onFile(f)
            e.target.value = ''
          }}
        />
      </label>
      <span style={{ opacity: 0.75, fontSize: 13 }}>Columns match the export. Rows are matched by SKU; stock is changed only through stock adjustments.</span>
      {message && (
        <p role="status" style={{ width: '100%', margin: 0 }}>
          {message}
        </p>
      )}
    </div>
  )
}
