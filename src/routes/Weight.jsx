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
  const [goal, setGoal] = useState(null)
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
    const [logsRes, goalRes] = await Promise.all([
      supabase.from('weight_logs').select('*').eq('user_id', user.id).order('data', { ascending: false }),
      supabase
        .from('weight_goals')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle(),
    ])
    if (logsRes.data) setLogs(logsRes.data)
    if (goalRes.data) setGoal(goalRes.data)
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

  if (loading) return <div className="page-loading">Carregando...</div>

  return (
    <div className="page">
      <h1>Peso</h1>
      {error && <p className="error">{error}</p>}

      <div className="card">
        <h2>Histórico</h2>
        {diff && (
          <p className={`weight-diff${diff.delta > 0 ? ' up' : ''}`}>
            {diff.delta > 0 ? '+' : ''}
            {diff.delta.toFixed(1)}kg desde {new Date(`${diff.desde}T00:00:00`).toLocaleDateString('pt-BR')}
          </p>
        )}
        <WeightHistoryChart logs={logs} goalKg={goal?.peso_meta_kg} />
      </div>

      <div className="grid-2">
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
          <h2>Meta de peso</h2>
          {goal && (
            <p className="info">
              Meta atual: {goal.peso_meta_kg}kg até {new Date(goal.data_alvo).toLocaleDateString('pt-BR')}
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
          <button type="submit">Definir meta</button>
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
                  <td data-label="Data">{new Date(log.data).toLocaleDateString('pt-BR')}</td>
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
