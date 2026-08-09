const WIDTH = 560
const HEIGHT = 220
const PADDING = 32

export default function ExerciseChart({ days }) {
  if (!days || days.length === 0) {
    return <p className="empty-state">Sem exercícios registrados nesse período.</p>
  }

  const maxMinutos = Math.max(...days.map((d) => d.minutos), 1)
  const maxKcal = Math.max(...days.map((d) => d.kcal_gasta), 1)

  const stepX = days.length > 1 ? (WIDTH - PADDING * 2) / days.length : 0
  const barWidth = Math.min(28, stepX * 0.5)

  const linePoints = days.map((d, i) => {
    const x = PADDING + stepX * i + stepX / 2
    const y = HEIGHT - PADDING - (d.kcal_gasta / maxKcal) * (HEIGHT - PADDING * 2)
    return { x, y, d }
  })
  const pathD = linePoints.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x},${p.y}`).join(' ')

  return (
    <>
      <svg className="exercise-chart" viewBox={`0 0 ${WIDTH} ${HEIGHT}`}>
        {days.map((d, i) => {
          const x = PADDING + stepX * i + stepX / 2 - barWidth / 2
          const barHeight = (d.minutos / maxMinutos) * (HEIGHT - PADDING * 2)
          const y = HEIGHT - PADDING - barHeight
          return (
            <g key={d.data}>
              <rect x={x} y={y} width={barWidth} height={barHeight} className="chart-bar" rx={3} />
              <text x={x + barWidth / 2} y={HEIGHT - 8} textAnchor="middle" className="chart-x-label">
                {new Date(`${d.data}T00:00:00`).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}
              </text>
            </g>
          )
        })}
        <path d={pathD} className="chart-line" fill="none" />
        {linePoints.map((p) => (
          <circle key={p.d.data} cx={p.x} cy={p.y} r={4} className="chart-point" />
        ))}
      </svg>
      <div className="chart-legend">
        <span><span className="chart-legend-swatch bar" /> Minutos</span>
        <span><span className="chart-legend-swatch line" /> Kcal gastas</span>
      </div>
    </>
  )
}
