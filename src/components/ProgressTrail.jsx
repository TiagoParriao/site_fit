import MedalBadge from './MedalBadge'
import { colorForUser } from '../lib/avatarColor'

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
              style={{ left: `${lane.pct}%`, backgroundColor: colorForUser(lane.user_id) }}
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
