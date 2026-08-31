import { niceTicks } from '../lib/chartAxis'

const WIDTH = 560
const HEIGHT = 220
const PADDING_LEFT = 34
const PADDING_RIGHT = 16
const PADDING_TOP = 22
const PADDING_BOTTOM = 28

export default function MeasurementChart({ logs }) {
  if (!logs || logs.length === 0) {
    return <p className="empty-state">Sem histórico para essa medida ainda.</p>
  }

  const valores = logs.map((l) => l.valor_cm)
  const min = Math.min(...valores) - 1
  const max = Math.max(...valores) + 1
  const span = max - min || 1

  const plotWidth = WIDTH - PADDING_LEFT - PADDING_RIGHT
  const plotHeight = HEIGHT - PADDING_TOP - PADDING_BOTTOM
  const stepX = logs.length > 1 ? plotWidth / (logs.length - 1) : 0
  const scaleY = (valor) => PADDING_TOP + plotHeight - ((valor - min) / span) * plotHeight

  const points = logs.map((log, i) => ({
    x: PADDING_LEFT + i * stepX,
    y: scaleY(log.valor_cm),
    log,
  }))

  const pathD = points.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x},${p.y}`).join(' ')
  const ticks = niceTicks(min, max, 4)

  const primeiro = logs[0].valor_cm
  const ultimo = logs[logs.length - 1].valor_cm
  const deltaTotal = ultimo - primeiro

  return (
    <>
      {logs.length > 1 && (
        <p className="measurement-diff">
          {deltaTotal > 0 ? '+' : ''}
          {deltaTotal.toFixed(1)}cm desde {new Date(`${logs[0].data}T00:00:00`).toLocaleDateString('pt-BR')}
        </p>
      )}
      <svg className="weight-chart" viewBox={`0 0 ${WIDTH} ${HEIGHT}`}>
        {ticks.map((tick) => (
          <g key={tick}>
            <line x1={PADDING_LEFT} y1={scaleY(tick)} x2={WIDTH - PADDING_RIGHT} y2={scaleY(tick)} className="chart-axis-line" />
            <text x={PADDING_LEFT - 6} y={scaleY(tick) + 3} textAnchor="end" className="chart-axis-label">
              {tick}
            </text>
          </g>
        ))}

        <path d={pathD} className="chart-line" fill="none" />

        {points.map((p, i) => {
          const delta = i > 0 ? p.log.valor_cm - points[i - 1].log.valor_cm : null
          return (
            <g key={p.log.id}>
              <circle cx={p.x} cy={p.y} r={4} className="chart-point" />
              {delta !== null && Math.abs(delta) > 0.01 && (
                <text x={p.x} y={Math.max(p.y - 10, 12)} textAnchor="middle" className="chart-delta-label-neutral">
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
    </>
  )
}
