/**
 * SAMPLE CATALOGUE — illustrative data for development and demos only.
 * Prices, stock levels and descriptions are placeholders, not verified business facts.
 * Replace everything here (or edit it in the admin panel) before launch.
 */

export interface SeedVariant {
  bn: string
  en: string
  sku: string
  packSize: number
  unit: 'g' | 'kg' | 'ml' | 'l' | 'pcs' | 'jar' | 'box' | 'pack'
  /** taka */
  price: number
  sale?: number
  stock: number
}

export interface SeedProduct {
  slug: string
  category: string
  extraCategories?: string[]
  art: string
  art2?: string
  name: { bn: string; en: string }
  short: { bn: string; en: string }
  body: { bn: string[]; en: string[] }
  attributes?: { bn: [string, string]; en: [string, string] }[]
  variants: SeedVariant[]
  featured?: boolean
  bestSeller?: boolean
  isBundle?: boolean
  tags?: string[]
}

export const categories = [
  { slug: 'mango', bn: 'আম', en: 'Mangoes', dbn: 'মৌসুমের বাছাই করা আম — হিমসাগর, ল্যাংড়া, আম্রপালিসহ নানা জাত।', den: 'Hand-picked seasonal mangoes — Himsagar, Langra, Amrapali and more.', art: 'cat-mango', featured: true },
  { slug: 'gur', bn: 'গুড়', en: 'Gur (Jaggery)', dbn: 'খেজুর ও আখের গুড় — পাটালি, ঝোলা ও দানাদার।', den: 'Date-palm and sugarcane gur — patali, liquid and block.', art: 'gur-khejur', featured: true },
  { slug: 'ghee', bn: 'ঘি', en: 'Ghee', dbn: 'ঘরোয়া পদ্ধতিতে জ্বাল দেওয়া ঘি।', den: 'Ghee simmered the home-style way.', art: 'ghee', featured: true },
  { slug: 'achar', bn: 'আচার', en: 'Achar (Pickles)', dbn: 'আম, জলপাই ও মিশ্র আচার।', den: 'Mango, olive and mixed pickles.', art: 'achar-mango', featured: true },
  { slug: 'kumrar-bori', bn: 'কুমড়ার বড়ি', en: 'Pumpkin Bori', dbn: 'রোদে শুকানো ঐতিহ্যবাহী বড়ি।', den: 'Traditional sun-dried lentil dumplings.', art: 'bori', featured: true },
  { slug: 'other', bn: 'অন্যান্য পণ্য', en: 'Other Products', dbn: 'আমসত্ত্ব, সরিষার তেল ও কম্বো প্যাক।', den: 'Mango leather, mustard oil and combo packs.', art: 'combo', featured: true },
] as const

const mangoAttrs = (originBn: string, originEn: string, seasonBn: string, seasonEn: string) => [
  { bn: ['উৎস এলাকা', originBn] as [string, string], en: ['Origin', originEn] as [string, string] },
  { bn: ['মৌসুম', seasonBn] as [string, string], en: ['Season', seasonEn] as [string, string] },
  { bn: ['প্যাকেজিং', 'ভেন্টিলেশনসহ কার্টন'] as [string, string], en: ['Packaging', 'Ventilated carton'] as [string, string] },
]

const mangoBody = (bn: string, en: string) => ({
  bn: [bn, 'নমুনা বিবরণ: পাঠানোর আগে আম বাছাই করা হয় এবং কার্টনে সাবধানে সাজানো হয়। পৌঁছানোর পর ঘরের তাপমাত্রায় রেখে পাকতে দিন।'],
  en: [en, 'Sample description: mangoes are sorted before dispatch and packed carefully in cartons. Let them ripen at room temperature after delivery.'],
})

export const products: SeedProduct[] = [
  {
    slug: 'himsagar-mango',
    category: 'mango',
    art: 'mango-himsagar',
    art2: 'mango-himsagar-single',
    name: { bn: 'হিমসাগর আম', en: 'Himsagar Mango' },
    short: { bn: 'মিষ্টি, আঁশহীন ও সুগন্ধি — মৌসুমের শুরুর দিকের জনপ্রিয় জাত।', en: 'Sweet, fibreless and fragrant — a favourite early-season variety.' },
    body: mangoBody('হিমসাগর তার মসৃণ শাঁস ও মিষ্টি সুগন্ধের জন্য পরিচিত।', 'Himsagar is known for its smooth flesh and sweet aroma.'),
    attributes: mangoAttrs('রাজশাহী ও চাঁপাইনবাবগঞ্জ', 'Rajshahi & Chapai Nawabganj', 'মে–জুন', 'May–June'),
    variants: [
      { bn: '৫ কেজি', en: '5 kg', sku: 'MNG-HIM-5KG', packSize: 5, unit: 'kg', price: 850, stock: 40 },
      { bn: '১০ কেজি', en: '10 kg', sku: 'MNG-HIM-10KG', packSize: 10, unit: 'kg', price: 1600, stock: 25 },
      { bn: '২০ কেজি', en: '20 kg', sku: 'MNG-HIM-20KG', packSize: 20, unit: 'kg', price: 3100, stock: 8 },
    ],
    featured: true,
    bestSeller: true,
    tags: ['himsagar', 'rajshahi'],
  },
  {
    slug: 'langra-mango',
    category: 'mango',
    art: 'mango-langra',
    name: { bn: 'ল্যাংড়া আম', en: 'Langra Mango' },
    short: { bn: 'সবুজ খোসা, রসালো ও হালকা টক-মিষ্টি স্বাদ।', en: 'Green-skinned, juicy, with a gentle sweet-tart taste.' },
    body: mangoBody('ল্যাংড়া পাকলেও খোসা সবুজ থাকে; ভেতরের শাঁস রসালো ও সুস্বাদু।', 'Langra stays green even when ripe; the flesh is juicy and flavourful.'),
    attributes: mangoAttrs('রাজশাহী', 'Rajshahi', 'জুন–জুলাই', 'June–July'),
    variants: [
      { bn: '৫ কেজি', en: '5 kg', sku: 'MNG-LNG-5KG', packSize: 5, unit: 'kg', price: 800, stock: 35 },
      { bn: '১০ কেজি', en: '10 kg', sku: 'MNG-LNG-10KG', packSize: 10, unit: 'kg', price: 1500, stock: 20 },
    ],
    featured: true,
  },
  {
    slug: 'fazli-mango',
    category: 'mango',
    art: 'mango-fazli',
    name: { bn: 'ফজলি আম', en: 'Fazli Mango' },
    short: { bn: 'বড় আকারের, মৌসুমের শেষ দিকের আম — আচার ও জুসেও চমৎকার।', en: 'A large late-season mango — great for eating, pickles and juice.' },
    body: mangoBody('ফজলি আকারে বড়, শাঁস বেশি এবং স্বাদে মিষ্টি।', 'Fazli is large, generous in flesh and sweet.'),
    attributes: mangoAttrs('চাঁপাইনবাবগঞ্জ', 'Chapai Nawabganj', 'জুলাই–আগস্ট', 'July–August'),
    variants: [
      { bn: '৫ কেজি', en: '5 kg', sku: 'MNG-FAZ-5KG', packSize: 5, unit: 'kg', price: 700, stock: 30 },
      { bn: '১০ কেজি', en: '10 kg', sku: 'MNG-FAZ-10KG', packSize: 10, unit: 'kg', price: 1300, stock: 18 },
    ],
    featured: true,
  },
  {
    slug: 'amrapali-mango',
    category: 'mango',
    art: 'mango-amrapali',
    name: { bn: 'আম্রপালি আম', en: 'Amrapali Mango' },
    short: { bn: 'গাঢ় কমলা শাঁস, খুব মিষ্টি — ছোট আকারের জনপ্রিয় হাইব্রিড।', en: 'Deep orange flesh and very sweet — a popular compact hybrid.' },
    body: mangoBody('আম্রপালির শাঁস গাঢ় কমলা রঙের এবং মিষ্টতা বেশি।', 'Amrapali has deep orange flesh with high sweetness.'),
    attributes: mangoAttrs('নওগাঁ', 'Naogaon', 'জুন–জুলাই', 'June–July'),
    variants: [
      { bn: '৫ কেজি', en: '5 kg', sku: 'MNG-AMR-5KG', packSize: 5, unit: 'kg', price: 900, stock: 30 },
      { bn: '১০ কেজি', en: '10 kg', sku: 'MNG-AMR-10KG', packSize: 10, unit: 'kg', price: 1700, sale: 1600, stock: 15 },
    ],
    featured: true,
    bestSeller: true,
  },
  {
    slug: 'gopalbhog-mango',
    category: 'mango',
    art: 'mango-gopalbhog',
    name: { bn: 'গোপালভোগ আম', en: 'Gopalbhog Mango' },
    short: { bn: 'মৌসুমের প্রথম দিকের সুগন্ধি ও মিষ্টি আম।', en: 'One of the earliest, most fragrant mangoes of the season.' },
    body: mangoBody('গোপালভোগ মৌসুমের শুরুতে আসে; সুবাস ও মিষ্টতার জন্য পরিচিত।', 'Gopalbhog arrives early in the season and is loved for its aroma and sweetness.'),
    attributes: mangoAttrs('রাজশাহী', 'Rajshahi', 'মে', 'May'),
    variants: [
      { bn: '৫ কেজি', en: '5 kg', sku: 'MNG-GPB-5KG', packSize: 5, unit: 'kg', price: 950, stock: 22 },
      { bn: '১০ কেজি', en: '10 kg', sku: 'MNG-GPB-10KG', packSize: 10, unit: 'kg', price: 1800, stock: 10 },
    ],
    featured: true,
  },
  {
    slug: 'harivanga-mango',
    category: 'mango',
    art: 'mango-harivanga',
    name: { bn: 'হাঁড়িভাঙ্গা আম', en: 'Haribhanga Mango' },
    short: { bn: 'গোলাকার, আঁশহীন ও ঘন শাঁসের আম।', en: 'Round, fibreless mango with dense flesh.' },
    body: mangoBody('হাঁড়িভাঙ্গা আকারে গোলাকার এবং শাঁস ঘন।', 'Haribhanga is round in shape with dense flesh.'),
    attributes: mangoAttrs('রংপুর', 'Rangpur', 'জুন–জুলাই', 'June–July'),
    variants: [
      { bn: '৫ কেজি', en: '5 kg', sku: 'MNG-HRV-5KG', packSize: 5, unit: 'kg', price: 900, stock: 18 },
      { bn: '১০ কেজি', en: '10 kg', sku: 'MNG-HRV-10KG', packSize: 10, unit: 'kg', price: 1700, stock: 9 },
    ],
  },
  {
    slug: 'khirsapat-mango',
    category: 'mango',
    art: 'mango-khirsapat',
    name: { bn: 'ক্ষীরশাপাত আম', en: 'Khirsapat Mango' },
    short: { bn: 'ক্ষীরের মতো মিষ্টি ও মোলায়েম — এই মুহূর্তে স্টক শেষ (নমুনা)।', en: 'Creamy and sweet — currently out of stock (sample).' },
    body: mangoBody('ক্ষীরশাপাত মোলায়েম শাঁস ও মিষ্টতার জন্য প্রিয়।', 'Khirsapat is prized for its creamy, sweet flesh.'),
    attributes: mangoAttrs('চাঁপাইনবাবগঞ্জ', 'Chapai Nawabganj', 'জুন', 'June'),
    variants: [{ bn: '৫ কেজি', en: '5 kg', sku: 'MNG-KHR-5KG', packSize: 5, unit: 'kg', price: 950, stock: 0 }],
  },
  {
    slug: 'khejur-patali-gur',
    category: 'gur',
    art: 'gur-khejur',
    name: { bn: 'খাঁটি খেজুরের পাটালি গুড়', en: 'Date Palm Patali Gur' },
    short: { bn: 'শীতের খেজুর রস জ্বাল দিয়ে তৈরি পাটালি গুড়।', en: 'Patali gur made by simmering winter date-palm sap.' },
    body: { bn: ['খেজুরের রস জ্বাল দিয়ে জমিয়ে পাটালি তৈরি করা হয়। পিঠা, পায়েস ও চায়ের সাথে উপভোগ করুন।', 'নমুনা বিবরণ — আপনার সংগ্রহ ও প্রস্তুত প্রণালী অনুযায়ী লিখুন।'], en: ['Date-palm sap is simmered and set into patali cakes. Enjoy with pitha, payesh or tea.', 'Sample description — rewrite to match your own sourcing and process.'] },
    variants: [
      { bn: '৫০০ গ্রাম', en: '500 g', sku: 'GUR-KHJ-500G', packSize: 500, unit: 'g', price: 350, stock: 50 },
      { bn: '১ কেজি', en: '1 kg', sku: 'GUR-KHJ-1KG', packSize: 1, unit: 'kg', price: 650, stock: 30 },
    ],
    featured: true,
    bestSeller: true,
  },
  {
    slug: 'khejur-jhola-gur',
    category: 'gur',
    art: 'gur-liquid',
    name: { bn: 'খেজুরের ঝোলা গুড়', en: 'Liquid Date Palm Gur (Jhola)' },
    short: { bn: 'তরল খেজুর গুড় — রুটি, পিঠা ও মিষ্টান্নে।', en: 'Liquid date-palm gur for roti, pitha and desserts.' },
    body: { bn: ['ঝোলা গুড় তরল অবস্থায় পাত্রে সংরক্ষণ করা হয়।', 'নমুনা বিবরণ।'], en: ['Jhola gur is kept liquid and stored in jars.', 'Sample description.'] },
    variants: [
      { bn: '৫০০ গ্রাম', en: '500 g', sku: 'GUR-JHL-500G', packSize: 500, unit: 'g', price: 380, stock: 25 },
      { bn: '১ কেজি', en: '1 kg', sku: 'GUR-JHL-1KG', packSize: 1, unit: 'kg', price: 720, stock: 4 },
    ],
  },
  {
    slug: 'akher-gur',
    category: 'gur',
    art: 'gur-akh',
    name: { bn: 'আখের গুড়', en: 'Sugarcane Gur' },
    short: { bn: 'আখের রস থেকে তৈরি দানাদার গুড়।', en: 'Block gur made from sugarcane juice.' },
    body: { bn: ['রান্না, মিষ্টি ও শরবতে ব্যবহার উপযোগী।', 'নমুনা বিবরণ।'], en: ['Good for cooking, sweets and sherbet.', 'Sample description.'] },
    variants: [
      { bn: '১ কেজি', en: '1 kg', sku: 'GUR-AKH-1KG', packSize: 1, unit: 'kg', price: 220, stock: 60 },
      { bn: '২ কেজি', en: '2 kg', sku: 'GUR-AKH-2KG', packSize: 2, unit: 'kg', price: 420, stock: 30 },
    ],
  },
  {
    slug: 'deshi-ghee',
    category: 'ghee',
    art: 'ghee',
    name: { bn: 'দেশি গাওয়া ঘি', en: 'Deshi Cow Ghee' },
    short: { bn: 'গরুর দুধের মাখন জ্বাল দিয়ে তৈরি সুগন্ধি ঘি।', en: 'Fragrant ghee made by simmering cow-milk butter.' },
    body: { bn: ['ভাত, পোলাও ও মিষ্টান্নে এক চামচ ঘি স্বাদ বাড়ায়।', 'নমুনা বিবরণ — উৎস ও প্রস্তুত প্রণালী নিজের তথ্য দিয়ে লিখুন।'], en: ['A spoonful lifts rice, polao and sweets.', 'Sample description — describe your actual source and process.'] },
    attributes: [{ bn: ['সংরক্ষণ', 'ঠান্ডা ও শুকনো স্থানে'], en: ['Storage', 'Cool, dry place'] }],
    variants: [
      { bn: '২৫০ গ্রাম', en: '250 g', sku: 'GHE-DSH-250G', packSize: 250, unit: 'g', price: 450, stock: 40 },
      { bn: '৫০০ গ্রাম', en: '500 g', sku: 'GHE-DSH-500G', packSize: 500, unit: 'g', price: 850, stock: 30 },
      { bn: '১ কেজি', en: '1 kg', sku: 'GHE-DSH-1KG', packSize: 1, unit: 'kg', price: 1650, stock: 12 },
    ],
    featured: true,
    bestSeller: true,
  },
  {
    slug: 'buffalo-ghee',
    category: 'ghee',
    art: 'ghee',
    name: { bn: 'মহিষের দুধের ঘি', en: 'Buffalo Milk Ghee' },
    short: { bn: 'ঘন ও দানাদার — মহিষের দুধের মাখন থেকে।', en: 'Rich and grainy — made from buffalo-milk butter.' },
    body: { bn: ['মহিষের দুধের ঘি স্বাদে ঘন ও রঙে হালকা।', 'নমুনা বিবরণ।'], en: ['Buffalo ghee is rich in taste and pale in colour.', 'Sample description.'] },
    variants: [{ bn: '৫০০ গ্রাম', en: '500 g', sku: 'GHE-BUF-500G', packSize: 500, unit: 'g', price: 950, stock: 15 }],
  },
  {
    slug: 'mango-achar',
    category: 'achar',
    art: 'achar-mango',
    name: { bn: 'আমের আচার', en: 'Mango Achar' },
    short: { bn: 'কাঁচা আম, সরিষার তেল ও মসলায় তৈরি টক-ঝাল আচার।', en: 'Tangy, spicy pickle of green mango in mustard oil and spices.' },
    body: { bn: ['খিচুড়ি, ডাল-ভাত বা পরোটার সাথে চমৎকার।', 'নমুনা বিবরণ।'], en: ['Lovely with khichuri, dal-bhat or paratha.', 'Sample description.'] },
    variants: [{ bn: '৪০০ গ্রাম', en: '400 g', sku: 'ACH-MNG-400G', packSize: 400, unit: 'g', price: 280, stock: 45 }],
    featured: true,
  },
  {
    slug: 'mixed-achar',
    category: 'achar',
    art: 'achar-mixed',
    name: { bn: 'মিক্সড আচার', en: 'Mixed Achar' },
    short: { bn: 'আম, জলপাই, মরিচ ও সবজির মিশ্র আচার।', en: 'A mix of mango, olive, chilli and vegetables.' },
    body: { bn: ['এক বয়ামে নানা স্বাদের আচার।', 'নমুনা বিবরণ।'], en: ['Many pickles in one jar.', 'Sample description.'] },
    variants: [{ bn: '৪০০ গ্রাম', en: '400 g', sku: 'ACH-MIX-400G', packSize: 400, unit: 'g', price: 300, stock: 35 }],
  },
  {
    slug: 'olive-achar',
    category: 'achar',
    art: 'achar-olive',
    name: { bn: 'জলপাইয়ের আচার', en: 'Olive Achar' },
    short: { bn: 'দেশি জলপাইয়ের টক-মিষ্টি আচার।', en: 'Sweet-sour pickle of local olives.' },
    body: { bn: ['জলপাই, গুড় ও মসলার মিশ্রণে তৈরি।', 'নমুনা বিবরণ।'], en: ['Made with olives, gur and spices.', 'Sample description.'] },
    variants: [{ bn: '৪০০ গ্রাম', en: '400 g', sku: 'ACH-OLV-400G', packSize: 400, unit: 'g', price: 260, stock: 3 }],
  },
  {
    slug: 'kumrar-bori',
    category: 'kumrar-bori',
    art: 'bori',
    name: { bn: 'কুমড়ার বড়ি', en: 'Pumpkin Bori' },
    short: { bn: 'চালকুমড়া ও মাষকলাই ডাল দিয়ে রোদে শুকানো বড়ি।', en: 'Sun-dried dumplings of ash gourd and black lentils.' },
    body: { bn: ['মাছের ঝোল ও সবজিতে বড়ি দিলে স্বাদ বাড়ে।', 'নমুনা বিবরণ।'], en: ['Adds depth to fish curries and vegetables.', 'Sample description.'] },
    variants: [
      { bn: '২৫০ গ্রাম', en: '250 g', sku: 'BOR-KUM-250G', packSize: 250, unit: 'g', price: 220, stock: 40 },
      { bn: '৫০০ গ্রাম', en: '500 g', sku: 'BOR-KUM-500G', packSize: 500, unit: 'g', price: 420, stock: 25 },
    ],
    featured: true,
  },
  {
    slug: 'spicy-kumrar-bori',
    category: 'kumrar-bori',
    art: 'bori',
    name: { bn: 'ঝাল কুমড়ার বড়ি', en: 'Spicy Pumpkin Bori' },
    short: { bn: 'কাঁচা মরিচ মেশানো ঝাল বড়ি।', en: 'Bori with green chilli for extra heat.' },
    body: { bn: ['ভাজা বা তরকারিতে ব্যবহার করুন।', 'নমুনা বিবরণ।'], en: ['Fry it or add to curries.', 'Sample description.'] },
    variants: [{ bn: '২৫০ গ্রাম', en: '250 g', sku: 'BOR-SPC-250G', packSize: 250, unit: 'g', price: 240, stock: 20 }],
  },
  {
    slug: 'amsotto-mango-leather',
    category: 'other',
    art: 'amsotto',
    name: { bn: 'আমসত্ত্ব', en: 'Amsotto (Mango Leather)' },
    short: { bn: 'পাকা আমের রস রোদে শুকিয়ে তৈরি মিষ্টি আমসত্ত্ব।', en: 'Ripe mango pulp sun-dried into sweet sheets.' },
    body: { bn: ['বাচ্চা-বড় সবার প্রিয় মৌসুমি নাস্তা।', 'নমুনা বিবরণ।'], en: ['A seasonal snack for all ages.', 'Sample description.'] },
    variants: [
      { bn: '২৫০ গ্রাম', en: '250 g', sku: 'OTH-AMS-250G', packSize: 250, unit: 'g', price: 250, stock: 30 },
      { bn: '৫০০ গ্রাম', en: '500 g', sku: 'OTH-AMS-500G', packSize: 500, unit: 'g', price: 480, stock: 20 },
    ],
  },
  {
    slug: 'mustard-oil',
    category: 'other',
    art: 'oil',
    name: { bn: 'সরিষার তেল', en: 'Mustard Oil' },
    short: { bn: 'ঘানিতে ভাঙানো ঝাঁঝালো সরিষার তেল (নমুনা)।', en: 'Pungent, mill-pressed mustard oil (sample).' },
    body: { bn: ['ভর্তা, আচার ও রান্নায় ব্যবহার করুন।', 'নমুনা বিবরণ।'], en: ['For bhorta, pickles and cooking.', 'Sample description.'] },
    variants: [
      { bn: '৫০০ মিলি', en: '500 ml', sku: 'OTH-OIL-500ML', packSize: 500, unit: 'ml', price: 180, stock: 40 },
      { bn: '১ লিটার', en: '1 litre', sku: 'OTH-OIL-1L', packSize: 1, unit: 'l', price: 340, stock: 30 },
    ],
  },
  {
    slug: 'family-mango-box',
    category: 'mango',
    extraCategories: ['other'],
    art: 'combo',
    name: { bn: 'ফ্যামিলি ম্যাঙ্গো বক্স', en: 'Family Mango Box' },
    short: { bn: 'তিন জাতের আম এক বক্সে — পরিবারের জন্য।', en: 'Three varieties in one box — for the whole family.' },
    body: { bn: ['মৌসুম অনুযায়ী বাক্সের জাত পরিবর্তিত হতে পারে।', 'নমুনা কম্বো।'], en: ['Varieties change with the season.', 'Sample bundle.'] },
    variants: [{ bn: '১২ কেজি বক্স', en: '12 kg box', sku: 'BND-FAM-12KG', packSize: 12, unit: 'kg', price: 2200, stock: 10 }],
    isBundle: true,
    bestSeller: true,
  },
  {
    slug: 'premium-mango-basket',
    category: 'mango',
    extraCategories: ['other'],
    art: 'combo',
    name: { bn: 'প্রিমিয়াম আমের ঝুড়ি', en: 'Premium Mango Basket' },
    short: { bn: 'উপহার দেওয়ার মতো করে সাজানো আমের ঝুড়ি।', en: 'A gift-ready basket of selected mangoes.' },
    body: { bn: ['উপহার হিসেবে পাঠাতে চেকআউটে নোট লিখে দিন।', 'নমুনা কম্বো।'], en: ['Sending it as a gift? Add a note at checkout.', 'Sample bundle.'] },
    variants: [{ bn: '৮ কেজি ঝুড়ি', en: '8 kg basket', sku: 'BND-PRM-8KG', packSize: 8, unit: 'kg', price: 1750, sale: 1650, stock: 6 }],
    isBundle: true,
  },
  {
    slug: 'deshi-food-combo',
    category: 'other',
    art: 'combo-deshi',
    name: { bn: 'দেশি খাবারের কম্বো', en: 'Deshi Food Combo' },
    short: { bn: 'পাটালি গুড়, ঘি, আমের আচার ও বড়ি — এক প্যাকে।', en: 'Patali gur, ghee, mango achar and bori — in one pack.' },
    body: { bn: ['বাংলার রান্নাঘরের চেনা স্বাদ একসাথে।', 'নমুনা কম্বো।'], en: ['Familiar tastes of the Bengal kitchen together.', 'Sample bundle.'] },
    variants: [{ bn: '১ প্যাক', en: '1 pack', sku: 'BND-DSH-1PK', packSize: 1, unit: 'pack', price: 1250, stock: 12 }],
    isBundle: true,
    bestSeller: true,
  },
]

export const faqs = [
  { topic: 'orders', bn: ['কীভাবে অর্ডার করব?', 'পণ্য কার্টে যোগ করে চেকআউটে নাম, মোবাইল নম্বর ও ঠিকানা দিন। অর্ডারের পর আমরা ফোনে নিশ্চিত করি।'], en: ['How do I order?', 'Add products to the cart and enter your name, mobile number and address at checkout. We call to confirm after you order.'] },
  { topic: 'delivery', bn: ['কত দিনে ডেলিভারি পাব?', 'ডেলিভারির সময় এলাকা অনুযায়ী ভিন্ন হয়। চেকআউটে জেলা বেছে নিলে আনুমানিক সময় দেখাবে।'], en: ['How long does delivery take?', 'It depends on your area. Choose your district at checkout to see the estimate.'] },
  { topic: 'packaging', bn: ['আম কীভাবে প্যাক করা হয়?', 'বাতাস চলাচলের ব্যবস্থাসহ কার্টনে সাজিয়ে পাঠানো হয়।'], en: ['How are mangoes packed?', 'In ventilated cartons, arranged to limit bruising.'] },
  { topic: 'payment', bn: ['কোন কোন উপায়ে পেমেন্ট করা যায়?', 'ক্যাশ অন ডেলিভারি চালু আছে। অনলাইন পেমেন্ট চালু থাকলে চেকআউটে দেখতে পাবেন।'], en: ['How can I pay?', 'Cash on delivery is available. Online payment options appear at checkout when enabled.'] },
  { topic: 'availability', bn: ['সব আম কি সারা বছর পাওয়া যায়?', 'না, আম মৌসুমি ফল। প্রতিটি জাত নির্দিষ্ট সময়ে পাওয়া যায়।'], en: ['Are mangoes available all year?', 'No — mangoes are seasonal and each variety is available for a limited time.'] },
  { topic: 'returns', bn: ['পণ্য নষ্ট অবস্থায় পেলে কী করব?', 'ডেলিভারির দিনই ছবিসহ আমাদের জানান। বিস্তারিত রিটার্ন নীতিতে দেখুন।'], en: ['What if a product arrives damaged?', 'Tell us the same day with photos. See the return policy for details.'] },
]

export const pages = [
  {
    slug: 'our-story',
    kind: 'info',
    title: { bn: 'আমাদের গল্প', en: 'Our story' },
    intro: { bn: 'এই পাতাটি নমুনা — আপনার ব্র্যান্ডের সত্যিকারের গল্প দিয়ে লিখুন।', en: 'This page is a sample — replace it with your brand’s real story.' },
    body: {
      bn: ['আমরা বাংলার মৌসুমি আম ও ঐতিহ্যবাহী খাবার যত্ন করে বাছাই ও প্যাক করে আপনার ঘরে পৌঁছে দিতে চাই।', 'কোথা থেকে পণ্য সংগ্রহ করেন, কীভাবে বাছাই করেন এবং গ্রাহকদের কী প্রতিশ্রুতি দেন — শুধু যা সত্যি এবং যা রক্ষা করতে পারবেন, তা-ই এখানে লিখুন।'],
      en: ['We want to bring Bengal’s seasonal mangoes and traditional foods to your home, sorted and packed with care.', 'Describe where you source from, how you sort, and what you promise customers — only claims that are true and that you can keep.'],
    },
  },
  {
    slug: 'delivery-policy',
    kind: 'policy',
    title: { bn: 'ডেলিভারি নীতি', en: 'Delivery policy' },
    intro: { bn: 'নমুনা নীতি — নিজের ব্যবসার নিয়ম অনুযায়ী সম্পাদনা করুন।', en: 'Sample policy — edit to match your business.' },
    body: { bn: ['ডেলিভারি চার্জ ও সময় চেকআউটে জেলা অনুযায়ী দেখানো হয়।', 'ডেলিভারির আগে আমরা ফোনে অর্ডার নিশ্চিত করি।'], en: ['Delivery fees and times are shown at checkout based on your district.', 'We confirm every order by phone before dispatch.'] },
  },
  {
    slug: 'return-policy',
    kind: 'policy',
    title: { bn: 'রিটার্ন ও রিফান্ড নীতি', en: 'Returns & refunds' },
    intro: { bn: 'নমুনা নীতি।', en: 'Sample policy.' },
    body: { bn: ['পচনশীল পণ্যের ক্ষেত্রে ডেলিভারির দিনই ছবিসহ জানাতে হবে।', 'যাচাইয়ের পর প্রতিস্থাপন বা ফেরতের ব্যবস্থা করা হবে।'], en: ['For perishable goods, report problems with photos on the day of delivery.', 'After review we arrange a replacement or refund.'] },
  },
  {
    slug: 'privacy-policy',
    kind: 'policy',
    title: { bn: 'গোপনীয়তা নীতি', en: 'Privacy policy' },
    intro: { bn: 'নমুনা নীতি — আইনি পরামর্শ নিয়ে চূড়ান্ত করুন।', en: 'Sample policy — finalise with legal advice.' },
    body: {
      bn: ['অর্ডার ডেলিভারি ও সহায়তার জন্য আমরা নাম, মোবাইল নম্বর, ইমেইল (ঐচ্ছিক) ও ঠিকানা সংরক্ষণ করি।', 'অ্যানালিটিক্স কুকি শুধু আপনার সম্মতিতে ব্যবহার হয়।'],
      en: ['We store your name, mobile number, email (optional) and address to deliver orders and provide support.', 'Analytics cookies are only used with your consent.'],
    },
  },
  {
    slug: 'terms',
    kind: 'policy',
    title: { bn: 'শর্তাবলি', en: 'Terms & conditions' },
    intro: { bn: 'নমুনা শর্তাবলি।', en: 'Sample terms.' },
    body: { bn: ['মূল্য ও প্রাপ্যতা পরিবর্তন হতে পারে। অর্ডার নিশ্চিত হওয়ার পর মূল্য অপরিবর্তিত থাকে।'], en: ['Prices and availability may change. The price is fixed once your order is placed.'] },
  },
  {
    slug: 'faq',
    kind: 'info',
    title: { bn: 'সাধারণ জিজ্ঞাসা', en: 'Frequently asked questions' },
    intro: { bn: 'অর্ডার, ডেলিভারি ও পেমেন্ট নিয়ে প্রশ্নের উত্তর।', en: 'Answers about orders, delivery and payment.' },
    body: { bn: [], en: [] },
  },
  {
    slug: 'contact',
    kind: 'info',
    title: { bn: 'যোগাযোগ', en: 'Contact' },
    intro: { bn: 'ফোন, ইমেইল বা হোয়াটসঅ্যাপে আমাদের সাথে যোগাযোগ করুন।', en: 'Reach us by phone, email or WhatsApp.' },
    body: { bn: ['যোগাযোগের তথ্য অ্যাডমিন → Website Settings → Branding থেকে পরিবর্তন করুন।'], en: ['Change contact details in Admin → Website Settings → Branding.'] },
  },
] as const

export const posts = [
  {
    slug: 'how-to-ripen-mangoes',
    art: 'mango-langra',
    title: { bn: 'ঘরে আম পাকানোর সহজ উপায়', en: 'How to ripen mangoes at home' },
    excerpt: { bn: 'কার্টন খুলে আম কীভাবে রাখবেন এবং কখন খাবেন।', en: 'How to store mangoes after unboxing, and when to eat them.' },
    body: {
      bn: ['কার্টন খুলে আমগুলো একটি স্তরে সাজিয়ে রাখুন, যাতে বাতাস চলাচল করে।', 'হালকা চাপ দিলে নরম লাগলে এবং বোঁটার কাছে সুগন্ধ এলে আম খাওয়ার উপযোগী।', 'পাকা আম ফ্রিজে রাখলে এক-দুই দিন ভালো থাকে।'],
      en: ['Open the carton and lay the mangoes in a single layer so air can circulate.', 'A mango is ready when it gives slightly to gentle pressure and smells sweet near the stem.', 'Ripe mangoes keep a day or two longer in the fridge.'],
    },
  },
  {
    slug: 'patali-gur-in-the-kitchen',
    art: 'gur-khejur',
    title: { bn: 'রান্নাঘরে পাটালি গুড়', en: 'Patali gur in the kitchen' },
    excerpt: { bn: 'পায়েস, পিঠা আর চায়ে খেজুরের গুড়ের ব্যবহার।', en: 'Using date-palm gur in payesh, pitha and tea.' },
    body: {
      bn: ['পায়েসে চিনির বদলে পাটালি গুড় দিলে রং ও ঘ্রাণ দুটোই বদলে যায়।', 'গুড় দুধে দেওয়ার আগে চুলা থেকে নামিয়ে নিন, তাহলে দুধ ফাটবে না।'],
      en: ['Swapping sugar for patali gur in payesh changes both its colour and aroma.', 'Take the milk off the heat before adding gur so it does not split.'],
    },
  },
] as const
