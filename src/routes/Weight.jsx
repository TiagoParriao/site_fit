import { useEffect, useState, useCallback, useMemo } from 'react'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../context/AuthContext'
import WeightHistoryChart from '../components/WeightHistoryChart'
import MeasurementsSection from '../components/MeasurementsSection'
import { todayISO } from '../lib/dates'
import { PencilIcon, TrashIcon } from '../components/icons'

export default function Weight() {
  const { user } = useAuth()
  const [logs, setLogs] = useState([])
  const [goals, setGoals] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const [novoPeso, setNovoPeso] = useState('')
  const [novaData, setNovaData] = useState(todayISO())
  const [metaPeso, setMetaPeso] = useState('')
  const [metaData, setMetaData] = useState('')

  const [editingId, setEditingId] = useState(null)
  const [editPeso, setEditPeso] = useState('')
  const [editData, setEditData] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    const [logsRes, goalsRes] = await Promise.all([
      supabase.from('weight_logs').select('*').eq('user_id', user.id).order('data', { ascending: false }),
      supabase.from('weight_goals').select('*').eq('user_id', user.id).order('created_at', { ascending: true }),
    ])
    if (logsRes.data) setLogs(logsRes.data)
    if (goalsRes.data) setGoals(goalsRes.data)
    setLoading(false)
  }, [user.id])

  useEffect(() => {
    load()
  }, [load])

  async function handleAddWeight(e) {
    e.preventDefault()
    setError('')
    const { error } = await supabase
      .from('weight_logs')
      .insert({ user_id: user.id, peso_kg: Number(novoPeso), data: novaData })
    if (error) {
      setError(error.message)
      return
    }
    setNovoPeso('')
    load()
  }

  async function handleSetGoal(e) {
    e.preventDefault()
    setError('')
    const { error } = await supabase
      .from('weight_goals')
      .insert({ user_id: user.id, peso_meta_kg: Number(metaPeso), data_alvo: metaData })
    if (error) {
      setError(error.message)
      return
    }
    setMetaPeso('')
    setMetaData('')
    load()
  }

  async function handleDelete(id) {
    await supabase.from('weight_logs').delete().eq('id', id)
    load()
  }

  function startEdit(log) {
    setEditingId(log.id)
    setEditPeso(String(log.peso_kg))
    setEditData(log.data)
  }

  async function handleSaveEdit(id) {
    setError('')
    const { error } = await supabase
      .from('weight_logs')
      .update({ peso_kg: Number(editPeso), data: editData })
      .eq('id', id)
    if (error) {
      setError(error.message)
      return
    }
    setEditingId(null)
    load()
  }

  const diff = useMemo(() => {
    if (logs.length < 2) return null
    const sorted = [...logs].sort((a, b) => new Date(a.data) - new Date(b.data))
    const primeiro = sorted[0]
    const ultimo = sorted[sorted.length - 1]
    const delta = ultimo.peso_kg - primeiro.peso_kg
    return { delta, desde: primeiro.data }
  }, [logs])

  // Meta em uso é sempre a mais recente; numeramos pela ordem de criação
  // (Meta 01, Meta 02...) e checamos se o peso já cruzou ela — pra saber
  // se o pedido é de emagrecer ou engordar, comparamos com o peso mais
  // próximo registrado até a data em que a meta foi definida.
  const goalStatus = useMemo(() => {
    if (goals.length === 0 || logs.length === 0) return null
    const goal = goals[goals.length - 1]
    const sortedAsc = [...logs].sort((a, b) => new Date(a.data) - new Date(b.data))
    const pesoAtual = sortedAsc[sortedAsc.length - 1].peso_kg
    const goalDateISO = goal.created_at.slice(0, 10)
    const logsAte = sortedAsc.filter((l) => l.data <= goalDateISO)
    const pesoBase = logsAte.length > 0 ? logsAte[logsAte.length - 1].peso_kg : sortedAsc[0].peso_kg
    const querBaixar = goal.peso_meta_kg <= pesoBase
    const atingida = querBaixar ? pesoAtual <= goal.peso_meta_kg : pesoAtual >= goal.peso_meta_kg
    const restante = Math.abs(pesoAtual - goal.peso_meta_kg)
    return { numero: goals.length, goal, atingida, restante }
  }, [goals, logs])

  if (loading) return <div className="page-loading">Carregando...</div>

  return (
    <div className="page">
      <header className="route-header">
        <span>Evolução</span>
        <h1>Peso e medidas</h1>
        <p>Pequenas mudanças contam uma grande história.</p>
      </header>
      {error && <p className="error">{error}</p>}

      <div className="weight-hero-grid-real">
        <div className="card weight-overview-card">
          <span className="section-kicker">Peso atual</span>
          <div className="weight-current-real"><strong>{logs[0]?.peso_kg ?? '—'}</strong><span>kg</span></div>
          {diff && (
            <p className={`weight-diff${diff.delta > 0 ? ' up' : ''}`}>
              {diff.delta > 0 ? '+' : ''}{diff.delta.toFixed(1)}kg desde{' '}
              {new Date(`${diff.desde}T00:00:00`).toLocaleDateString('pt-BR')}
            </p>
          )}
          {goalStatus && (
            <p className="weight-goal-real">
              Meta {String(goalStatus.numero).padStart(2, '0')}: <strong>{goalStatus.goal.peso_meta_kg}kg</strong> até{' '}
              {new Date(`${goalStatus.goal.data_alvo}T00:00:00`).toLocaleDateString('pt-BR')}
              {goalStatus.atingida ? (
                <span className="goal-achieved-badge"> · batida ✓</span>
              ) : (
                <> · faltam {goalStatus.restante.toFixed(1)}kg</>
              )}
            </p>
          )}
        </div>
      <div className="card weight-chart-card-real">
        <div className="card-heading-real"><div><span className="section-kicker">Histórico</span><h2>Evolução do peso</h2><p>Acompanhe sua tendência ao longo do tempo.</p></div></div>
        {diff && (
          <span className={`weight-diff weight-diff-chart${diff.delta > 0 ? ' up' : ''}`}>{diff.delta > 0 ? '+' : ''}{diff.delta.toFixed(1)} kg</span>
        )}
        <WeightHistoryChart
          logs={logs}
          goalKg={goalStatus?.goal.peso_meta_kg}
          goalLabel={
            goalStatus
              ? `Meta ${String(goalStatus.numero).padStart(2, '0')} · ${goalStatus.goal.peso_meta_kg}kg${goalStatus.atingida ? '' : ` (faltam ${goalStatus.restante.toFixed(1)}kg)`}`
              : undefined
          }
          goalAchieved={goalStatus?.atingida}
        />
      </div>
      </div>

      <div className="grid-2 weight-forms-grid">
        <form className="card" onSubmit={handleAddWeight}>
          <h2>Atualizar peso</h2>
          <label>
            Peso (kg)
            <input type="number" step="0.1" value={novoPeso} onChange={(e) => setNovoPeso(e.target.value)} required />
          </label>
          <label>
            Data
            <input type="date" value={novaData} onChange={(e) => setNovaData(e.target.value)} required />
          </label>
          <button type="submit">Registrar</button>
        </form>

        <form className="card" onSubmit={handleSetGoal}>
          <h2>{goalStatus?.atingida ? 'Próxima meta' : 'Meta de peso'}</h2>
          {goalStatus && (
            <p className="info">
              Meta {String(goalStatus.numero).padStart(2, '0')} atual: {goalStatus.goal.peso_meta_kg}kg até{' '}
              {new Date(`${goalStatus.goal.data_alvo}T00:00:00`).toLocaleDateString('pt-BR')}
              {goalStatus.atingida ? ' — batida! 🎉' : ` — faltam ${goalStatus.restante.toFixed(1)}kg`}
            </p>
          )}
          <label>
            Novo valor (kg)
            <input type="number" step="0.1" value={metaPeso} onChange={(e) => setMetaPeso(e.target.value)} required />
          </label>
          <label>
            Data alvo
            <input type="date" value={metaData} onChange={(e) => setMetaData(e.target.value)} required />
          </label>
          <button type="submit">{goalStatus?.atingida ? 'Definir próxima meta' : 'Definir meta'}</button>
        </form>
      </div>

      <div className="card">
        <h2>Registros</h2>
        <table className="table">
          <thead>
            <tr>
              <th>Data</th>
              <th>Peso</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {logs.map((log) =>
              editingId === log.id ? (
                <tr key={log.id}>
                  <td colSpan={3}>
                    <div className="inline-edit-row">
                      <label>
                        Data
                        <input type="date" value={editData} onChange={(e) => setEditData(e.target.value)} required />
                      </label>
                      <label>
                        Peso (kg)
                        <input
                          type="number"
                          step="0.1"
                          value={editPeso}
                          onChange={(e) => setEditPeso(e.target.value)}
                          required
                        />
                      </label>
                      <button type="button" onClick={() => handleSaveEdit(log.id)}>
                        Salvar
                      </button>
                      <button type="button" className="link-button" onClick={() => setEditingId(null)}>
                        Cancelar
                      </button>
                    </div>
                  </td>
                </tr>
              ) : (
                <tr key={log.id}>
                  <td data-label="Data">{new Date(`${log.data}T00:00:00`).toLocaleDateString('pt-BR')}</td>
                  <td data-label="Peso">{log.peso_kg}kg</td>
                  <td>
                    <span className="row-actions">
                      <button className="icon-button" title="editar" onClick={() => startEdit(log)}>
                        <PencilIcon />
                      </button>
                      <button className="icon-button" title="remover" onClick={() => handleDelete(log.id)}>
                        <TrashIcon />
                      </button>
                    </span>
                  </td>
                </tr>
              )
            )}
          </tbody>
        </table>
      </div>

      <MeasurementsSection />
    </div>
  )
}
