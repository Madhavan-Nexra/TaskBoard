// Small flat-style decorative illustrations for page hero banners.
// Purely visual — no data, no behavior, safe to swap out independently of layout.

export function BoardIllustration() {
  return (
    <svg viewBox="0 0 200 160" className="h-full w-full" role="img" aria-label="Person completing tasks at a laptop">
      <circle cx="100" cy="80" r="72" fill="#DBEAFE" />
      <rect x="40" y="108" width="120" height="10" rx="5" fill="#BFDBFE" />
      <rect x="58" y="72" width="84" height="52" rx="8" fill="#1D4ED8" />
      <rect x="66" y="80" width="68" height="36" rx="4" fill="#EFF6FF" />
      <circle cx="100" cy="55" r="20" fill="#FDBA74" />
      <path d="M78 100 q22 22 44 0 v14 q-22 16 -44 0 z" fill="#2563EB" />
      <path d="M42 46 l8 8 16-16" stroke="#22C55E" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      <path d="M150 40 l7 7 14-14" stroke="#22C55E" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      <path d="M158 90 l6 6 12-12" stroke="#F59E0B" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      <path d="M30 90 q-4 10 6 12 q-8 4 -4 12" stroke="#34D399" strokeWidth="4" strokeLinecap="round" fill="none" />
    </svg>
  )
}

export function SettingsIllustration() {
  return (
    <svg viewBox="0 0 200 160" className="h-full w-full" role="img" aria-label="Person adjusting settings">
      <circle cx="100" cy="80" r="72" fill="#EDE9FE" />
      <rect x="72" y="34" width="56" height="92" rx="10" fill="#312E81" />
      <rect x="80" y="44" width="40" height="72" rx="4" fill="#EEF2FF" />
      <circle cx="92" cy="56" r="4" fill="#6366F1" />
      <rect x="100" y="53" width="14" height="6" rx="3" fill="#A5B4FC" />
      <circle cx="92" cy="70" r="4" fill="#22C55E" />
      <rect x="100" y="67" width="14" height="6" rx="3" fill="#A5B4FC" />
      <circle cx="92" cy="84" r="4" fill="#F59E0B" />
      <rect x="100" y="81" width="14" height="6" rx="3" fill="#A5B4FC" />
      <circle cx="146" cy="50" r="10" fill="none" stroke="#818CF8" strokeWidth="4" />
      <circle cx="146" cy="50" r="3" fill="#818CF8" />
      <circle cx="40" cy="104" r="8" fill="none" stroke="#C4B5FD" strokeWidth="4" />
      <circle cx="40" cy="104" r="2.5" fill="#C4B5FD" />
      <circle cx="150" cy="112" r="6" fill="#FDE68A" />
    </svg>
  )
}

export function HistoryIllustration() {
  return (
    <svg viewBox="0 0 200 160" className="h-full w-full" role="img" aria-label="Trophy celebrating completed tasks">
      <circle cx="100" cy="80" r="72" fill="#D1FAE5" />
      <rect x="82" y="118" width="36" height="10" rx="3" fill="#059669" />
      <rect x="90" y="104" width="20" height="18" fill="#10B981" />
      <path d="M62 52 h76 v24 a38 38 0 0 1 -76 0 z" fill="#F59E0B" />
      <path d="M62 58 q-18 0 -14 20 q2 12 18 12" fill="none" stroke="#D97706" strokeWidth="5" />
      <path d="M138 58 q18 0 14 20 q-2 12 -18 12" fill="none" stroke="#D97706" strokeWidth="5" />
      <circle cx="100" cy="72" r="14" fill="#FDE68A" />
      <path d="M94 72 l4 4 8-8" stroke="#B45309" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      <rect x="30" y="112" width="10" height="16" rx="2" fill="#6EE7B7" />
      <rect x="45" y="104" width="10" height="24" rx="2" fill="#34D399" />
      <rect x="145" y="108" width="10" height="20" rx="2" fill="#6EE7B7" />
      <rect x="160" y="98" width="10" height="30" rx="2" fill="#34D399" />
    </svg>
  )
}

export function FocusIllustration() {
  return (
    <svg viewBox="0 0 120 90" className="h-full w-full" role="img" aria-label="Laptop and a cup of coffee on a desk">
      <rect x="8" y="70" width="104" height="8" rx="2" fill="#1E3A8A" />
      <rect x="24" y="34" width="56" height="38" rx="4" fill="#3B82F6" />
      <rect x="30" y="40" width="44" height="26" rx="2" fill="#EFF6FF" />
      <rect x="86" y="52" width="14" height="18" rx="2" fill="#F1F5F9" />
      <path d="M86 52 h14 v4 h-14 z" fill="#CBD5E1" />
      <path d="M90 46 q2 -4 4 0 q2 -4 4 0" stroke="#E2E8F0" strokeWidth="2" fill="none" strokeLinecap="round" />
    </svg>
  )
}
