import { weekdayLabel, shortDateLabel, niceMax, axisTicks } from '../lib/chartAxis'

const HEIGHT = 220
const PADDING_LEFT = 42
const PADDING_RIGHT = 12
const PADDING_TOP = 18
const PADDING_BOTTOM = 44

export default function ExerciseChart({ days }) {
  if (!days || days.length === 0) {
    return <p className="empty-state">Sem exercícios registrados nesse período.</p>
  }

  const maxKcal = Math.max(...days.map((d) => d.kcal_gasta), 1)
  const step = maxKcal <= 800 ? 100 : 200
  const top = niceMax(maxKcal, step)
  const ticks = axisTicks(top, step)
  const plotHeight = HEIGHT - PADDING_TOP - PADDING_BOTTOM

  const width = 560
  const stepX = days.length > 0 ? (width - PADDING_LEFT - PADDING_RIGHT) / days.length : 0
  const barWidth = Math.min(32, stepX * 0.5)

  const scaleY = (value) => HEIGHT - PADDING_BOTTOM - (value / top) * plotHeight

  return (
    <svg className="exercise-chart" viewBox={`0 0 ${width} ${HEIGHT}`}>
      {ticks.map((tick) => (
        <g key={tick}>
          <line x1={PADDING_LEFT} y1={scaleY(tick)} x2={width - PADDING_RIGHT} y2={scaleY(tick)} className="chart-axis-line" />
          <text x={PADDING_LEFT - 6} y={scaleY(tick) + 3} textAnchor="end" className="chart-axis-label">
            {tick}
          </text>
        </g>
      ))}

      {days.map((d, i) => {
        const centerX = PADDING_LEFT + stepX * i + stepX / 2
        const x = centerX - barWidth / 2
        const barHeight = (d.kcal_gasta / top) * plotHeight
        const y = HEIGHT - PADDING_BOTTOM - barHeight
        return (
          <g key={d.data}>
            <rect x={x} y={y} width={barWidth} height={barHeight} className="chart-bar" rx={3} />
            {d.kcal_gasta > 0 && (
              <text x={centerX} y={y - 3} textAnchor="middle" className="chart-bar-value">
                {d.kcal_gasta}
              </text>
            )}
            <text x={centerX} y={HEIGHT - 30} textAnchor="middle" className="chart-x-weekday">
              {weekdayLabel(d.data)}
            </text>
            <text x={centerX} y={HEIGHT - 18} textAnchor="middle" className="chart-x-sublabel">
              {shortDateLabel(d.data)}
            </text>
            <text x={centerX} y={HEIGHT - 6} textAnchor="middle" className="chart-x-sublabel">
              {d.minutos}min
            </text>
          </g>
        )
      })}
    </svg>
  )
}
