export default function FinanceProgressBar({ gasto, meta }) {
  const pct = meta > 0 ? Math.min(100, Math.round((gasto / meta) * 100)) : 0
  const over = gasto > meta

  return (
    <div className="calorie-progress">
      <div className="calorie-progress-track">
        <div className={`calorie-progress-fill${over ? ' over' : ''}`} style={{ width: `${pct}%` }} />
      </div>
      <p className="calorie-progress-label">
        R$ {gasto.toFixed(2)} / R$ {meta.toFixed(2)} ({pct}%){over ? ' — meta ultrapassada' : ''}
      </p>
    </div>
  )
}
