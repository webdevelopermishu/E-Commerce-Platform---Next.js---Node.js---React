/** Admin panel mark: a simple original mango-and-leaf glyph. */
function Mark({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" aria-hidden>
      <path d="M33 14c-3-6 1-10 7-11-1 6-3 9-7 11z" fill="#477B3B" />
      <path d="M32 15c13 0 22 10 21 24-1 13-11 21-23 20C18 58 10 49 12 37c2-12 9-22 20-22z" fill="#F59A23" />
      <path d="M26 24c-6 3-9 9-9 15" stroke="#FFC928" strokeWidth="4" strokeLinecap="round" fill="none" />
    </svg>
  )
}

export function AdminLogo() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
      <Mark size={48} />
      <span style={{ fontSize: 22, fontWeight: 600 }}>Shop admin</span>
    </div>
  )
}

export function AdminIcon() {
  return <Mark size={28} />
}
