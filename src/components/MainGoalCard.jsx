import { useState } from 'react'

function todayISO() {
  return new Date().toISOString().slice(0, 10)
}

function diaAtual(dataInicio) {
  const inicio = new Date(`${dataInicio}T00:00:00`)
  const hoje = new Date()
  hoje.setHours(0, 0, 0, 0)
  const diff = Math.floor((hoje - inicio) / (1000 * 60 * 60 * 24))
  return diff + 1
}

function diasTotais(dataInicio, dataFim) {
  const inicio = new Date(`${dataInicio}T00:00:00`)
  const fim = new Date(`${dataFim}T00:00:00`)
  return Math.max(1, Math.round((fim - inicio) / (1000 * 60 * 60 * 24)) + 1)
}

export default function MainGoalCard({ challenge, onSetChallenge }) {
  const [editing, setEditing] = useState(false)
  const [titulo, setTitulo] = useState('')
  const [dataInicio, setDataInicio] = useState(todayISO())
  const [dataFim, setDataFim] = useState(todayISO())

  const total = challenge ? diasTotais(challenge.data_inicio, challenge.data_fim) : 0
  const dia = challenge ? Math.min(Math.max(diaAtual(challenge.data_inicio), 0), total) : 0
  const concluido = challenge && dia >= total
  const pct = challenge ? Math.min(100, (dia / total) * 100) : 0

  async function handleSubmit(e) {
    e.preventDefault()
    await onSetChallenge({ titulo, data_inicio: dataInicio, data_fim: dataFim })
    setTitulo('')
    setDataInicio(todayISO())
    setDataFim(todayISO())
    setEditing(false)
  }

  return (
    <div className="card">
      <h2>Desafio do grupo</h2>
      {challenge ? (
        <>
          <p className="info">{challenge.titulo}</p>
          <p className="big-number">{concluido ? '🎉 Concluído!' : `Dia ${dia} de ${total}`}</p>
          <div className="calorie-progress-track">
            <div className="calorie-progress-fill" style={{ width: `${pct}%` }} />
          </div>
          <p className="calorie-progress-label">
            {new Date(`${challenge.data_inicio}T00:00:00`).toLocaleDateString('pt-BR')} até{' '}
            {new Date(`${challenge.data_fim}T00:00:00`).toLocaleDateString('pt-BR')}
          </p>
        </>
      ) : (
        <p className="empty-state">Nenhum desafio definido ainda.</p>
      )}

      {editing ? (
        <form onSubmit={handleSubmit}>
          <label>
            Título
            <input value={titulo} onChange={(e) => setTitulo(e.target.value)} placeholder="Ex: 21 dias sem açúcar" required />
          </label>
          <div className="grid-2">
            <label>
              Data de início
              <input type="date" value={dataInicio} onChange={(e) => setDataInicio(e.target.value)} required />
            </label>
            <label>
              Data final
              <input type="date" value={dataFim} min={dataInicio} onChange={(e) => setDataFim(e.target.value)} required />
            </label>
          </div>
          <div className="form-actions">
            <button type="submit">Salvar</button>
            <button type="button" className="link-button" onClick={() => setEditing(false)}>
              Cancelar
            </button>
          </div>
        </form>
      ) : (
        <button className="link-button" onClick={() => setEditing(true)}>
          {challenge ? 'Definir novo desafio' : 'Definir desafio'}
        </button>
      )}
    </div>
  )
}
