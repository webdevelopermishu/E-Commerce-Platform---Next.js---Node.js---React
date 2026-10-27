/**
 * Original placeholder artwork for the sample catalogue, drawn as SVG and rendered to WebP with sharp.
 * Owned by the project (no third-party images). Replace with real product photography before launch.
 */

type Pal = { light: string; main: string; shade: string; blush?: string }

export const MANGO_PALETTES: Record<string, Pal> = {
  himsagar: { light: '#FFE58A', main: '#F2C230', shade: '#B88A14', blush: '#E8962A' },
  langra: { light: '#D9E88A', main: '#9DBB3E', shade: '#5E7D24' },
  fazli: { light: '#F4EE9A', main: '#D8C94A', shade: '#8E8A22' },
  amrapali: { light: '#FFD27A', main: '#F59A23', shade: '#B4560F', blush: '#D9481E' },
  gopalbhog: { light: '#FFE17A', main: '#F3B52A', shade: '#AA6E10', blush: '#E0632A' },
  harivanga: { light: '#CFE08A', main: '#87A83A', shade: '#4F6B20', blush: '#C2472A' },
  khirsapat: { light: '#F2EA8C', main: '#C9C240', shade: '#7F7B1C', blush: '#E39B2E' },
}

let uid = 0
const id = (p: string) => `${p}${++uid}`

const defsShadow = (fid: string, blur = 10) => `<filter id="${fid}" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="${blur}"/></filter>`

const grain = (gid: string, opacity = 0.06) => `
  <filter id="${gid}"><feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" stitchTiles="stitch"/><feColorMatrix type="saturate" values="0"/></filter>
  <rect width="100%" height="100%" filter="url(#${gid})" opacity="${opacity}"/>`

export function leaf(x: number, y: number, len: number, rot: number, dark = '#2F6B33', light = '#5E9A44'): string {
  const g = id('lf')
  return `<g transform="translate(${x} ${y}) rotate(${rot})">
    <defs><linearGradient id="${g}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${light}"/><stop offset="1" stop-color="${dark}"/></linearGradient></defs>
    <path d="M0 0 C ${len * 0.25} ${-len * 0.24} ${len * 0.7} ${-len * 0.26} ${len} 0 C ${len * 0.7} ${len * 0.2} ${len * 0.25} ${len * 0.2} 0 0 Z" fill="url(#${g})"/>
    <path d="M${len * 0.04} 0 Q ${len * 0.5} ${-len * 0.03} ${len * 0.96} 0" stroke="#D7E8B8" stroke-width="${Math.max(1.2, len * 0.012)}" fill="none" opacity=".55"/>
    ${[0.25, 0.45, 0.65].map((t) => `<path d="M${len * t} ${-len * 0.008} q ${len * 0.08} ${-len * 0.08} ${len * 0.16} ${-len * 0.12}" stroke="#D7E8B8" stroke-width="${len * 0.007}" fill="none" opacity=".35"/>`).join('')}
  </g>`
}

/** A single mango, centred at (cx, cy), roughly `w` wide. */
export function mango(cx: number, cy: number, w: number, rot: number, pal: Pal, opts: { leaf?: boolean; shadow?: boolean } = {}): string {
  const s = w / 100
  const g = id('mg')
  const b = id('bl')
  const sh = id('sh')
  const body = 'M50 6 C73 3 94 24 95 52 C96 82 82 110 54 117 C28 123 6 104 5 76 C4 52 15 33 27 21 C35 12 41 7 50 6 Z'
  return `<g>
    <defs>
      <radialGradient id="${g}" cx="36%" cy="30%" r="78%"><stop offset="0" stop-color="${pal.light}"/><stop offset=".55" stop-color="${pal.main}"/><stop offset="1" stop-color="${pal.shade}"/></radialGradient>
      ${pal.blush ? `<radialGradient id="${b}" cx="72%" cy="38%" r="48%"><stop offset="0" stop-color="${pal.blush}" stop-opacity=".75"/><stop offset="1" stop-color="${pal.blush}" stop-opacity="0"/></radialGradient>` : ''}
      ${defsShadow(sh, 6)}
    </defs>
    ${opts.shadow === false ? '' : `<ellipse cx="${cx + 4 * s}" cy="${cy + 58 * s}" rx="${44 * s}" ry="${9 * s}" fill="#3A2A10" opacity=".22" filter="url(#${sh})"/>`}
    <g transform="translate(${cx} ${cy}) rotate(${rot}) scale(${s}) translate(-50 -60)">
      <path d="${body}" fill="url(#${g})"/>
      ${pal.blush ? `<path d="${body}" fill="url(#${b})"/>` : ''}
      <path d="M30 26 C 22 38 18 52 19 66" stroke="#FFFBE0" stroke-width="5" stroke-linecap="round" fill="none" opacity=".45"/>
      <ellipse cx="36" cy="30" rx="6" ry="3.5" fill="#FFFDEB" opacity=".55" transform="rotate(-30 36 30)"/>
      <path d="M50 6 c -1 -5 0 -9 2 -11" stroke="#6B4B1F" stroke-width="3.2" stroke-linecap="round" fill="none"/>
      ${opts.leaf ? leaf(51, -4, 70, -28) : ''}
    </g>
  </g>`
}

function frame(w: number, h: number, bg: string, inner: string, transparent = false): string {
  const gr = id('gr')
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
    ${transparent ? '' : `<rect width="100%" height="100%" fill="${bg}"/>`}
    ${inner}
    ${transparent ? '' : grain(gr, 0.05)}
  </svg>`
}

/** Soft circular backdrop "plate" used behind products. */
const backdrop = (cx: number, cy: number, r: number, color: string) => `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${color}"/>`

export function mangoProduct(variety: keyof typeof MANGO_PALETTES, bg = '#FBEFD2', count: 1 | 2 | 3 = 3): string {
  const pal = MANGO_PALETTES[variety]!
  const parts: string[] = [backdrop(600, 640, 420, '#FFF6DF')]
  parts.push(leaf(250, 330, 360, -18), leaf(720, 260, 320, 30, '#2B5E2E', '#4F8C3F'))
  if (count >= 3) parts.push(mango(380, 640, 330, -18, pal))
  if (count >= 2) parts.push(mango(820, 640, 320, 22, pal))
  parts.push(mango(600, 700, 400, 6, pal, { leaf: true }))
  return frame(1200, 1200, bg, parts.join(''))
}

/** Transparent hero composition: a generous cluster that bleeds off the panel. */
export function heroArt(): string {
  const P = MANGO_PALETTES
  const parts = [
    leaf(160, 560, 520, -28, '#1E4A26', '#3E7A3A'),
    leaf(560, 260, 560, -8, '#22552A', '#4C8A40'),
    leaf(820, 360, 480, 34, '#1E4A26', '#3E7A3A'),
    mango(380, 820, 520, -24, P.himsagar!),
    mango(1000, 860, 500, 26, P.amrapali!),
    mango(700, 900, 600, 4, P.gopalbhog!, { leaf: true }),
    leaf(980, 520, 380, 62, '#2B5E2E', '#5E9A44'),
  ]
  return frame(1400, 1200, 'none', parts.join(''), true)
}

function jar(cx: number, cy: number, w: number, h: number, fill: string, label: string, accent: string, inside = ''): string {
  const gl = id('gl')
  const sh = id('js')
  return `<g>
    <defs>
      <linearGradient id="${gl}" x1="0" x2="1"><stop offset="0" stop-color="#FFFFFF" stop-opacity=".35"/><stop offset=".2" stop-color="#FFFFFF" stop-opacity=".05"/><stop offset=".8" stop-color="#000" stop-opacity=".05"/><stop offset="1" stop-color="#000" stop-opacity=".18"/></linearGradient>
      ${defsShadow(sh, 12)}
    </defs>
    <ellipse cx="${cx + 10}" cy="${cy + h / 2 + 10}" rx="${w * 0.55}" ry="${w * 0.1}" fill="#3A2A10" opacity=".22" filter="url(#${sh})"/>
    <rect x="${cx - w / 2}" y="${cy - h / 2}" width="${w}" height="${h}" rx="${w * 0.16}" fill="${fill}"/>
    ${inside}
    <rect x="${cx - w / 2}" y="${cy - h / 2}" width="${w}" height="${h}" rx="${w * 0.16}" fill="url(#${gl})"/>
    <rect x="${cx - w * 0.46}" y="${cy - h / 2 - h * 0.13}" width="${w * 0.92}" height="${h * 0.15}" rx="${w * 0.05}" fill="${accent}"/>
    <rect x="${cx - w * 0.46}" y="${cy - h / 2 - h * 0.13}" width="${w * 0.92}" height="${h * 0.04}" rx="${w * 0.02}" fill="#fff" opacity=".18"/>
    <rect x="${cx - w * 0.36}" y="${cy - h * 0.08}" width="${w * 0.72}" height="${h * 0.3}" rx="${w * 0.03}" fill="#F3E3C2"/>
    <rect x="${cx - w * 0.36}" y="${cy - h * 0.08}" width="${w * 0.72}" height="${h * 0.05}" fill="${accent}" opacity=".85"/>
    <text x="${cx}" y="${cy + h * 0.13}" text-anchor="middle" font-family="Georgia, serif" font-size="${w * 0.12}" fill="#3B2A12">${label}</text>
  </g>`
}

export function gheeArt(): string {
  const parts = [backdrop(600, 640, 420, '#FFF3D0'), leaf(250, 860, 300, -12), jar(600, 640, 380, 470, '#F0B83E', 'GHEE', '#245B32')]
  parts.push(`<path d="M820 860 q 40 -40 80 0" stroke="#C88A1C" stroke-width="10" fill="none" stroke-linecap="round" opacity=".6"/>`)
  return frame(1200, 1200, '#FAEBC8', parts.join(''))
}

export function acharArt(kind: 'mango' | 'mixed' | 'olive'): string {
  const base = kind === 'olive' ? '#8A7A2A' : kind === 'mixed' ? '#B8481E' : '#D2701E'
  const chunks = Array.from({ length: 16 }, (_, i) => {
    const x = 470 + ((i * 53) % 260)
    const y = 560 + ((i * 37) % 230)
    const c = kind === 'mixed' ? ['#E7A23A', '#8E2C14', '#6E8B2F', '#F2C14E'][i % 4] : kind === 'olive' ? ['#9AA03A', '#6E7424'][i % 2] : ['#F2B33E', '#E88E24'][i % 2]
    return `<rect x="${x}" y="${y}" width="${46 + (i % 3) * 10}" height="${34 + (i % 2) * 8}" rx="12" fill="${c}" transform="rotate(${(i * 23) % 60 - 30} ${x} ${y})" opacity=".9"/>`
  }).join('')
  const chili = `<path d="M760 880 c 60 -10 120 20 150 70 c -40 -20 -100 -30 -150 -20 z" fill="#B3261E"/><path d="M760 880 l -20 -20" stroke="#3E6B2B" stroke-width="10" stroke-linecap="round"/>`
  return frame(1200, 1200, '#F6E2C4', [backdrop(600, 640, 420, '#FCEFD8'), jar(600, 640, 380, 470, base, 'ACHAR', '#7A2E14', chunks), chili].join(''))
}

export function gurArt(kind: 'khejur' | 'akh' | 'liquid'): string {
  const parts = [backdrop(600, 640, 420, '#FBEBD0')]
  // Banana leaf base.
  parts.push(`<path d="M90 850 C 380 640 820 640 1110 850 C 820 1000 380 1000 90 850 Z" fill="#4F8C3F"/><path d="M100 850 C 420 800 780 800 1100 850" stroke="#B8D98E" stroke-width="6" fill="none" opacity=".6"/>`)
  if (kind === 'liquid') {
    const g = id('pot')
    parts.push(`<defs><radialGradient id="${g}" cx="40%" cy="35%"><stop offset="0" stop-color="#C86A3A"/><stop offset="1" stop-color="#7A3518"/></radialGradient></defs>
      <ellipse cx="600" cy="640" rx="250" ry="210" fill="url(#${g})"/>
      <ellipse cx="600" cy="470" rx="190" ry="48" fill="#5B2810"/>
      <ellipse cx="600" cy="476" rx="170" ry="38" fill="#7B3A0E"/>
      <ellipse cx="560" cy="470" rx="60" ry="10" fill="#C77A2C" opacity=".6"/>
      <path d="M420 600 C 470 640 730 640 780 600" stroke="#E2A26A" stroke-width="6" fill="none" opacity=".45"/>`)
  } else {
    const col = kind === 'khejur' ? ['#7A3F14', '#9A5420', '#5E2E0E'] : ['#B9772A', '#D69238', '#8F5718']
    const pieces =
      kind === 'khejur'
        ? [
            [430, 720, 190],
            [770, 730, 200],
            [600, 590, 200],
            [860, 560, 150],
            [340, 580, 150],
          ]
        : [
            [450, 690, 250],
            [760, 700, 260],
            [600, 520, 230],
          ]
    for (const [x, y, r] of pieces) {
      if (kind === 'khejur') {
        parts.push(`<ellipse cx="${x}" cy="${y! + 18}" rx="${r}" ry="${r! * 0.36}" fill="#2A1406" opacity=".25"/>
          <ellipse cx="${x}" cy="${y}" rx="${r}" ry="${r! * 0.4}" fill="${col[1]}"/>
          <ellipse cx="${x}" cy="${y! - 6}" rx="${r! * 0.86}" ry="${r! * 0.3}" fill="${col[0]}"/>
          <ellipse cx="${x! - r! * 0.3}" cy="${y! - 14}" rx="${r! * 0.22}" ry="${r! * 0.06}" fill="#E0A05A" opacity=".5"/>`)
      } else {
        parts.push(`<rect x="${x! - r! / 2}" y="${y! - r! / 2.2}" width="${r}" height="${r! * 0.8}" rx="26" fill="${col[1]}"/>
          <rect x="${x! - r! / 2}" y="${y! - r! / 2.2}" width="${r}" height="${r! * 0.26}" rx="20" fill="${col[0]}" opacity=".7"/>
          <rect x="${x! - r! / 2 + 18}" y="${y! - r! / 2.2 + 10}" width="${r! * 0.3}" height="10" rx="5" fill="#F6D29A" opacity=".5"/>`)
      }
    }
  }
  return frame(1200, 1200, '#F3DDBA', parts.join(''))
}

export function boriArt(): string {
  const tray = id('tray')
  const dots = Array.from({ length: 19 }, (_, i) => {
    const a = i * 2.4
    const r = 40 + (i % 6) * 58
    const x = 600 + Math.cos(a) * r
    const y = 650 + Math.sin(a) * r * 0.72
    return `<g transform="translate(${x} ${y}) scale(1.75)"><ellipse cx="4" cy="22" rx="34" ry="10" fill="#6B4E22" opacity=".25"/><path d="M-32 18 C -30 -10 -10 -34 2 -40 C 14 -32 32 -8 32 18 Z" fill="#EADBB8"/><path d="M-12 -8 C -8 -22 0 -32 4 -34" stroke="#FFF8E6" stroke-width="5" fill="none" stroke-linecap="round" opacity=".7"/></g>`
  }).join('')
  return frame(
    1200,
    1200,
    '#F1DFC0',
    `<defs><radialGradient id="${tray}"><stop offset="0" stop-color="#D9B36E"/><stop offset="1" stop-color="#A97C36"/></radialGradient></defs>
     <ellipse cx="600" cy="660" rx="470" ry="400" fill="url(#${tray})"/>
     ${Array.from({ length: 12 }, (_, i) => `<ellipse cx="600" cy="660" rx="${440 - i * 34}" ry="${372 - i * 29}" fill="none" stroke="#8E6427" stroke-width="3" opacity=".35"/>`).join('')}
     ${dots}`,
  )
}

export function comboArt(): string {
  const P = MANGO_PALETTES
  const parts = [
    backdrop(600, 640, 430, '#FFF2D6'),
    `<path d="M210 640 L 990 640 L 920 960 L 280 960 Z" fill="#B88444"/>`,
    ...Array.from({ length: 7 }, (_, i) => `<path d="M${230 + i * 2} ${680 + i * 40} L ${970 - i * 2} ${680 + i * 40}" stroke="#8B5E2A" stroke-width="6" opacity=".5"/>`),
    leaf(240, 560, 300, -30),
    mango(420, 590, 300, -20, P.himsagar!),
    mango(780, 590, 300, 18, P.amrapali!),
    mango(600, 540, 330, 4, P.langra!, { leaf: true }),
    `<path d="M210 640 L 990 640 L 975 690 L 225 690 Z" fill="#9B6A32"/>`,
  ]
  return frame(1200, 1200, '#F6E4C3', parts.join(''))
}

/** Category tile images reuse the product art with a different crop/background. */
export function orchardArt(): string {
  const trees = Array.from({ length: 9 }, (_, i) => {
    const x = 120 + i * 140
    const y = 640 + (i % 2) * 40
    return `<rect x="${x - 10}" y="${y}" width="20" height="160" fill="#5B4022"/>
      <ellipse cx="${x}" cy="${y - 10}" rx="110" ry="90" fill="${i % 2 ? '#2F6B33' : '#3E7A3A'}"/>
      <ellipse cx="${x - 30}" cy="${y - 40}" rx="60" ry="44" fill="#4F8C3F" opacity=".7"/>
      ${[0, 1, 2].map((k) => `<ellipse cx="${x - 40 + k * 38}" cy="${y + 10 + (k % 2) * 18}" rx="12" ry="16" fill="${['#F2C230', '#F59A23', '#E8B436'][k]}"/>`).join('')}`
  }).join('')
  return frame(
    1200,
    1500,
    '#CFE3B8',
    `<rect width="1200" height="760" fill="#F7E7C0"/><circle cx="900" cy="300" r="120" fill="#FFD46A" opacity=".9"/>
     <path d="M0 640 C 300 560 800 600 1200 560 L1200 1500 L0 1500Z" fill="#9CC27A"/>
     ${trees}
     <path d="M0 1000 C 400 960 800 1040 1200 980 L1200 1500 L0 1500Z" fill="#7EA85C"/>
     <path d="M520 1500 C 560 1240 600 1100 640 1000 L 700 1000 C 690 1120 700 1300 760 1500Z" fill="#D9B77A" opacity=".8"/>`,
  )
}

export function promoArt(): string {
  const P = MANGO_PALETTES
  return frame(
    1200,
    900,
    '#245B32',
    [
      leaf(100, 200, 420, 12, '#1A4422', '#3B7438'),
      leaf(700, 100, 460, 40, '#1A4422', '#3B7438'),
      mango(420, 500, 380, -16, P.himsagar!),
      mango(760, 520, 400, 14, P.gopalbhog!, { leaf: true }),
    ].join(''),
  )
}

export function amsottoArt(): string {
  const rolls = [
    [420, 600, -14],
    [640, 560, 8],
    [520, 760, 4],
    [760, 760, -10],
  ]
    .map(
      ([x, y, r]) => `<g transform="translate(${x} ${y}) rotate(${r})">
        <ellipse cx="8" cy="70" rx="150" ry="24" fill="#5A3010" opacity=".2"/>
        <rect x="-150" y="-60" width="300" height="120" rx="58" fill="#D9711E"/>
        <rect x="-150" y="-60" width="300" height="46" rx="40" fill="#F0A13A" opacity=".8"/>
        <ellipse cx="150" cy="0" rx="34" ry="60" fill="#B8551A"/>
        <path d="M150 -40 a 22 40 0 1 1 0 80 a 12 24 0 1 0 0 -48" fill="none" stroke="#F4B34E" stroke-width="7"/>
      </g>`,
    )
    .join('')
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="1200" viewBox="0 0 1200 1200"><rect width="100%" height="100%" fill="#F6E1BF"/><circle cx="600" cy="640" r="420" fill="#FCEFD8"/>${leaf(230, 360, 320, -20)}${rolls}</svg>`
}

export function oilArt(): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="1200" viewBox="0 0 1200 1200"><rect width="100%" height="100%" fill="#F4E6C0"/><circle cx="600" cy="640" r="420" fill="#FCF1D6"/>
    <ellipse cx="610" cy="1000" rx="200" ry="26" fill="#3A2A10" opacity=".2"/>
    <path d="M540 300 h120 v80 c 0 40 120 80 120 180 v400 c 0 30 -20 40 -50 40 h-260 c -30 0 -50 -10 -50 -40 v-400 c 0 -100 120 -140 120 -180 z" fill="#E7B726"/>
    <path d="M560 330 v60 c0 40 -100 70 -110 160" stroke="#FFF2B0" stroke-width="16" fill="none" opacity=".5" stroke-linecap="round"/>
    <rect x="530" y="250" width="140" height="70" rx="12" fill="#245B32"/>
    <rect x="460" y="640" width="280" height="200" rx="16" fill="#F7EBD0"/><rect x="460" y="640" width="280" height="40" fill="#245B32"/>
    <text x="600" y="780" text-anchor="middle" font-family="Georgia, serif" font-size="44" fill="#3B2A12">OIL</text>
    ${leaf(220, 880, 300, -10, '#5C7A1E', '#A3B83A')}</svg>`
}
