import { niceTicks } from '../lib/chartAxis'

const WIDTH = 560
const HEIGHT = 220
const PADDING_LEFT = 34
const PADDING_RIGHT = 16
const PADDING_TOP = 22
const PADDING_BOTTOM = 28

export default function WeightHistoryChart({ logs, goalKg, goalLabel, goalAchieved }) {
  if (!logs || logs.length === 0) {
    return <p className="empty-state">Sem registros de peso ainda.</p>
  }

  const sorted = [...logs].sort((a, b) => new Date(a.data) - new Date(b.data))
  const pesos = sorted.map((l) => l.peso_kg)
  if (goalKg) pesos.push(goalKg)

  const min = Math.min(...pesos) - 1
  const max = Math.max(...pesos) + 1
  const span = max - min || 1

  const plotWidth = WIDTH - PADDING_LEFT - PADDING_RIGHT
  const plotHeight = HEIGHT - PADDING_TOP - PADDING_BOTTOM
  const stepX = sorted.length > 1 ? plotWidth / (sorted.length - 1) : 0
  const scaleY = (peso) => PADDING_TOP + plotHeight - ((peso - min) / span) * plotHeight

  const points = sorted.map((log, i) => ({
    x: PADDING_LEFT + i * stepX,
    y: scaleY(log.peso_kg),
    log,
  }))

  const pathD = points.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x},${p.y}`).join(' ')
  const goalY = goalKg ? scaleY(goalKg) : null
  const ticks = niceTicks(min, max, 4)

  return (
    <svg className="weight-chart" viewBox={`0 0 ${WIDTH} ${HEIGHT}`}>
      {ticks.map((tick) => (
        <g key={tick}>
          <line x1={PADDING_LEFT} y1={scaleY(tick)} x2={WIDTH - PADDING_RIGHT} y2={scaleY(tick)} className="chart-axis-line" />
          <text x={PADDING_LEFT - 6} y={scaleY(tick) + 3} textAnchor="end" className="chart-axis-label">
            {tick}
          </text>
        </g>
      ))}

      {goalY !== null && (
        <>
          <line x1={PADDING_LEFT} y1={goalY} x2={WIDTH - PADDING_RIGHT} y2={goalY} className="chart-goal-line" />
          <text x={WIDTH - PADDING_RIGHT} y={goalY - 6} textAnchor="end" className="chart-goal-label">
            {goalLabel ?? `meta ${goalKg}kg`}
            {goalAchieved ? ' ✓' : ''}
          </text>
        </>
      )}

      <path d={pathD} className="chart-line" fill="none" />

      {points.map((p, i) => {
        const delta = i > 0 ? p.log.peso_kg - points[i - 1].log.peso_kg : null
        return (
          <g key={p.log.id}>
            <circle cx={p.x} cy={p.y} r={4} className="chart-point" />
            {delta !== null && Math.abs(delta) > 0.01 && (
              <text x={p.x} y={Math.max(p.y - 10, 12)} textAnchor="middle" className={`chart-delta-label${delta > 0 ? ' up' : ''}`}>
                {delta > 0 ? '+' : ''}
                {delta.toFixed(1)}
              </text>
            )}
            <text x={p.x} y={HEIGHT - 8} textAnchor="middle" className="chart-x-label">
              {new Date(`${p.log.data}T00:00:00`).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}
            </text>
          </g>
        )
      })}
    </svg>
  )
}
