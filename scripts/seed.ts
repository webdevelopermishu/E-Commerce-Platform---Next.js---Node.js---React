/**
 * Seed the database with the SAMPLE catalogue and site content.
 *
 *   npm run seed            # only seeds when no products exist yet
 *   npm run seed -- --reset # deletes catalogue/content (NOT orders/users) and seeds again
 *
 * Sample data is clearly labelled and meant to be edited or deleted in the admin panel.
 * This script never creates admin users (see `npm run create-admin`).
 */
import 'dotenv/config'
import { getPayload, type Payload } from 'payload'
import sharp from 'sharp'
import config from '../src/payload.config'
import * as art from './seed/art'
import { categories, faqs, pages, posts, products } from './seed/data'

const reset = process.argv.includes('--reset')
const taka = (n: number) => Math.round(n * 100)

type Lexical = { root: { type: 'root'; format: ''; indent: 0; version: 1; direction: 'ltr'; children: unknown[] } }
function lexical(paragraphs: readonly string[]): Lexical {
  return {
    root: {
      type: 'root',
      format: '',
      indent: 0,
      version: 1,
      direction: 'ltr',
      children: paragraphs.map((text) => ({
        type: 'paragraph',
        format: '',
        indent: 0,
        version: 1,
        direction: 'ltr',
        textFormat: 0,
        textStyle: '',
        children: [{ type: 'text', text, format: 0, style: '', mode: 'normal', detail: 0, version: 1 }],
      })),
    },
  }
}

const ART: Record<string, () => string> = {
  'mango-himsagar': () => art.mangoProduct('himsagar'),
  'mango-himsagar-single': () => art.mangoProduct('himsagar', '#FCEBC6', 1),
  'mango-langra': () => art.mangoProduct('langra', '#F1EFCF'),
  'mango-fazli': () => art.mangoProduct('fazli', '#F6F0CB', 2),
  'mango-amrapali': () => art.mangoProduct('amrapali', '#FCE6CC'),
  'mango-gopalbhog': () => art.mangoProduct('gopalbhog', '#FBEACB'),
  'mango-harivanga': () => art.mangoProduct('harivanga', '#EEF0D0', 2),
  'mango-khirsapat': () => art.mangoProduct('khirsapat', '#F5F0CC'),
  'gur-khejur': () => art.gurArt('khejur'),
  'gur-liquid': () => art.gurArt('liquid'),
  'gur-akh': () => art.gurArt('akh'),
  ghee: () => art.gheeArt(),
  'achar-mango': () => art.acharArt('mango'),
  'achar-mixed': () => art.acharArt('mixed'),
  'achar-olive': () => art.acharArt('olive'),
  bori: () => art.boriArt(),
  amsotto: () => art.amsottoArt(),
  oil: () => art.oilArt(),
  combo: () => art.comboArt(),
  'combo-deshi': () => art.gheeArt(),
  'cat-mango': () => art.mangoProduct('gopalbhog', '#F9E3B4'),
  orchard: () => art.orchardArt(),
  promo: () => art.promoArt(),
}

const ALT: Record<string, { bn: string; en: string }> = {
  orchard: { bn: 'আম বাগানের অলংকরণ', en: 'Illustration of a mango orchard' },
  promo: { bn: 'পাতাসহ পাকা আমের অলংকরণ', en: 'Illustration of ripe mangoes with leaves' },
  hero: { bn: 'পাতাসহ পাকা আমের গুচ্ছ (অলংকরণ)', en: 'A cluster of ripe mangoes with leaves (illustration)' },
}

async function uploadSvg(payload: Payload, key: string, svg: string, alt: { bn: string; en: string }, opts: { png?: boolean } = {}) {
  const img = sharp(Buffer.from(svg))
  const data = opts.png ? await img.png({ compressionLevel: 9 }).toBuffer() : await img.webp({ quality: 86 }).toBuffer()
  const doc = await payload.create({
    collection: 'media',
    locale: 'bn',
    data: { alt: alt.bn, credit: 'Original sample illustration — replace with real photography' },
    file: { data, mimetype: opts.png ? 'image/png' : 'image/webp', name: `${key}.${opts.png ? 'png' : 'webp'}`, size: data.length },
  })
  await payload.update({ collection: 'media', id: doc.id, locale: 'en', data: { alt: alt.en } })
  return doc.id
}

async function wipe(payload: Payload) {
  const collections = ['products', 'categories', 'faqs', 'testimonials', 'posts', 'pages', 'redirects', 'coupons', 'media'] as const
  for (const collection of collections) {
    // Products that were ordered cannot be deleted (history protection); hide them instead.
    const res = await payload.find({ collection, limit: 1000, depth: 0, pagination: false, overrideAccess: true })
    for (const doc of res.docs) {
      try {
        await payload.delete({ collection, id: doc.id, overrideAccess: true })
      } catch {
        if (collection === 'products') await payload.update({ collection, id: doc.id, data: { status: 'draft' }, overrideAccess: true })
      }
    }
  }
}

async function main() {
  const payload = await getPayload({ config })
  const existing = await payload.count({ collection: 'products', overrideAccess: true })
  if (existing.totalDocs > 0 && !reset) {
    payload.logger.info(`Products already exist (${existing.totalDocs}). Run "npm run seed -- --reset" to replace the sample catalogue.`)
    process.exit(0)
  }
  if (reset) {
    payload.logger.info('Removing existing catalogue and content (orders, customers and users are kept)…')
    await wipe(payload)
  }

  // ---------- Media ----------
  payload.logger.info('Rendering and uploading sample artwork…')
  const media: Record<string, number> = {}
  const nameFor = (key: string) => {
    const p = products.find((x) => x.art === key || x.art2 === key)
    return p ? { bn: `${p.name.bn} (নমুনা অলংকরণ)`, en: `${p.name.en} (sample illustration)` } : (ALT[key] ?? { bn: 'নমুনা অলংকরণ', en: 'Sample illustration' })
  }
  for (const [key, make] of Object.entries(ART)) media[key] = await uploadSvg(payload, key, make(), nameFor(key))
  media.hero = await uploadSvg(payload, 'hero-mangoes', art.heroArt(), ALT.hero!, { png: true })

  // ---------- Categories ----------
  const catIds: Record<string, number> = {}
  for (const [i, c] of categories.entries()) {
    const doc = await payload.create({
      collection: 'categories',
      locale: 'bn',
      data: { name: c.bn, description: c.dbn, slug: c.slug, image: media[c.art], featured: c.featured, sortOrder: i, status: 'published', ...(c.slug === 'mango' ? { banner: media.orchard } : {}) },
    })
    await payload.update({ collection: 'categories', id: doc.id, locale: 'en', data: { name: c.en, description: c.den } })
    catIds[c.slug] = doc.id
  }

  // ---------- Products ----------
  payload.logger.info(`Creating ${products.length} sample products…`)
  const prodIds: Record<string, number> = {}
  for (const [i, p] of products.entries()) {
    const doc = await payload.create({
      collection: 'products',
      locale: 'bn',
      data: {
        name: p.name.bn,
        shortDescription: p.short.bn,
        description: lexical(p.body.bn) as never,
        slug: p.slug,
        status: 'published',
        categories: [catIds[p.category]!, ...(p.extraCategories ?? []).map((c) => catIds[c]!)],
        images: [media[p.art]!, ...(p.art2 ? [media[p.art2]!] : [])],
        featured: Boolean(p.featured),
        bestSeller: Boolean(p.bestSeller),
        isBundle: Boolean(p.isBundle),
        tags: p.tags,
        sortOrder: i,
        attributes: p.attributes?.map((a) => ({ label: a.bn[0], value: a.bn[1] })),
        variants: p.variants.map((v) => ({
          label: v.bn,
          sku: v.sku,
          packSize: v.packSize,
          unit: v.unit,
          price: taka(v.price),
          salePrice: v.sale ? taka(v.sale) : undefined,
          stock: v.stock,
          lowStockThreshold: 5,
        })),
        seo: { title: `${p.name.bn} — অনলাইনে অর্ডার করুন`, description: p.short.bn },
      },
    })
    // English: localized fields only. Variant rows are sent without stock (stock is locked after creation).
    await payload.update({
      collection: 'products',
      id: doc.id,
      locale: 'en',
      data: {
        name: p.name.en,
        shortDescription: p.short.en,
        description: lexical(p.body.en) as never,
        attributes: (doc.attributes ?? []).map((a, j) => ({ ...a, label: p.attributes![j]!.en[0], value: p.attributes![j]!.en[1] })),
        variants: (doc.variants ?? []).map(({ stock: _s, ...v }, j) => ({ ...v, label: p.variants[j]!.en })),
        seo: { title: `${p.name.en} — order online`, description: p.short.en },
      },
    })
    prodIds[p.slug] = doc.id
  }

  // ---------- FAQs ----------
  for (const [i, f] of faqs.entries()) {
    const doc = await payload.create({ collection: 'faqs', locale: 'bn', data: { question: f.bn[0], answer: f.bn[1], topic: f.topic as never, sortOrder: i, showOnHome: i < 5, status: 'published' } })
    await payload.update({ collection: 'faqs', id: doc.id, locale: 'en', data: { question: f.en[0], answer: f.en[1] } })
  }

  // ---------- Pages ----------
  for (const pg of pages) {
    const doc = await payload.create({ collection: 'pages', locale: 'bn', data: { title: pg.title.bn, intro: pg.intro.bn, content: lexical(pg.body.bn) as never, slug: pg.slug, kind: pg.kind, status: 'published' } })
    await payload.update({ collection: 'pages', id: doc.id, locale: 'en', data: { title: pg.title.en, intro: pg.intro.en, content: lexical(pg.body.en) as never } })
  }

  // ---------- Blog ----------
  for (const [i, post] of posts.entries()) {
    const doc = await payload.create({
      collection: 'posts',
      locale: 'bn',
      data: {
        title: post.title.bn,
        excerpt: post.excerpt.bn,
        content: lexical(post.body.bn) as never,
        slug: post.slug,
        coverImage: media[post.art],
        status: 'published',
        publishedAt: new Date(Date.now() - (i + 1) * 86400_000 * 9).toISOString(),
        relatedProducts: i === 0 ? [prodIds['himsagar-mango']!, prodIds['langra-mango']!] : [prodIds['khejur-patali-gur']!],
      },
    })
    await payload.update({ collection: 'posts', id: doc.id, locale: 'en', data: { title: post.title.en, excerpt: post.excerpt.en, content: lexical(post.body.en) as never } })
  }

  // Testimonials are intentionally NOT seeded: only genuine customer reviews should be published.

  // ---------- Sample coupon (inactive) ----------
  await payload.create({
    collection: 'coupons',
    data: { code: 'SAMPLE10', description: 'Sample coupon — inactive. Activate or delete.', active: false, type: 'percent', percent: 10, maxDiscount: taka(300), minSubtotal: taka(1000) },
  })

  // ---------- Globals ----------
  await payload.updateGlobal({
    slug: 'branding',
    locale: 'bn',
    data: {
      brandName: 'আম্রকুঞ্জ',
      tagline: 'বাগান থেকে আপনার ঘরে',
      siteTitle: 'আম্রকুঞ্জ',
      defaultSeoTitle: 'আম্রকুঞ্জ — বাংলার আম ও ঐতিহ্যবাহী খাবার',
      defaultSeoDescription: 'হিমসাগর, ল্যাংড়া, আম্রপালিসহ মৌসুমি আম এবং খেজুরের গুড়, ঘি, আচার ও কুমড়ার বড়ি অনলাইনে অর্ডার করুন।',
      defaultShareImage: media.promo,
      phone: '+880 1XXX-XXXXXX',
      email: 'hello@example.com',
      address: 'আপনার ব্যবসার ঠিকানা লিখুন',
      colors: { primary: '#245B32', secondary: '#477B3B', accent: '#FFC928', accentWarm: '#F59A23', background: '#FFF9ED', text: '#243126' },
    },
  })
  await payload.updateGlobal({
    slug: 'branding',
    locale: 'en',
    data: {
      brandName: 'Amrokunjo',
      tagline: 'From the orchard to your home',
      siteTitle: 'Amrokunjo',
      defaultSeoTitle: 'Amrokunjo — Bangladeshi mangoes & traditional foods',
      defaultSeoDescription: 'Order seasonal Himsagar, Langra and Amrapali mangoes, plus date-palm gur, ghee, achar and pumpkin bori online.',
      address: 'Enter your business address',
    },
  })

  await payload.updateGlobal({
    slug: 'contact-settings',
    locale: 'bn',
    data: {
      whatsappEnabled: true,
      // No number is seeded: a made-up number could belong to a real person. The button stays hidden until the
      // owner enters theirs in Admin → Website Settings → Contact & WhatsApp (or SEED_WHATSAPP_NUMBER is set).
      whatsappNumber: process.env.SEED_WHATSAPP_NUMBER?.replace(/\D/g, '') || '',
      tooltip: 'হোয়াটসঅ্যাপে প্রশ্ন করুন',
    },
  })
  await payload.updateGlobal({ slug: 'contact-settings', locale: 'en', data: { tooltip: 'Ask us on WhatsApp' } })

  const navBn = [
    { label: 'হোম', href: '/' },
    { label: 'সব পণ্য', href: '/shop' },
    { label: 'আম', href: '/category/mango' },
    { label: 'গুড়', href: '/category/gur' },
    { label: 'ঘি ও আচার', href: '/category/ghee' },
    { label: 'আমাদের গল্প', href: '/pages/our-story' },
    { label: 'ব্লগ', href: '/blog' },
    { label: 'যোগাযোগ', href: '/pages/contact' },
  ]
  const navEn = ['Home', 'All products', 'Mangoes', 'Gur', 'Ghee & achar', 'Our story', 'Journal', 'Contact']
  const nav = await payload.updateGlobal({
    slug: 'navigation',
    locale: 'bn',
    data: {
      headerLinks: navBn,
      footerDescription: 'বাংলার মৌসুমি আম ও ঐতিহ্যবাহী খাবার, যত্নে বাছাই ও প্যাক করে।',
      paymentNote: 'ক্যাশ অন ডেলিভারি',
      footerColumns: [
        { title: 'শপ', links: [{ label: 'সব পণ্য', href: '/shop' }, { label: 'আম', href: '/category/mango' }, { label: 'গুড়', href: '/category/gur' }, { label: 'ঘি', href: '/category/ghee' }, { label: 'আচার', href: '/category/achar' }, { label: 'কুমড়ার বড়ি', href: '/category/kumrar-bori' }] },
        { title: 'সহায়তা', links: [{ label: 'অর্ডার ট্র্যাক', href: '/track-order' }, { label: 'সাধারণ জিজ্ঞাসা', href: '/pages/faq' }, { label: 'যোগাযোগ', href: '/pages/contact' }] },
        { title: 'নীতিমালা', links: [{ label: 'ডেলিভারি নীতি', href: '/pages/delivery-policy' }, { label: 'রিটার্ন নীতি', href: '/pages/return-policy' }, { label: 'গোপনীয়তা নীতি', href: '/pages/privacy-policy' }, { label: 'শর্তাবলি', href: '/pages/terms' }] },
      ],
    },
  })
  const enCols = [
    ['Shop', ['All products', 'Mangoes', 'Gur', 'Ghee', 'Achar', 'Pumpkin bori']],
    ['Help', ['Track order', 'FAQ', 'Contact']],
    ['Policies', ['Delivery policy', 'Returns & refunds', 'Privacy policy', 'Terms']],
  ] as const
  await payload.updateGlobal({
    slug: 'navigation',
    locale: 'en',
    data: {
      headerLinks: (nav.headerLinks ?? []).map((l, i) => ({ ...l, label: navEn[i]! })),
      footerDescription: 'Seasonal mangoes and traditional foods of Bengal, sorted and packed with care.',
      paymentNote: 'Cash on delivery',
      footerColumns: (nav.footerColumns ?? []).map((c, i) => ({
        ...c,
        title: enCols[i]![0],
        links: (c.links ?? []).map((l, j) => ({ ...l, label: enCols[i]![1][j]! })),
      })),
    },
  })

  const dhaka = ['dhaka', 'gazipur', 'narayanganj']
  const del = await payload.updateGlobal({
    slug: 'delivery-settings',
    locale: 'bn',
    data: {
      zones: [
        { code: 'dhaka-metro', name: 'ঢাকা ও আশপাশ', enabled: true, isDefault: false, fee: taka(80), freeOver: taka(3000), estimate: '১–২ দিন', districts: dhaka as never },
        { code: 'outside-dhaka', name: 'ঢাকার বাইরে', enabled: true, isDefault: true, fee: taka(150), freeOver: taka(5000), estimate: '২–৪ দিন', districts: [] },
      ],
      methods: [
        { code: 'standard', name: 'স্ট্যান্ডার্ড ডেলিভারি', description: 'কুরিয়ারে হোম ডেলিভারি', surcharge: 0, enabled: true },
        { code: 'express', name: 'এক্সপ্রেস (ঢাকা)', description: 'দ্রুত ডেলিভারি, এলাকাভেদে প্রযোজ্য', surcharge: taka(60), enabled: true },
      ],
      productPageNote: 'ঢাকায় ১–২ দিনে, ঢাকার বাইরে ২–৪ দিনে ডেলিভারি (নমুনা তথ্য)। চার্জ চেকআউটে দেখাবে।',
    },
  })
  await payload.updateGlobal({
    slug: 'delivery-settings',
    locale: 'en',
    data: {
      zones: (del.zones ?? []).map((z, i) => ({ ...z, name: ['Dhaka & nearby', 'Outside Dhaka'][i]!, estimate: ['1–2 days', '2–4 days'][i]! })),
      methods: (del.methods ?? []).map((m, i) => ({ ...m, name: ['Standard delivery', 'Express (Dhaka)'][i]!, description: ['Home delivery by courier', 'Faster delivery where available'][i]! })),
      productPageNote: 'Delivery in 1–2 days in Dhaka and 2–4 days elsewhere (sample information). Fees are shown at checkout.',
    },
  })

  await payload.updateGlobal({ slug: 'payment-settings', data: { codEnabled: true, sslcommerzEnabled: false, bkashEnabled: false, nagadEnabled: false } })

  const home = await payload.updateGlobal({
    slug: 'homepage',
    locale: 'bn',
    data: {
      announcement: { enabled: true, text: 'বাগান থেকে আপনার ঘরে — বাংলার ঐতিহ্যবাহী স্বাদের আয়োজন', href: '/category/mango', tone: 'green' },
      hero: {
        headline: 'প্রকৃতির মিষ্টি উপহার, বাংলার সেরা আম',
        subheadline: 'বাছাই করা বাগানের সুস্বাদু আম এবং বাংলার ঐতিহ্যবাহী খাবার পৌঁছে যাক আপনার ঘরে।',
        image: media.hero,
        primaryCta: { label: 'আম কিনুন', href: '/category/mango' },
        secondaryCta: { label: 'সব পণ্য দেখুন', href: '/shop' },
        seasonalBadge: { enabled: true, text: 'মৌসুম চলছে' },
      },
      benefits: [
        { icon: 'leaf', title: 'বাছাই করা পণ্য', text: 'পাঠানোর আগে হাতে বাছাই' },
        { icon: 'package', title: 'যত্নসহকারে প্যাকেজিং', text: 'ভেন্টিলেশনসহ কার্টন' },
        { icon: 'truck', title: 'নির্ধারিত এলাকায় ডেলিভারি', text: 'চার্জ চেকআউটে দেখুন' },
        { icon: 'wallet', title: 'সহজ অর্ডার ও পেমেন্ট', text: 'ক্যাশ অন ডেলিভারি' },
      ],
      categoriesSection: { enabled: true, heading: 'ক্যাটাগরি অনুযায়ী কিনুন', categories: categories.map((c) => catIds[c.slug]!) },
      featured: { enabled: true, heading: 'এই মৌসুমের আম', intro: 'রাজশাহী, চাঁপাইনবাবগঞ্জ ও নওগাঁর জনপ্রিয় জাত।', category: catIds.mango, limit: 8, cta: { label: 'সব আম দেখুন', href: '/category/mango' } },
      traditional: { enabled: true, heading: 'বাংলার রান্নাঘর থেকে', intro: 'গুড়, ঘি, আচার আর বড়ি — ঘরের চেনা স্বাদ।', categories: ['gur', 'ghee', 'achar', 'kumrar-bori'].map((s) => catIds[s]!), perCategory: 4 },
      promo: { enabled: true, heading: 'পরিবারের জন্য আমের বক্স', text: 'তিন জাতের আম এক বক্সে। মৌসুম অনুযায়ী জাত বদলায়।', image: media.promo, cta: { label: 'বক্সটি দেখুন', href: '/product/family-mango-box' } },
      story: {
        enabled: true,
        heading: 'বাগান থেকে আপনার টেবিলে',
        body: 'আমরা মৌসুমের আম আর বাংলার ঘরোয়া খাবার যত্ন করে বাছাই ও প্যাক করি, যেন আপনার কাছে ঠিক যেমন হওয়া উচিত তেমনই পৌঁছায়।\n\nএই অংশটি নমুনা লেখা — অ্যাডমিন থেকে আপনার নিজের গল্প, সংগ্রহের পদ্ধতি ও প্রতিশ্রুতি লিখুন। যা সত্যি এবং রক্ষা করতে পারবেন, শুধু তা-ই লিখুন।',
        image: media.orchard,
        cta: { label: 'আমাদের গল্প পড়ুন', href: '/pages/our-story' },
      },
      popular: { enabled: true, heading: 'জনপ্রিয় পণ্য ও কম্বো' },
      testimonials: { enabled: true, heading: 'ক্রেতারা যা বলছেন' },
      faq: { enabled: true, heading: 'সাধারণ জিজ্ঞাসা' },
    },
  })
  await payload.updateGlobal({
    slug: 'homepage',
    locale: 'en',
    data: {
      announcement: { ...home.announcement, text: 'From the orchard to your home — the traditional tastes of Bengal' },
      hero: {
        ...home.hero,
        image: media.hero,
        headline: 'Nature’s sweetest gift: Bengal’s finest mangoes',
        subheadline: 'Delicious mangoes from selected orchards and the traditional foods of Bengal, delivered to your door.',
        primaryCta: { label: 'Shop mangoes', href: '/category/mango' },
        secondaryCta: { label: 'See all products', href: '/shop' },
        seasonalBadge: { enabled: true, text: 'In season now' },
      },
      benefits: (home.benefits ?? []).map((b, i) => ({
        ...b,
        title: ['Hand-picked produce', 'Careful packaging', 'Delivery to set areas', 'Easy ordering & payment'][i]!,
        text: ['Sorted by hand before dispatch', 'Ventilated cartons', 'Fees shown at checkout', 'Cash on delivery'][i]!,
      })),
      categoriesSection: { ...home.categoriesSection, categories: categories.map((c) => catIds[c.slug]!), heading: 'Shop by category' },
      featured: { ...home.featured, category: catIds.mango, heading: 'This season’s mangoes', intro: 'Popular varieties from Rajshahi, Chapai Nawabganj and Naogaon.', cta: { label: 'See all mangoes', href: '/category/mango' } },
      traditional: { ...home.traditional, categories: ['gur', 'ghee', 'achar', 'kumrar-bori'].map((s) => catIds[s]!), heading: 'From the Bengal kitchen', intro: 'Gur, ghee, achar and bori — familiar home flavours.' },
      promo: { ...home.promo, image: media.promo, heading: 'A mango box for the whole family', text: 'Three varieties in one box. Varieties change through the season.', cta: { label: 'See the box', href: '/product/family-mango-box' } },
      story: {
        ...home.story,
        image: media.orchard,
        heading: 'From the orchard to your table',
        body: 'We sort and pack seasonal mangoes and home-style Bengali foods with care, so they arrive the way they should.\n\nThis section is sample text — write your own story, sourcing and promises from the admin panel. Only include claims that are true and that you can keep.',
        cta: { label: 'Read our story', href: '/pages/our-story' },
      },
      popular: { ...home.popular, heading: 'Popular picks and bundles' },
      testimonials: { ...home.testimonials, heading: 'What customers say' },
      faq: { ...home.faq, heading: 'Questions, answered' },
    },
  })

  payload.logger.info(`Seed complete: ${products.length} products, ${categories.length} categories, ${faqs.length} FAQs, ${pages.length} pages, ${posts.length} posts.`)
  process.exit(0)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
