/** Static administrative geography of Bangladesh: 8 divisions, 64 districts. Codes are stable slugs. */

export interface Division {
  code: string
  en: string
  bn: string
}
export interface District {
  code: string
  division: string
  en: string
  bn: string
}

export const divisions: Division[] = [
  { code: 'barishal', en: 'Barishal', bn: 'বরিশাল' },
  { code: 'chattogram', en: 'Chattogram', bn: 'চট্টগ্রাম' },
  { code: 'dhaka', en: 'Dhaka', bn: 'ঢাকা' },
  { code: 'khulna', en: 'Khulna', bn: 'খুলনা' },
  { code: 'mymensingh', en: 'Mymensingh', bn: 'ময়মনসিংহ' },
  { code: 'rajshahi', en: 'Rajshahi', bn: 'রাজশাহী' },
  { code: 'rangpur', en: 'Rangpur', bn: 'রংপুর' },
  { code: 'sylhet', en: 'Sylhet', bn: 'সিলেট' },
]

const d = (division: string, code: string, en: string, bn: string): District => ({ code, division, en, bn })

export const districts: District[] = [
  // Barishal
  d('barishal', 'barguna', 'Barguna', 'বরগুনা'),
  d('barishal', 'barishal', 'Barishal', 'বরিশাল'),
  d('barishal', 'bhola', 'Bhola', 'ভোলা'),
  d('barishal', 'jhalokati', 'Jhalokati', 'ঝালকাঠি'),
  d('barishal', 'patuakhali', 'Patuakhali', 'পটুয়াখালী'),
  d('barishal', 'pirojpur', 'Pirojpur', 'পিরোজপুর'),
  // Chattogram
  d('chattogram', 'bandarban', 'Bandarban', 'বান্দরবান'),
  d('chattogram', 'brahmanbaria', 'Brahmanbaria', 'ব্রাহ্মণবাড়িয়া'),
  d('chattogram', 'chandpur', 'Chandpur', 'চাঁদপুর'),
  d('chattogram', 'chattogram', 'Chattogram', 'চট্টগ্রাম'),
  d('chattogram', 'cumilla', 'Cumilla', 'কুমিল্লা'),
  d('chattogram', 'coxsbazar', "Cox's Bazar", 'কক্সবাজার'),
  d('chattogram', 'feni', 'Feni', 'ফেনী'),
  d('chattogram', 'khagrachhari', 'Khagrachhari', 'খাগড়াছড়ি'),
  d('chattogram', 'lakshmipur', 'Lakshmipur', 'লক্ষ্মীপুর'),
  d('chattogram', 'noakhali', 'Noakhali', 'নোয়াখালী'),
  d('chattogram', 'rangamati', 'Rangamati', 'রাঙ্গামাটি'),
  // Dhaka
  d('dhaka', 'dhaka', 'Dhaka', 'ঢাকা'),
  d('dhaka', 'faridpur', 'Faridpur', 'ফরিদপুর'),
  d('dhaka', 'gazipur', 'Gazipur', 'গাজীপুর'),
  d('dhaka', 'gopalganj', 'Gopalganj', 'গোপালগঞ্জ'),
  d('dhaka', 'kishoreganj', 'Kishoreganj', 'কিশোরগঞ্জ'),
  d('dhaka', 'madaripur', 'Madaripur', 'মাদারীপুর'),
  d('dhaka', 'manikganj', 'Manikganj', 'মানিকগঞ্জ'),
  d('dhaka', 'munshiganj', 'Munshiganj', 'মুন্সীগঞ্জ'),
  d('dhaka', 'narayanganj', 'Narayanganj', 'নারায়ণগঞ্জ'),
  d('dhaka', 'narsingdi', 'Narsingdi', 'নরসিংদী'),
  d('dhaka', 'rajbari', 'Rajbari', 'রাজবাড়ী'),
  d('dhaka', 'shariatpur', 'Shariatpur', 'শরীয়তপুর'),
  d('dhaka', 'tangail', 'Tangail', 'টাঙ্গাইল'),
  // Khulna
  d('khulna', 'bagerhat', 'Bagerhat', 'বাগেরহাট'),
  d('khulna', 'chuadanga', 'Chuadanga', 'চুয়াডাঙ্গা'),
  d('khulna', 'jashore', 'Jashore', 'যশোর'),
  d('khulna', 'jhenaidah', 'Jhenaidah', 'ঝিনাইদহ'),
  d('khulna', 'khulna', 'Khulna', 'খুলনা'),
  d('khulna', 'kushtia', 'Kushtia', 'কুষ্টিয়া'),
  d('khulna', 'magura', 'Magura', 'মাগুরা'),
  d('khulna', 'meherpur', 'Meherpur', 'মেহেরপুর'),
  d('khulna', 'narail', 'Narail', 'নড়াইল'),
  d('khulna', 'satkhira', 'Satkhira', 'সাতক্ষীরা'),
  // Mymensingh
  d('mymensingh', 'jamalpur', 'Jamalpur', 'জামালপুর'),
  d('mymensingh', 'mymensingh', 'Mymensingh', 'ময়মনসিংহ'),
  d('mymensingh', 'netrokona', 'Netrokona', 'নেত্রকোণা'),
  d('mymensingh', 'sherpur', 'Sherpur', 'শেরপুর'),
  // Rajshahi
  d('rajshahi', 'bogura', 'Bogura', 'বগুড়া'),
  d('rajshahi', 'chapainawabganj', 'Chapai Nawabganj', 'চাঁপাইনবাবগঞ্জ'),
  d('rajshahi', 'joypurhat', 'Joypurhat', 'জয়পুরহাট'),
  d('rajshahi', 'naogaon', 'Naogaon', 'নওগাঁ'),
  d('rajshahi', 'natore', 'Natore', 'নাটোর'),
  d('rajshahi', 'pabna', 'Pabna', 'পাবনা'),
  d('rajshahi', 'rajshahi', 'Rajshahi', 'রাজশাহী'),
  d('rajshahi', 'sirajganj', 'Sirajganj', 'সিরাজগঞ্জ'),
  // Rangpur
  d('rangpur', 'dinajpur', 'Dinajpur', 'দিনাজপুর'),
  d('rangpur', 'gaibandha', 'Gaibandha', 'গাইবান্ধা'),
  d('rangpur', 'kurigram', 'Kurigram', 'কুড়িগ্রাম'),
  d('rangpur', 'lalmonirhat', 'Lalmonirhat', 'লালমনিরহাট'),
  d('rangpur', 'nilphamari', 'Nilphamari', 'নীলফামারী'),
  d('rangpur', 'panchagarh', 'Panchagarh', 'পঞ্চগড়'),
  d('rangpur', 'rangpur', 'Rangpur', 'রংপুর'),
  d('rangpur', 'thakurgaon', 'Thakurgaon', 'ঠাকুরগাঁও'),
  // Sylhet
  d('sylhet', 'habiganj', 'Habiganj', 'হবিগঞ্জ'),
  d('sylhet', 'moulvibazar', 'Moulvibazar', 'মৌলভীবাজার'),
  d('sylhet', 'sunamganj', 'Sunamganj', 'সুনামগঞ্জ'),
  d('sylhet', 'sylhet', 'Sylhet', 'সিলেট'),
]

export const districtCodes = districts.map((x) => x.code)
export const divisionCodes = divisions.map((x) => x.code)

export function isDistrictInDivision(district: string, division: string): boolean {
  return districts.some((x) => x.code === district && x.division === division)
}

export function districtName(code: string, locale: 'bn' | 'en'): string {
  return districts.find((x) => x.code === code)?.[locale] ?? code
}
export function divisionName(code: string, locale: 'bn' | 'en'): string {
  return divisions.find((x) => x.code === code)?.[locale] ?? code
}

/** Options for Payload select fields (labels in both languages). */
export const districtOptions = districts.map((x) => ({ label: `${x.en} — ${x.bn}`, value: x.code }))
