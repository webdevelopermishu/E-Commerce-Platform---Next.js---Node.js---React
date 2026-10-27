import type { Access, FieldAccess, PayloadRequest, Where } from 'payload'

/**
 * Roles:
 *  - admin:   everything, including users, settings and payments config
 *  - manager: catalog, content, orders, customers, inventory (no user management or payment settings)
 *  - editor:  catalog + content only (no orders/customers)
 */
export type Role = 'admin' | 'manager' | 'editor'

type MaybeUser = { roles?: Role[] | null; collection?: string } | null | undefined

export function hasRole(user: MaybeUser, ...roles: Role[]): boolean {
  if (!user || user.collection !== 'users') return false
  return (user.roles ?? []).some((r) => roles.includes(r))
}

const userOf = (req: PayloadRequest) => req.user as MaybeUser

export const isAdmin: Access = ({ req }) => hasRole(userOf(req), 'admin')
export const isStaff: Access = ({ req }) => hasRole(userOf(req), 'admin', 'manager', 'editor')
export const isManager: Access = ({ req }) => hasRole(userOf(req), 'admin', 'manager')
export const canEditContent: Access = isStaff

export const anyone: Access = () => true
export const nobody: Access = () => false

/** Public can read published docs; staff can read all (needed for previews and the admin UI). */
export const publishedOrStaff: Access = ({ req }) => {
  if (hasRole(userOf(req), 'admin', 'manager', 'editor')) return true
  const where: Where = { status: { equals: 'published' } }
  return where
}

export const fieldIsAdmin: FieldAccess = ({ req }) => hasRole(userOf(req), 'admin')
export const fieldIsStaff: FieldAccess = ({ req }) => hasRole(userOf(req), 'admin', 'manager', 'editor')
export const fieldIsManager: FieldAccess = ({ req }) => hasRole(userOf(req), 'admin', 'manager')
