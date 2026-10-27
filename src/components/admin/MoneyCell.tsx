'use client'
import type { DefaultCellComponentProps } from 'payload'

export function MoneyCell({ cellData }: DefaultCellComponentProps) {
  if (typeof cellData !== 'number') return <span>—</span>
  const taka = cellData / 100
  return <span>৳{taka.toLocaleString('en-BD', { minimumFractionDigits: cellData % 100 ? 2 : 0, maximumFractionDigits: 2 })}</span>
}
