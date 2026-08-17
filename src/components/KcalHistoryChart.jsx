import { colorForUser } from '../lib/avatarColor'
import { weekdayLabel, shortDateLabel, niceMax, axisTicks } from '../lib/chartAxis'

const HEIGHT = 220
const PADDING_LEFT = 42
const PADDING_RIGHT = 12
const PADDING_TOP = 32
const PADDING_BOTTOM = 34
const GROUP_GAP = 30
const BAR_GAP = 8
const BAR_WIDTH = 20
const STEP = 200

const formatKcal = (value) => new Intl.NumberFormat('pt-BR').format(value)

export default function KcalHistoryChart({ dates, series, emptyMessage = 'Sem registros de calorias nesse período.' }) {
  if (!dates || dates.length === 0 || !series || series.length === 0) {
    return <p className="empty-state">{emptyMessage}</p>
  }

  const maxKcal = Math.max(...series.flatMap((s) => s.values), 1)
  const top = niceMax(maxKcal, STEP)
  const ticks = axisTicks(top, STEP)
  const plotHeight = HEIGHT - PADDING_TOP - PADDING_BOTTOM

  const groupWidth = series.length * BAR_WIDTH + (series.length - 1) * BAR_GAP
  const width = PADDING_LEFT + dates.length * groupWidth + (dates.length - 1) * GROUP_GAP + PADDING_RIGHT

  const scaleY = (value) => HEIGHT - PADDING_BOTTOM - (value / top) * plotHeight

  return (
    <div className="kcal-chart-scroll">
      <svg className="kcal-chart" viewBox={`0 0 ${width} ${HEIGHT}`} width={width} role="img" aria-label="Calorias por dia e por membro">
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
                const barHeight = (value / top) * plotHeight
                const x = groupX + si * (BAR_WIDTH + BAR_GAP)
                const y = HEIGHT - PADDING_BOTTOM - barHeight
                return (
                  <g key={s.user_id}>
                    <rect x={x} y={y} width={BAR_WIDTH} height={barHeight} fill={colorForUser(s.user_id, s.cor)} rx={2}>
                      <title>{`${s.nome}: ${value} kcal`}</title>
                    </rect>
                    {value > 0 && (
                      <text x={x + BAR_WIDTH / 2} y={Math.max(y - 5, 11)} textAnchor="middle" className="chart-bar-value">
                        {formatKcal(value)}
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
