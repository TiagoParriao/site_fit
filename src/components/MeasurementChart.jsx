const WIDTH = 560
const HEIGHT = 200
const PADDING = 32

export default function MeasurementChart({ logs }) {
  if (!logs || logs.length === 0) {
    return <p className="empty-state">Sem histórico para essa medida ainda.</p>
  }

  const valores = logs.map((l) => l.valor_cm)
  const min = Math.min(...valores) - 1
  const max = Math.max(...valores) + 1
  const span = max - min || 1

  const stepX = logs.length > 1 ? (WIDTH - PADDING * 2) / (logs.length - 1) : 0
  const points = logs.map((log, i) => {
    const x = PADDING + i * stepX
    const y = HEIGHT - PADDING - ((log.valor_cm - min) / span) * (HEIGHT - PADDING * 2)
    return { x, y, log }
  })

  const pathD = points.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x},${p.y}`).join(' ')

  return (
    <svg className="weight-chart" viewBox={`0 0 ${WIDTH} ${HEIGHT}`}>
      <path d={pathD} className="chart-line" fill="none" />
      {points.map((p, i) => (
        <g key={i}>
          <circle cx={p.x} cy={p.y} r={4} className="chart-point" />
          <text x={p.x} y={HEIGHT - 8} textAnchor="middle" className="chart-x-label">
            {new Date(`${p.log.data}T00:00:00`).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}
          </text>
        </g>
      ))}
    </svg>
  )
}
