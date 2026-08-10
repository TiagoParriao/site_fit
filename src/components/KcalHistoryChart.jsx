import { colorForUser } from '../lib/avatarColor'

const HEIGHT = 220
const PADDING = 32
const GROUP_GAP = 24
const BAR_GAP = 4
const BAR_WIDTH = 14

export default function KcalHistoryChart({ dates, series }) {
  if (!dates || dates.length === 0 || !series || series.length === 0) {
    return <p className="empty-state">Sem registros de calorias nesse período.</p>
  }

  const maxKcal = Math.max(...series.flatMap((s) => s.values), 1)
  const groupWidth = series.length * BAR_WIDTH + (series.length - 1) * BAR_GAP
  const width = PADDING * 2 + dates.length * groupWidth + (dates.length - 1) * GROUP_GAP

  return (
    <div className="kcal-chart-scroll">
      <svg className="kcal-chart" viewBox={`0 0 ${width} ${HEIGHT}`} width={width}>
        {dates.map((date, di) => {
          const groupX = PADDING + di * (groupWidth + GROUP_GAP)
          return (
            <g key={date}>
              {series.map((s, si) => {
                const value = s.values[di]
                const barHeight = (value / maxKcal) * (HEIGHT - PADDING * 2)
                const x = groupX + si * (BAR_WIDTH + BAR_GAP)
                const y = HEIGHT - PADDING - barHeight
                return (
                  <rect key={s.user_id} x={x} y={y} width={BAR_WIDTH} height={barHeight} fill={colorForUser(s.user_id, s.cor)} rx={2}>
                    <title>{`${s.nome}: ${value} kcal`}</title>
                  </rect>
                )
              })}
              <text x={groupX + groupWidth / 2} y={HEIGHT - 8} textAnchor="middle" className="chart-x-label">
                {new Date(`${date}T00:00:00`).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}
              </text>
            </g>
          )
        })}
      </svg>
    </div>
  )
}
