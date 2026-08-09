export default function DailyKcalBoard({ members, kcalHojePorMembro }) {
  return (
    <div className="card">
      <h2>Kcal de hoje</h2>
      {members.length === 0 ? (
        <p className="empty-state">Nenhum membro no grupo.</p>
      ) : (
        <ul className="daily-kcal-list">
          {members.map((m) => {
            const consumido = kcalHojePorMembro[m.user_id] ?? 0
            const meta = m.meta_kcal_diaria ?? 2000
            const over = consumido > meta
            return (
              <li key={m.user_id} className="daily-kcal-item">
                <span className="daily-kcal-name">{m.nome}</span>
                <span className={`daily-kcal-value${over ? ' over' : ''}`}>
                  {consumido} / {meta} kcal
                </span>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
