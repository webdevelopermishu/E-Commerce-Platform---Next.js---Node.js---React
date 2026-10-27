# Admin handbook

Sign in at `https://<your-domain>/admin`. The left menu is grouped as below.

| Group | What's inside |
|---|---|
| **Dashboard** | Live orders, booked vs collected revenue, pending/completed, low-stock list, recent orders, sales chart (7/30/90/365 days) |
| **Catalog** | Products, Categories |
| **Inventory** | Stock adjustments (the stock ledger) |
| **Sales** | Orders, Payments, Customers, Coupons |
| **Content** | Homepage, Media, FAQs, Testimonials, Pages (policies), Blog posts, Redirects |
| **Website Settings** | Branding, Contact & WhatsApp, Header & footer (menus, footer columns), Delivery, Payments, Analytics |
| **Settings** | Staff users |

Roles: **admin** — everything incl. staff and payment settings · **manager** — catalog, content, orders,
customers, stock · **editor** — catalog and content only.

## Bangla and English

Every translatable field shows `— বাংলা` or `— English` next to its label. Switch language with the
**Locale** menu at the top right of any edit screen, edit, and **Save** — each language is saved separately.

- Bangla is the default language and must be filled in. English can be added later; until then the English site
  shows the Bangla text for that field.
- Products, categories, FAQs, pages and posts have a **Translation** column/filter (Complete / Missing English…)
  so you can find what still needs translating.
- Interface text (buttons, checkout messages, etc.) is part of the code in `src/lib/i18n/dictionaries/`.

## Products

- **Content** tab: name, short description (cards and search results), full description, images (drag to
  reorder — the first image is the main one; set alt text in each image), attributes (e.g. Origin, Season).
- **Prices & stock** tab: one row per pack size (variant) — label ("৫ কেজি" / "5 kg"), SKU, size + unit,
  regular price, optional sale price with optional start/end dates, low-stock threshold.
  **Stock is not typed directly** after creation: add/remove stock in *Inventory → Stock adjustments* so every
  change is recorded (orders and cancellations write entries automatically).
- **SEO** tab: title, meta description, social image, canonical URL, "noindex". Empty = generated automatically.
- Sidebar: slug (changing it automatically redirects the old URL), status (Published / Draft), categories, tags,
  Featured (homepage), Best seller (Popular), Bundle.
- List view: search, filters, bulk edit/publish/delete, **Duplicate** (in the ⋮ menu), CSV export/import buttons.
- Products that appear in orders can't be deleted (history is preserved) — set them to Draft instead.

## Orders

Order status (Pending → Confirmed → Processing → Shipped → Delivered, or Cancelled) is separate from payment
status (Unpaid / Paid / Failed / Refunded…). Every change is logged in the order's history.
**Cancelling restores the stock.** Use **Print invoice** on an order and **Export CSV** on the list.
For cash on delivery, mark the payment **Paid** when the courier remits the money.

## Website Settings

- **Branding** — website title (browser tab), brand name & tagline, main/mobile/footer logos, favicon, brand
  colours, default SEO title/description and social image, phone, email, address, social links.
- **Contact & WhatsApp** — WhatsApp number with country code (e.g. 8801XXXXXXXXX), on/off, default messages
  in both languages, tooltip, left/right position and which pages show the button. Hidden until a number is set.
- **Delivery** — zones (districts, fee, free-delivery threshold, estimate), delivery methods and surcharges,
  and the delivery note on product pages.
- **Payments** — cash on delivery (with optional maximum order value) and SSLCommerz / bKash / Nagad switches.
  A gateway only appears at checkout when its server credentials are installed (status is shown here).
- **Analytics** — GA4 ID, GTM ID, Search Console verification, cookie-consent requirement.

## Homepage

*Content → Homepage* has every section in page order: announcement bar, hero (headline, text, buttons, image,
seasonal badge), trust benefits, category tiles, featured mangoes, traditional-food rows (choose categories and
order), popular products & bundles, promo banner, brand story, testimonials, FAQ and homepage SEO.
Each section can be turned off.

## Photos

Upload JPEG/PNG/WebP (ideally 1600 px or larger, square for products). The site creates optimised sizes
automatically. The seeded images are illustrations — replace them with real product photography.

## Reviews

Add genuine customer reviews in *Content → Testimonials* and set them to Published. Only published reviews
appear. Don't publish invented reviews.
