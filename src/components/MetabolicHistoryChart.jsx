import { colorForUser } from '../lib/avatarColor'
import { weekdayLabel, shortDateLabel, niceMax } from '../lib/chartAxis'

const HEIGHT = 220
const PADDING_LEFT = 42
const PADDING_RIGHT = 12
const PADDING_TOP = 18
const PADDING_BOTTOM = 34
const GROUP_GAP = 24
const BAR_GAP = 4
const BAR_WIDTH = 14
const STEP = 200

// Igual a KcalHistoryChart, mas com eixo simétrico em torno do zero — o saldo
// baseado na TMB pode ser negativo (dia em que a pessoa comeu mais do que gastou).
export default function MetabolicHistoryChart({ dates, series, emptyMessage = 'Sem registros nesse período.' }) {
  if (!dates || dates.length === 0 || !series || series.length === 0) {
    return <p className="empty-state">{emptyMessage}</p>
  }

  const allValues = series.flatMap((s) => s.values)
  const maxValue = Math.max(...allValues, 0)
  const minValue = Math.min(...allValues, 0)
  const top = niceMax(maxValue, STEP)
  const bottom = minValue < 0 ? -niceMax(-minValue, STEP) : 0
  const range = top - bottom
  const plotHeight = HEIGHT - PADDING_TOP - PADDING_BOTTOM

  const groupWidth = series.length * BAR_WIDTH + (series.length - 1) * BAR_GAP
  const width = PADDING_LEFT + dates.length * groupWidth + (dates.length - 1) * GROUP_GAP + PADDING_RIGHT

  const scaleY = (value) => HEIGHT - PADDING_BOTTOM - ((value - bottom) / range) * plotHeight
  const zeroY = scaleY(0)

  const ticks = []
  for (let v = 0; v <= top; v += STEP) ticks.push(v)
  for (let v = -STEP; v >= bottom; v -= STEP) ticks.push(v)

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

        {dates.map((date, di) => {
          const groupX = PADDING_LEFT + di * (groupWidth + GROUP_GAP)
          return (
            <g key={date}>
              {series.map((s, si) => {
                const value = s.values[di]
                const y = value >= 0 ? scaleY(value) : zeroY
                const barHeight = Math.abs(scaleY(value) - zeroY)
                const x = groupX + si * (BAR_WIDTH + BAR_GAP)
                const labelY = value >= 0 ? y - 3 : y + barHeight + 10
                return (
                  <g key={s.user_id}>
                    <rect x={x} y={y} width={BAR_WIDTH} height={barHeight} fill={colorForUser(s.user_id, s.cor)} rx={2}>
                      <title>{`${s.nome}: ${value} kcal`}</title>
                    </rect>
                    {value !== 0 && (
                      <text x={x + BAR_WIDTH / 2} y={labelY} textAnchor="middle" className="chart-bar-value">
                        {value}
                      </text>
                    )}
                  </g>
                )
              })}
              <text x={groupX + groupWidth / 2} y={HEIGHT - 20} textAnchor="middle" className="chart-x-weekday">
                {weekdayLabel(date)}
              </text>
              <text x={groupX + groupWidth / 2} y={HEIGHT - 8} textAnchor="middle" className="chart-x-sublabel">
                {shortDateLabel(date)}
              </text>
            </g>
          )
        })}
      </svg>
    </div>
  )
}
