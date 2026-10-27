'use client'
import { FieldError, FieldLabel, useField } from '@payloadcms/ui'
import type { TextFieldClientComponent } from 'payload'

export const ColorField: TextFieldClientComponent = ({ field, path }) => {
  const { value, setValue, showError, errorMessage } = useField<string>({ path: path ?? field.name })
  const label = typeof field.label === 'string' ? field.label : field.name
  const valid = typeof value === 'string' && /^#[0-9a-fA-F]{6}$/.test(value)
  return (
    <div className="field-type text" style={{ flex: '1 1 auto' }}>
      <FieldLabel htmlFor={`field-${path}`} label={label} />
      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
        <input
          type="color"
          aria-label={`${label} picker`}
          value={valid ? value : '#000000'}
          onChange={(e) => setValue(e.target.value.toUpperCase())}
          style={{ width: 44, height: 40, padding: 2, border: '1px solid var(--theme-elevation-150)', borderRadius: 4, background: 'none' }}
        />
        <input id={`field-${path}`} value={value ?? ''} onChange={(e) => setValue(e.target.value)} placeholder="#245B32" style={{ flex: 1 }} />
      </div>
      <FieldError path={path} message={errorMessage} showError={showError} />
    </div>
  )
}
