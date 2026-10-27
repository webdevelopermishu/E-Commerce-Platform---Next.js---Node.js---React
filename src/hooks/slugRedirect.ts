import type { CollectionAfterChangeHook } from 'payload'

/**
 * When a slug changes, record a redirect from the old path to the new one (both languages share slugs).
 * Pages resolve redirects when a slug is not found, so old links and search results keep working.
 */
export function slugRedirectHook(type: 'product' | 'category' | 'post' | 'page'): CollectionAfterChangeHook {
  return async ({ doc, previousDoc, operation, req }) => {
    if (operation !== 'update') return doc
    const oldSlug = previousDoc?.slug
    const newSlug = doc?.slug
    if (!oldSlug || !newSlug || oldSlug === newSlug) return doc
    try {
      // Point any chained redirects at the new slug, then add the new one.
      const existing = await req.payload.find({
        collection: 'redirects',
        where: { and: [{ type: { equals: type } }, { toSlug: { equals: oldSlug } }] },
        limit: 100,
        depth: 0,
        req,
        overrideAccess: true,
      })
      for (const r of existing.docs) {
        await req.payload.update({ collection: 'redirects', id: r.id, data: { toSlug: newSlug }, req, overrideAccess: true })
      }
      await req.payload.delete({
        collection: 'redirects',
        where: { and: [{ type: { equals: type } }, { fromSlug: { equals: newSlug } }] },
        req,
        overrideAccess: true,
      })
      await req.payload.create({
        collection: 'redirects',
        data: { type, fromSlug: oldSlug, toSlug: newSlug, automatic: true },
        req,
        overrideAccess: true,
      })
    } catch (err) {
      req.payload.logger.error({ err, msg: 'Failed to create slug redirect' })
    }
    return doc
  }
}
