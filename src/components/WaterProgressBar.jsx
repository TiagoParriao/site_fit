function formatLitros(ml) {
  return (ml / 1000).toFixed(1).replace('.', ',')
}

export default function WaterProgressBar({ consumidoMl, metaMl }) {
  const pct = metaMl > 0 ? Math.min(100, Math.round((consumidoMl / metaMl) * 100)) : 0
  const over = consumidoMl > metaMl

  return (
    <div className="calorie-progress">
      <div className="calorie-progress-track">
        <div className={`calorie-progress-fill${over ? ' over' : ''}`} style={{ width: `${pct}%` }} />
      </div>
      <p className="calorie-progress-label">
        {formatLitros(consumidoMl)}L / {formatLitros(metaMl)}L ({pct}%){over ? ' — meta ultrapassada' : ''}
      </p>
    </div>
  )
}
