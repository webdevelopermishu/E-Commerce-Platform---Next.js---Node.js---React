'use client'
import { FieldDescription, FieldError, FieldLabel, useField } from '@payloadcms/ui'
import type { NumberFieldClientComponent } from 'payload'
import { useState } from 'react'

const toTaka = (p: number | null | undefined) => (p == null ? '' : p % 100 === 0 ? String(p / 100) : (p / 100).toFixed(2))

function parseTaka(input: string): number | null | 'invalid' {
  const s = input.trim().replace(/,/g, '').replace(/[০-৯]/g, (c) => String('০১২৩৪৫৬৭৮৯'.indexOf(c)))
  if (s === '') return null
  if (!/^\d+(\.\d{1,2})?$/.test(s)) return 'invalid'
  const [w, f = ''] = s.split('.')
  return Number(w) * 100 + Number(f.padEnd(2, '0'))
}

/** Shows/accepts taka; stores integer poisha. */
export const MoneyField: NumberFieldClientComponent = ({ field, path, readOnly }) => {
  const { value, setValue, showError, errorMessage } = useField<number | null>({ path: path ?? field.name })
  const [text, setText] = useState(toTaka(value))
  const [invalid, setInvalid] = useState(false)

  // When the stored value changes from outside this input (load, reset, duplicate), resync the visible text.
  const [prevValue, setPrevValue] = useState(value)
  if (prevValue !== value) {
    setPrevValue(value)
    const parsed = parseTaka(text)
    if (parsed !== value && parsed !== 'invalid') setText(toTaka(value))
  }

  const label = typeof field.label === 'string' ? field.label : field.name
  const isReadOnly = readOnly || field.admin?.readOnly
  return (
    <div className="field-type number" style={{ flex: '1 1 auto' }}>
      <FieldLabel htmlFor={`field-${path}`} label={label} required={field.required} />
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <span aria-hidden style={{ fontWeight: 600, opacity: 0.7 }}>৳</span>
        <input
          id={`field-${path}`}
          inputMode="decimal"
          disabled={isReadOnly}
          value={text}
          aria-invalid={invalid || showError}
          onChange={(e) => {
            setText(e.target.value)
            const parsed = parseTaka(e.target.value)
            setInvalid(parsed === 'invalid')
            if (parsed !== 'invalid') setValue(parsed)
          }}
          style={{ width: '100%' }}
          className="field-type__input"
        />
      </div>
      {invalid && <div style={{ color: 'var(--theme-error-500)', fontSize: 12, marginTop: 4 }}>Enter an amount in taka, e.g. 450 or 450.50</div>}
      <FieldError path={path} message={errorMessage} showError={showError} />
      {field.admin?.description && typeof field.admin.description === 'string' && <FieldDescription path={path} description={field.admin.description} />}
    </div>
  )
}
