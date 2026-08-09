export default function CalorieProgressBar({ consumido, meta }) {
  const pct = Math.min(100, Math.round((consumido / meta) * 100))
  const over = consumido > meta

  return (
    <div className="calorie-progress">
      <div className="calorie-progress-track">
        <div
          className={`calorie-progress-fill${over ? ' over' : ''}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <p className="calorie-progress-label">
        {consumido} / {meta} kcal ({pct}%){over ? ' — meta ultrapassada' : ''}
      </p>
    </div>
  )
}
