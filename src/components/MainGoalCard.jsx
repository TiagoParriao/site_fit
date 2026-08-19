import { useState } from 'react'
import { todayISO } from '../lib/dates'

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

export default function MainGoalCard({ challenge, onSetChallenge, onEditChallenge }) {
  const [mode, setMode] = useState(null) // null | 'new' | 'edit'
  const [titulo, setTitulo] = useState('')
  const [dataInicio, setDataInicio] = useState(todayISO())
  const [dataFim, setDataFim] = useState(todayISO())

  const total = challenge ? diasTotais(challenge.data_inicio, challenge.data_fim) : 0
  const dia = challenge ? Math.min(Math.max(diaAtual(challenge.data_inicio), 0), total) : 0
  const concluido = challenge && dia >= total
  const pct = challenge ? Math.min(100, (dia / total) * 100) : 0

  function startNew() {
    setTitulo('')
    setDataInicio(todayISO())
    setDataFim(todayISO())
    setMode('new')
  }

  function startEdit() {
    setTitulo(challenge.titulo)
    setDataInicio(challenge.data_inicio)
    setDataFim(challenge.data_fim)
    setMode('edit')
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (mode === 'edit') {
      await onEditChallenge(challenge.id, { titulo, data_inicio: dataInicio, data_fim: dataFim })
    } else {
      await onSetChallenge({ titulo, data_inicio: dataInicio, data_fim: dataFim })
    }
    setMode(null)
  }

  return (
    <div className="card challenge-card-real">
      <div className="challenge-icon-real">◎</div>
      <div className="challenge-main-real">
      <span className="section-kicker">Desafio do grupo</span>
      {challenge ? (
        <>
          <h2>{challenge.titulo}</h2>
          <p className="challenge-date-real">
            {new Date(`${challenge.data_inicio}T00:00:00`).toLocaleDateString('pt-BR')} até{' '}
            {new Date(`${challenge.data_fim}T00:00:00`).toLocaleDateString('pt-BR')}
          </p>
          <div className="challenge-progress-real">
            <div><strong>{concluido ? '🎉 Concluído!' : `Dia ${dia} de ${total}`}</strong><span>{Math.round(pct)}% concluído</span></div>
            <div className="calorie-progress-track"><div className="calorie-progress-fill" style={{ width: `${pct}%` }} /></div>
          </div>
        </>
      ) : (
        <p className="empty-state">Nenhum desafio definido ainda.</p>
      )}

      {mode ? (
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
            <button type="button" className="link-button" onClick={() => setMode(null)}>
              Cancelar
            </button>
          </div>
        </form>
      ) : challenge ? (
        <div className="form-actions">
          <button className="link-button" onClick={startEdit}>
            Editar desafio atual
          </button>
          <button className="link-button" onClick={startNew}>
            Definir novo desafio
          </button>
        </div>
      ) : (
        <button className="link-button" onClick={startNew}>
          Definir desafio
        </button>
      )}
      </div>
    </div>
  )
}
