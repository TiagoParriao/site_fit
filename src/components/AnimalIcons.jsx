const BASE = {
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.6,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
}

function Dot({ cx, cy }) {
  return <circle cx={cx} cy={cy} r={0.9} fill="currentColor" stroke="none" />
}

export function CatIcon({ size = 24 }) {
  return (
    <svg width={size} height={size} {...BASE}>
      <circle cx="12" cy="13" r="7" />
      <path d="M6.5 8 8.5 4.5 9.5 8" />
      <path d="M17.5 8 15.5 4.5 14.5 8" />
      <Dot cx="9.3" cy="12.5" />
      <Dot cx="14.7" cy="12.5" />
      <path d="M11 15h2l-1 1z" fill="currentColor" stroke="none" />
    </svg>
  )
}

export function DogIcon({ size = 24 }) {
  return (
    <svg width={size} height={size} {...BASE}>
      <circle cx="12" cy="13" r="7" />
      <path d="M6 7.5c-1.5 1-2 3.5-1 6" />
      <path d="M18 7.5c1.5 1 2 3.5 1 6" />
      <Dot cx="9.3" cy="12.5" />
      <Dot cx="14.7" cy="12.5" />
      <ellipse cx="12" cy="15.5" rx="1.3" ry="0.9" fill="currentColor" stroke="none" />
    </svg>
  )
}

export function FoxIcon({ size = 24 }) {
  return (
    <svg width={size} height={size} {...BASE}>
      <path d="M12 19c-4 0-6.5-3-6.5-6.5S9 6 12 6s6.5 3 6.5 6.5S16 19 12 19Z" />
      <path d="M6.5 8 4.5 4 8 7" />
      <path d="M17.5 8 19.5 4 16 7" />
      <Dot cx="9.3" cy="12" />
      <Dot cx="14.7" cy="12" />
      <path d="M12 14.5 10.7 16h2.6z" fill="currentColor" stroke="none" />
    </svg>
  )
}

export function OwlIcon({ size = 24 }) {
  return (
    <svg width={size} height={size} {...BASE}>
      <path d="M8 6l1.5 2" />
      <path d="M16 6l-1.5 2" />
      <circle cx="12" cy="13" r="7" />
      <circle cx="9" cy="12.5" r="2.3" />
      <circle cx="15" cy="12.5" r="2.3" />
      <Dot cx="9" cy="12.5" />
      <Dot cx="15" cy="12.5" />
      <path d="M12 14.5 10.8 16.3h2.4z" fill="currentColor" stroke="none" />
    </svg>
  )
}

export function PandaIcon({ size = 24 }) {
  return (
    <svg width={size} height={size} {...BASE}>
      <circle cx="6.5" cy="7" r="2.2" />
      <circle cx="17.5" cy="7" r="2.2" />
      <circle cx="12" cy="13" r="7" />
      <ellipse cx="9" cy="12.5" rx="2" ry="2.4" />
      <ellipse cx="15" cy="12.5" rx="2" ry="2.4" />
      <Dot cx="9" cy="12.8" />
      <Dot cx="15" cy="12.8" />
      <ellipse cx="12" cy="15.8" rx="1" ry="0.7" fill="currentColor" stroke="none" />
    </svg>
  )
}

export function KoalaIcon({ size = 24 }) {
  return (
    <svg width={size} height={size} {...BASE}>
      <circle cx="5.5" cy="11" r="3.2" />
      <circle cx="18.5" cy="11" r="3.2" />
      <circle cx="12" cy="13" r="6.3" />
      <Dot cx="9.5" cy="12" />
      <Dot cx="14.5" cy="12" />
      <ellipse cx="12" cy="15" rx="1.8" ry="1.3" />
    </svg>
  )
}

export function LionIcon({ size = 24 }) {
  return (
    <svg width={size} height={size} {...BASE}>
      <circle cx="12" cy="13" r="9" strokeDasharray="2.2 2.6" />
      <circle cx="12" cy="13" r="6" />
      <Dot cx="9.5" cy="12.5" />
      <Dot cx="14.5" cy="12.5" />
      <path d="M11 15h2l-1 1z" fill="currentColor" stroke="none" />
    </svg>
  )
}

export function RabbitIcon({ size = 24 }) {
  return (
    <svg width={size} height={size} {...BASE}>
      <path d="M8.5 9C7.5 6 8 3 9.3 3.3c1.1.3 1 3.4.4 6.2" />
      <path d="M15.5 9c1-3 .5-6-.8-5.7-1.1.3-1 3.4-.4 6.2" />
      <circle cx="12" cy="14.5" r="6.3" />
      <Dot cx="9.6" cy="14" />
      <Dot cx="14.4" cy="14" />
      <ellipse cx="12" cy="16.5" rx="1" ry="0.7" fill="currentColor" stroke="none" />
    </svg>
  )
}

export function BearIcon({ size = 24 }) {
  return (
    <svg width={size} height={size} {...BASE}>
      <circle cx="6.5" cy="7.5" r="2" />
      <circle cx="17.5" cy="7.5" r="2" />
      <circle cx="12" cy="13" r="7" />
      <Dot cx="9.3" cy="12.5" />
      <Dot cx="14.7" cy="12.5" />
      <circle cx="12" cy="15.7" r="1.6" />
    </svg>
  )
}

export function PenguinIcon({ size = 24 }) {
  return (
    <svg width={size} height={size} {...BASE}>
      <path d="M12 4c3.5 0 5.5 3 5.5 7 0 5-2 9-5.5 9s-5.5-4-5.5-9c0-4 2-7 5.5-7Z" />
      <path d="M9 12c1 2.5 5 2.5 6 0" />
      <Dot cx="10" cy="9" />
      <Dot cx="14" cy="9" />
      <path d="M11.2 10.6h1.6l-.8 1z" fill="currentColor" stroke="none" />
    </svg>
  )
}

export const ANIMAL_AVATARS = [
  { key: 'gato', label: 'Gato', Icon: CatIcon },
  { key: 'cachorro', label: 'Cachorro', Icon: DogIcon },
  { key: 'raposa', label: 'Raposa', Icon: FoxIcon },
  { key: 'coruja', label: 'Coruja', Icon: OwlIcon },
  { key: 'panda', label: 'Panda', Icon: PandaIcon },
  { key: 'coala', label: 'Coala', Icon: KoalaIcon },
  { key: 'leao', label: 'Leão', Icon: LionIcon },
  { key: 'coelho', label: 'Coelho', Icon: RabbitIcon },
  { key: 'urso', label: 'Urso', Icon: BearIcon },
  { key: 'pinguim', label: 'Pinguim', Icon: PenguinIcon },
]

export function AnimalAvatar({ avatarKey, size = 24 }) {
  const entry = ANIMAL_AVATARS.find((a) => a.key === avatarKey) ?? ANIMAL_AVATARS[0]
  const Icon = entry.Icon
  return <Icon size={size} />
}
