const WIDTH = 560
const HEIGHT = 200
const PADDING = 32

export default function WeightHistoryChart({ logs, goalKg }) {
  if (!logs || logs.length === 0) {
    return <p className="empty-state">Sem registros de peso ainda.</p>
  }

  const sorted = [...logs].sort((a, b) => new Date(a.data) - new Date(b.data))
  const pesos = sorted.map((l) => l.peso_kg)
  if (goalKg) pesos.push(goalKg)

  const min = Math.min(...pesos) - 1
  const max = Math.max(...pesos) + 1
  const span = max - min || 1

  const stepX = sorted.length > 1 ? (WIDTH - PADDING * 2) / (sorted.length - 1) : 0
  const points = sorted.map((log, i) => {
    const x = PADDING + i * stepX
    const y = HEIGHT - PADDING - ((log.peso_kg - min) / span) * (HEIGHT - PADDING * 2)
    return { x, y, log }
  })

  const pathD = points.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x},${p.y}`).join(' ')
  const goalY = goalKg ? HEIGHT - PADDING - ((goalKg - min) / span) * (HEIGHT - PADDING * 2) : null

  return (
    <svg className="weight-chart" viewBox={`0 0 ${WIDTH} ${HEIGHT}`}>
      {goalY !== null && (
        <>
          <line x1={PADDING} y1={goalY} x2={WIDTH - PADDING} y2={goalY} className="chart-goal-line" />
          <text x={WIDTH - PADDING} y={goalY - 6} textAnchor="end" className="chart-goal-label">
            meta {goalKg}kg
          </text>
        </>
      )}
      <path d={pathD} className="chart-line" fill="none" />
      {points.map((p, i) => (
        <g key={i}>
          <circle cx={p.x} cy={p.y} r={4} className="chart-point" />
          <text x={p.x} y={HEIGHT - 8} textAnchor="middle" className="chart-x-label">
            {new Date(p.log.data).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}
          </text>
        </g>
      ))}
    </svg>
  )
}
