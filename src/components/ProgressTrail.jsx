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

export default function ProgressTrail({ lanes, emptyMessage }) {
  if (!lanes || lanes.length === 0) {
    return <p className="empty-state">{emptyMessage ?? 'Nada para mostrar ainda.'}</p>
  }

  return (
    <div className="progress-trail">
      {lanes.map((lane) => (
        <div className="trail-lane" key={lane.user_id}>
          <div className="trail-lane-label">
            <span>{lane.nome}</span>
            <MedalBadge rank={lane.rank} />
            <span className="trail-lane-count">{lane.label}</span>
          </div>
          <div className="trail-track">
            <div className="trail-finish-line" style={{ left: '100%' }} />
            <div
              className="trail-avatar"
              style={{ left: `${lane.pct}%`, backgroundColor: colorFor(lane.user_id) }}
              title={lane.nome}
            >
              {initials(lane.nome)}
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
