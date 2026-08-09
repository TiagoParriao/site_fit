import MedalBadge from './MedalBadge'

const COLORS = ['#ff6b6b', '#4dabf7', '#51cf66', '#ffd43b', '#cc5de8', '#ff922b', '#20c997']

function colorFor(userId) {
  let hash = 0
  for (const ch of userId) hash = (hash * 31 + ch.charCodeAt(0)) % COLORS.length
  return COLORS[hash]
}

function initials(nome) {
  return (nome || '?').trim().charAt(0).toUpperCase()
}

export default function ProgressTrail({ members, progress, goalDays = 5 }) {
  if (!members || members.length === 0) {
    return <p className="empty-state">Entre ou crie um grupo para ver a trilha da semana.</p>
  }

  const ranked = members
    .map((m) => ({ member: m, reachDate: progress[m.user_id]?.reachDate ?? null }))
    .filter((r) => r.reachDate)
    .sort((a, b) => new Date(a.reachDate) - new Date(b.reachDate))
  const rankByUser = Object.fromEntries(ranked.map((r, i) => [r.member.user_id, i + 1]))

  return (
    <div className="progress-trail">
      <div className="trail-finish-label">
        🏁 Meta da semana: {goalDays} de 7 dias dentro da meta de calorias
      </div>
      {members.map((member) => {
        const p = progress[member.user_id] ?? { daysMet: 0 }
        const pct = Math.min(100, (p.daysMet / goalDays) * 100)
        const rank = rankByUser[member.user_id]
        return (
          <div className="trail-lane" key={member.user_id}>
            <div className="trail-lane-label">
              <span>{member.nome}</span>
              <MedalBadge rank={rank} />
              <span className="trail-lane-count">
                {p.daysMet}/{goalDays}
              </span>
            </div>
            <div className="trail-track">
              <div className="trail-finish-line" style={{ left: '100%' }} />
              <div
                className="trail-avatar"
                style={{ left: `${pct}%`, backgroundColor: colorFor(member.user_id) }}
                title={member.nome}
              >
                {initials(member.nome)}
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
