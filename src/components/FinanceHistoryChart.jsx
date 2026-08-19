import { shortDateLabel, niceMax } from '../lib/chartAxis'

const HEIGHT = 220
const PADDING_LEFT = 48
const PADDING_RIGHT = 16
const PADDING_TOP = 16
const PADDING_BOTTOM = 30
const STEP_X = 44

function pickStep(maxAbs) {
  if (maxAbs <= 200) return 50
  if (maxAbs <= 1000) return 100
  if (maxAbs <= 5000) return 500
  return 1000
}

export default function FinanceHistoryChart({ logs, saldoInicial = 0 }) {
  if (!logs || logs.length === 0) {
    return <p className="empty-state">Sem lançamentos ainda.</p>
  }

  const sorted = [...logs].sort((a, b) => new Date(a.data) - new Date(b.data))

  let running = saldoInicial
  const points = sorted.map((log) => {
    running += log.tipo === 'receita' ? Number(log.valor) : -Number(log.valor)
    return { log, saldo: running }
  })

  const saldos = points.map((p) => p.saldo)
  saldos.push(saldoInicial)
  const min = Math.min(...saldos, 0)
  const max = Math.max(...saldos, 0)

  const step = pickStep(Math.max(Math.abs(min), Math.abs(max), 1))
  const top = niceMax(max, step)
  const bottom = min < 0 ? -niceMax(-min, step) : 0
  const range = top - bottom || 1
  const plotHeight = HEIGHT - PADDING_TOP - PADDING_BOTTOM

  const width = PADDING_LEFT + points.length * STEP_X + PADDING_RIGHT

  const scaleY = (value) => HEIGHT - PADDING_BOTTOM - ((value - bottom) / range) * plotHeight

  const coords = points.map((p, i) => ({
    x: PADDING_LEFT + i * STEP_X + STEP_X / 2,
    y: scaleY(p.saldo),
    log: p.log,
    saldo: p.saldo,
  }))

  const pathD = coords.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x},${p.y}`).join(' ')
  const zeroY = scaleY(0)

  const ticks = []
  for (let v = 0; v <= top; v += step) ticks.push(v)
  for (let v = -step; v >= bottom; v -= step) ticks.push(v)

  return (
    <div className="kcal-chart-scroll">
      <svg className="kcal-chart" viewBox={`0 0 ${width} ${HEIGHT}`} width={width}>
        {ticks.map((tick) => (
          <g key={tick}>
            <line x1={PADDING_LEFT} y1={scaleY(tick)} x2={width - PADDING_RIGHT} y2={scaleY(tick)} className="chart-axis-line" />
            <text x={PADDING_LEFT - 6} y={scaleY(tick) + 3} textAnchor="end" className="chart-axis-label">
              {tick}
            </text>
          </g>
        ))}
        {min < 0 && (
          <line x1={PADDING_LEFT} y1={zeroY} x2={width - PADDING_RIGHT} y2={zeroY} className="chart-goal-line" />
        )}
        <path d={pathD} className="chart-line" fill="none" />
        {coords.map((p, i) => (
          <g key={i}>
            <circle cx={p.x} cy={p.y} r={4} className="chart-point" />
            <text x={p.x} y={HEIGHT - 8} textAnchor="middle" className="chart-x-label">
              {shortDateLabel(p.log.data)}
            </text>
          </g>
        ))}
      </svg>
    </div>
  )
}
