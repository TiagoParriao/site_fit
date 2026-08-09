import { useState } from 'react'

function diaAtual(dataInicio) {
  const inicio = new Date(`${dataInicio}T00:00:00`)
  const hoje = new Date()
  hoje.setHours(0, 0, 0, 0)
  const diff = Math.floor((hoje - inicio) / (1000 * 60 * 60 * 24))
  return diff + 1
}

export default function MainGoalCard({ goal, onSetGoal }) {
  const [editing, setEditing] = useState(false)
  const [titulo, setTitulo] = useState('')
  const [diasTotais, setDiasTotais] = useState('')

  const dia = goal ? Math.min(Math.max(diaAtual(goal.data_inicio), 0), goal.dias_totais) : 0
  const concluida = goal && dia >= goal.dias_totais
  const pct = goal ? Math.min(100, (dia / goal.dias_totais) * 100) : 0

  async function handleSubmit(e) {
    e.preventDefault()
    await onSetGoal({ titulo, dias_totais: Number(diasTotais) })
    setTitulo('')
    setDiasTotais('')
    setEditing(false)
  }

  return (
    <div className="card">
      <h2>Meta principal</h2>
      {goal ? (
        <>
          <p className="info">{goal.titulo}</p>
          <p className="big-number">
            {concluida ? '🎉 Concluída!' : `Dia ${dia} de ${goal.dias_totais}`}
          </p>
          <div className="calorie-progress-track">
            <div className="calorie-progress-fill" style={{ width: `${pct}%` }} />
          </div>
        </>
      ) : (
        <p className="empty-state">Nenhuma meta definida ainda.</p>
      )}

      {editing ? (
        <form onSubmit={handleSubmit}>
          <label>
            Título
            <input value={titulo} onChange={(e) => setTitulo(e.target.value)} placeholder="Ex: 21 dias sem açúcar" required />
          </label>
          <label>
            Dias totais
            <input type="number" value={diasTotais} onChange={(e) => setDiasTotais(e.target.value)} required />
          </label>
          <div className="form-actions">
            <button type="submit">Salvar</button>
            <button type="button" className="link-button" onClick={() => setEditing(false)}>
              Cancelar
            </button>
          </div>
        </form>
      ) : (
        <button className="link-button" onClick={() => setEditing(true)}>
          {goal ? 'Definir nova meta' : 'Definir meta'}
        </button>
      )}
    </div>
  )
}
