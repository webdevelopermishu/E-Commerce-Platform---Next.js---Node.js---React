import type { Field, GlobalConfig } from 'payload'
import { anyone, isAdmin, isManager, isStaff } from '../access'
import { moneyField } from '../fields/money'
import { districtOptions } from '../lib/bd-locations'
import { requiredInDefaultLocale } from '../fields/localized-required'

const hex = (name: string, label: string, defaultValue: string): Field => ({
  name,
  label,
  type: 'text',
  defaultValue,
  admin: { width: '33%', components: { Field: '/components/admin/ColorField#ColorField' } },
  validate: (v: string | null | undefined) => (!v || /^#[0-9a-fA-F]{6}$/.test(v) ? true : 'Use a 6-digit hex colour like #245B32.'),
})

export const Branding: GlobalConfig = {
  slug: 'branding',
  label: 'Branding',
  admin: { group: 'Website Settings', description: 'Name, logos, favicon, colours and default SEO. Changes appear on the site immediately.' },
  access: { read: anyone, update: isStaff },
  fields: [
    {
      type: 'tabs',
      tabs: [
        {
          label: 'Identity',
          fields: [
            { name: 'brandName', type: 'text', required: true, localized: true, validate: requiredInDefaultLocale, defaultValue: 'আম্রকুঞ্জ' },
            { name: 'tagline', type: 'text', localized: true },
            { name: 'siteTitle', label: 'Website title', type: 'text', required: true, localized: true, validate: requiredInDefaultLocale, admin: { description: 'Shown in browser tabs and appended to page titles.' } },
            {
              type: 'row',
              fields: [
                { name: 'logo', label: 'Main logo', type: 'upload', relationTo: 'media', admin: { width: '33%', description: 'SVG or PNG. Wide logos work best.' } },
                { name: 'logoMobile', label: 'Mobile logo', type: 'upload', relationTo: 'media', admin: { width: '33%', description: 'Optional compact version.' } },
                { name: 'logoFooter', label: 'Footer logo', type: 'upload', relationTo: 'media', admin: { width: '33%', description: 'Optional light version for dark backgrounds.' } },
              ],
            },
            {
              name: 'favicon',
              type: 'upload',
              relationTo: 'media',
              admin: { description: 'Square PNG (at least 192×192), SVG or ICO.' },
              filterOptions: { mimeType: { in: ['image/png', 'image/svg+xml', 'image/x-icon', 'image/vnd.microsoft.icon'] } },
            },
          ],
        },
        {
          label: 'Colours',
          description: 'Brand colours used across the storefront. Keep good contrast between text and background colours.',
          fields: [
            {
              name: 'colors',
              type: 'group',
              fields: [
                {
                  type: 'row',
                  fields: [
                    hex('primary', 'Primary (deep green)', '#245B32'),
                    hex('secondary', 'Secondary (leaf green)', '#477B3B'),
                    hex('accent', 'Accent (mango yellow)', '#FFC928'),
                  ],
                },
                {
                  type: 'row',
                  fields: [
                    hex('accentWarm', 'Warm accent (mango orange)', '#F59A23'),
                    hex('background', 'Background (cream)', '#FFF9ED'),
                    hex('text', 'Text', '#243126'),
                  ],
                },
              ],
            },
          ],
        },
        {
          label: 'Default SEO',
          fields: [
            { name: 'defaultSeoTitle', label: 'Default SEO title', type: 'text', localized: true, maxLength: 70 },
            { name: 'defaultSeoDescription', label: 'Default meta description', type: 'textarea', localized: true, maxLength: 200 },
            { name: 'defaultShareImage', label: 'Default social sharing image', type: 'upload', relationTo: 'media', admin: { description: '1200×630 works best.' } },
          ],
        },
        {
          label: 'Business contact',
          fields: [
            {
              type: 'row',
              fields: [
                { name: 'phone', type: 'text', admin: { width: '50%', description: 'Shown to customers, e.g. +880 1712-345678' } },
                { name: 'email', type: 'email', admin: { width: '50%' } },
              ],
            },
            { name: 'address', type: 'textarea', localized: true },
            {
              name: 'socials',
              type: 'array',
              labels: { singular: 'Social link', plural: 'Social links' },
              fields: [
                {
                  type: 'row',
                  fields: [
                    {
                      name: 'platform',
                      type: 'select',
                      required: true,
                      admin: { width: '30%' },
                      options: ['facebook', 'instagram', 'youtube', 'tiktok', 'linkedin', 'x'].map((v) => ({ label: v, value: v })),
                    },
                    {
                      name: 'url',
                      type: 'text',
                      required: true,
                      admin: { width: '70%' },
                      validate: (v: string | null | undefined) => (v && /^https:\/\//.test(v) ? true : 'Use a full https:// link.'),
                    },
                  ],
                },
              ],
            },
          ],
        },
      ],
    },
  ],
}

export const ContactSettings: GlobalConfig = {
  slug: 'contact-settings',
  label: 'Contact & WhatsApp',
  admin: { group: 'Website Settings' },
  access: { read: anyone, update: isStaff },
  fields: [
    { name: 'whatsappEnabled', label: 'Show the WhatsApp button', type: 'checkbox', defaultValue: true },
    {
      name: 'whatsappNumber',
      type: 'text',
      admin: { description: 'With country code, digits only, e.g. 8801712345678. The button stays hidden until this is set.' },
      validate: (v: string | null | undefined) => (!v || /^\d{10,15}$/.test(v.replace(/\D/g, '')) ? true : 'Enter 10–15 digits including the country code.'),
    },
    { name: 'messageBn', label: 'Default message (বাংলা)', type: 'textarea', defaultValue: 'আসসালামু আলাইকুম! আমি আপনাদের পণ্য সম্পর্কে জানতে চাই।' },
    { name: 'messageEn', label: 'Default message (English)', type: 'textarea', defaultValue: "Hello! I'd like to know more about your products." },
    { name: 'tooltip', type: 'text', localized: true, admin: { description: 'Optional short label shown next to the button on larger screens.' } },
    {
      name: 'position',
      type: 'select',
      defaultValue: 'right',
      options: [
        { label: 'Bottom right', value: 'right' },
        { label: 'Bottom left', value: 'left' },
      ],
    },
    {
      name: 'showOn',
      label: 'Show on these pages',
      type: 'select',
      hasMany: true,
      defaultValue: ['home', 'shop', 'category', 'product', 'cart', 'blog', 'pages', 'order'],
      options: [
        { label: 'Homepage', value: 'home' },
        { label: 'Shop & search', value: 'shop' },
        { label: 'Category pages', value: 'category' },
        { label: 'Product pages', value: 'product' },
        { label: 'Cart', value: 'cart' },
        { label: 'Checkout', value: 'checkout' },
        { label: 'Blog', value: 'blog' },
        { label: 'Policy & info pages', value: 'pages' },
        { label: 'Order & tracking pages', value: 'order' },
      ],
    },
  ],
}

const linkFields: Field[] = [
  {
    type: 'row',
    fields: [
      { name: 'label', type: 'text', required: true, localized: true, validate: requiredInDefaultLocale, admin: { width: '50%' } },
      {
        name: 'href',
        type: 'text',
        required: true,
        admin: { width: '50%', description: 'Site path without language, e.g. /shop or /category/mango — or a full https:// URL.' },
        validate: (v: string | null | undefined) => (v && (/^\/[^\s]*$/.test(v) || /^https?:\/\//.test(v)) ? true : 'Start with / or https://'),
      },
    ],
  },
]

export const Navigation: GlobalConfig = {
  slug: 'navigation',
  label: 'Header & footer',
  admin: { group: 'Website Settings' },
  access: { read: anyone, update: isStaff },
  fields: [
    {
      type: 'tabs',
      tabs: [
        {
          label: 'Header',
          fields: [
            {
              name: 'headerLinks',
              type: 'array',
              maxRows: 8,
              labels: { singular: 'Menu link', plural: 'Menu links' },
              admin: { description: 'Main menu. Cart, search and language switch are always shown.' },
              fields: linkFields,
            },
          ],
        },
        {
          label: 'Footer',
          fields: [
            { name: 'footerDescription', type: 'textarea', localized: true },
            {
              name: 'footerColumns',
              type: 'array',
              maxRows: 4,
              fields: [
                { name: 'title', type: 'text', required: true, localized: true, validate: requiredInDefaultLocale },
                { name: 'links', type: 'array', fields: linkFields },
              ],
            },
            { name: 'paymentNote', type: 'text', localized: true, admin: { description: 'e.g. "Cash on delivery, bKash, Nagad and cards via SSLCommerz"' } },
            { name: 'copyright', type: 'text', localized: true, admin: { description: 'The year and brand name are added automatically when this is empty.' } },
          ],
        },
      ],
    },
  ],
}

export const DeliverySettings: GlobalConfig = {
  slug: 'delivery-settings',
  label: 'Delivery',
  admin: { group: 'Website Settings', description: 'Delivery zones, charges and methods used at checkout.' },
  access: { read: anyone, update: isManager },
  fields: [
    {
      name: 'zones',
      type: 'array',
      minRows: 1,
      labels: { singular: 'Delivery zone', plural: 'Delivery zones' },
      admin: { description: 'A district uses the zone that lists it; otherwise the default zone applies. Districts with no zone and no default cannot order.' },
      fields: [
        {
          type: 'row',
          fields: [
            { name: 'code', type: 'text', required: true, admin: { width: '25%', description: 'e.g. inside-dhaka' } },
            { name: 'name', type: 'text', required: true, localized: true, validate: requiredInDefaultLocale, admin: { width: '45%' } },
            { name: 'enabled', type: 'checkbox', defaultValue: true, admin: { width: '15%' } },
            { name: 'isDefault', type: 'checkbox', defaultValue: false, admin: { width: '15%' } },
          ],
        },
        {
          type: 'row',
          fields: [
            moneyField({ name: 'fee', label: 'Delivery fee (৳)', required: true, admin: { width: '33%' } }),
            moneyField({ name: 'freeOver', label: 'Free over (৳)', admin: { width: '33%', description: 'Optional' } }),
            { name: 'estimate', type: 'text', localized: true, admin: { width: '34%', description: 'e.g. "১–২ দিন" / "1–2 days"' } },
          ],
        },
        { name: 'districts', type: 'select', hasMany: true, options: districtOptions },
      ],
    },
    {
      name: 'methods',
      type: 'array',
      minRows: 1,
      labels: { singular: 'Delivery method', plural: 'Delivery methods' },
      fields: [
        {
          type: 'row',
          fields: [
            { name: 'code', type: 'text', required: true, admin: { width: '25%', description: 'e.g. standard' } },
            { name: 'name', type: 'text', required: true, localized: true, validate: requiredInDefaultLocale, admin: { width: '45%' } },
            moneyField({ name: 'surcharge', label: 'Extra charge (৳)', defaultValue: 0, admin: { width: '15%' } }),
            { name: 'enabled', type: 'checkbox', defaultValue: true, admin: { width: '15%' } },
          ],
        },
        { name: 'description', type: 'text', localized: true },
      ],
    },
    { name: 'productPageNote', type: 'textarea', localized: true, admin: { description: 'Short delivery note shown on every product page.' } },
  ],
}

export const PaymentSettings: GlobalConfig = {
  slug: 'payment-settings',
  label: 'Payments',
  admin: {
    group: 'Website Settings',
    description: 'Turn payment methods on or off. Gateway credentials are set as server environment variables, never here.',
  },
  access: { read: isStaff, update: isAdmin },
  fields: [
    { name: 'gatewayStatus', type: 'ui', admin: { components: { Field: '/components/admin/GatewayStatus#GatewayStatus' } } },
    { name: 'codEnabled', label: 'Cash on delivery', type: 'checkbox', defaultValue: true },
    moneyField({ name: 'codMaxTotal', label: 'Cash on delivery limit (৳)', admin: { description: 'Optional: hide COD for orders above this total.' } }),
    { name: 'sslcommerzEnabled', label: 'SSLCommerz (cards, mobile banking)', type: 'checkbox', defaultValue: false },
    { name: 'bkashEnabled', label: 'bKash', type: 'checkbox', defaultValue: false },
    { name: 'nagadEnabled', label: 'Nagad', type: 'checkbox', defaultValue: false },
    { name: 'checkoutNote', type: 'textarea', localized: true, admin: { description: 'Optional payment instructions shown at checkout.' } },
  ],
}

export const AnalyticsSettings: GlobalConfig = {
  slug: 'analytics-settings',
  label: 'Analytics & verification',
  admin: { group: 'Website Settings' },
  access: { read: anyone, update: isAdmin },
  fields: [
    {
      name: 'ga4Id',
      label: 'Google Analytics 4 measurement ID',
      type: 'text',
      admin: { description: 'e.g. G-XXXXXXXXXX. Leave empty to load no analytics.' },
      validate: (v: string | null | undefined) => (!v || /^G-[A-Z0-9]{4,}$/.test(v) ? true : 'Format: G-XXXXXXXXXX'),
    },
    {
      name: 'gtmId',
      label: 'Google Tag Manager container ID',
      type: 'text',
      admin: { description: 'e.g. GTM-XXXXXXX. Use either GA4 or GTM, usually not both.' },
      validate: (v: string | null | undefined) => (!v || /^GTM-[A-Z0-9]{4,}$/.test(v) ? true : 'Format: GTM-XXXXXXX'),
    },
    {
      name: 'searchConsoleVerification',
      label: 'Google Search Console verification code',
      type: 'text',
      admin: { description: 'Only the content value of the google-site-verification meta tag.' },
    },
    {
      name: 'requireConsent',
      label: 'Ask visitors for consent before loading analytics',
      type: 'checkbox',
      defaultValue: true,
    },
  ],
}
