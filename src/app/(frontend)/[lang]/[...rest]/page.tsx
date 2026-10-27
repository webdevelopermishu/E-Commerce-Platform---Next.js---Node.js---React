import { notFound } from 'next/navigation'

/** Any unknown path under /bn or /en renders the localized 404 inside the site layout. */
export default function CatchAll() {
  notFound()
}
