const WIDTH = 560
const HEIGHT = 200
const PADDING = 32

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
  const span = max - min || 1

  const stepX = points.length > 1 ? (WIDTH - PADDING * 2) / (points.length - 1) : 0
  const coords = points.map((p, i) => {
    const x = PADDING + i * stepX
    const y = HEIGHT - PADDING - ((p.saldo - min) / span) * (HEIGHT - PADDING * 2)
    return { x, y, log: p.log, saldo: p.saldo }
  })

  const pathD = coords.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x},${p.y}`).join(' ')
  const zeroY = HEIGHT - PADDING - ((0 - min) / span) * (HEIGHT - PADDING * 2)

  return (
    <svg className="weight-chart" viewBox={`0 0 ${WIDTH} ${HEIGHT}`}>
      {min < 0 && (
        <line x1={PADDING} y1={zeroY} x2={WIDTH - PADDING} y2={zeroY} className="chart-goal-line" />
      )}
      <path d={pathD} className="chart-line" fill="none" />
      {coords.map((p, i) => (
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
