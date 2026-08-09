const MEDALS = ['🥇', '🥈', '🥉']

export default function MedalBadge({ rank }) {
  if (rank == null || rank > MEDALS.length) return null
  return <span className="medal-badge">{MEDALS[rank - 1]}</span>
}
