'use client'
import Image from 'next/image'
import { useState } from 'react'
import type { ImageData } from '@/server/queries'
import { useI18n } from '../providers/I18nProvider'

export function ProductGallery({ images, name }: { images: ImageData[]; name: string }) {
  const { dict, t } = useI18n()
  const [active, setActive] = useState(0)
  const main = images[active]
  return (
    <div aria-label={dict.product.gallery} role="region">
      <div className="relative aspect-square overflow-hidden rounded-[var(--radius-card)] bg-mango-tint">
        {main && <Image key={main.url} src={main.url} alt={main.alt || name} fill priority sizes="(min-width:1024px) 50vw, 100vw" className="object-cover" />}
      </div>
      {images.length > 1 && (
        <ul className="mt-3 flex gap-2 overflow-x-auto pb-1">
          {images.map((img, i) => (
            <li key={img.url} className="shrink-0">
              <button
                type="button"
                onClick={() => setActive(i)}
                aria-label={t(dict.product.showImage, { index: i + 1 })}
                aria-pressed={i === active}
                className={`relative block h-20 w-20 overflow-hidden rounded-[10px] bg-mango-tint ring-2 transition ${i === active ? 'ring-primary' : 'ring-transparent hover:ring-line'}`}
              >
                <Image src={img.url} alt="" fill sizes="80px" className="object-cover" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
