import { RichText } from '@payloadcms/richtext-lexical/react'
import type { SerializedEditorState } from '@payloadcms/richtext-lexical/lexical'

/** Renders Lexical rich text from the CMS with the storefront's prose styles. */
export function RichTextContent({ data, className = '' }: { data: unknown; className?: string }) {
  if (!data || typeof data !== 'object' || !('root' in (data as object))) return null
  return <RichText data={data as SerializedEditorState} className={`prose-shop ${className}`} />
}
