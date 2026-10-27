import { Forbidden, type CollectionConfig } from 'payload'
import { fieldIsAdmin, hasRole, isAdmin } from '../access'

export const Users: CollectionConfig = {
  slug: 'users',
  labels: { singular: 'Staff user', plural: 'Staff users' },
  admin: {
    useAsTitle: 'email',
    defaultColumns: ['email', 'name', 'roles', 'updatedAt'],
    group: 'Settings',
  },
  auth: {
    tokenExpiration: 60 * 60 * 8, // 8 hours
    maxLoginAttempts: 5,
    lockTime: 15 * 60 * 1000, // 15 minutes
    useSessions: true,
    cookies: {
      sameSite: 'Lax',
      secure: process.env.NODE_ENV === 'production' && process.env.INSECURE_COOKIES !== 'true',
    },
  },
  access: {
    // Staff can see the staff list (needed for "created by" relations); only admins manage it.
    read: ({ req }) => {
      if (hasRole(req.user as never, 'admin')) return true
      if (req.user) return { id: { equals: req.user.id } }
      return false
    },
    create: isAdmin,
    delete: isAdmin,
    update: ({ req }) => {
      if (hasRole(req.user as never, 'admin')) return true
      if (req.user) return { id: { equals: req.user.id } }
      return false
    },
    admin: ({ req }) => hasRole(req.user as never, 'admin', 'manager', 'editor'),
  },
  hooks: {
    beforeOperation: [
      ({ operation, req, args }) => {
        // Payload's built-in "create first user" screen would let whoever reaches /admin first on a fresh
        // deployment claim the account. Staff accounts are created by a signed-in admin, by the
        // `npm run create-admin` CLI (which sets context.allowStaffBootstrap), or — only if explicitly
        // enabled — through the web first-user screen.
        if (operation !== 'create' || req.user) return args
        if (req.context?.allowStaffBootstrap === true) return args
        if (process.env.ALLOW_WEB_FIRST_USER === 'true') return args
        throw new Forbidden(req.t)
      },
    ],
  },
  fields: [
    { name: 'name', type: 'text' },
    {
      name: 'roles',
      type: 'select',
      hasMany: true,
      required: true,
      defaultValue: ['editor'],
      saveToJWT: true,
      options: [
        { label: 'Admin — full access', value: 'admin' },
        { label: 'Manager — catalog, content, orders', value: 'manager' },
        { label: 'Editor — catalog and content', value: 'editor' },
      ],
      access: {
        // Users cannot grant themselves roles.
        create: fieldIsAdmin,
        update: fieldIsAdmin,
      },
    },
  ],
}
