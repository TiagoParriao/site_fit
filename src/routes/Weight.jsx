import { useEffect, useState, useCallback } from 'react'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../context/AuthContext'
import WeightHistoryChart from '../components/WeightHistoryChart'

function todayISO() {
  return new Date().toISOString().slice(0, 10)
}

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

  if (loading) return <div className="page-loading">Carregando...</div>

  return (
    <div className="page">
      <h1>Peso</h1>
      {error && <p className="error">{error}</p>}

      <div className="card">
        <h2>Histórico</h2>
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
            </tr>
          </thead>
          <tbody>
            {logs.map((log) => (
              <tr key={log.id}>
                <td>{new Date(log.data).toLocaleDateString('pt-BR')}</td>
                <td>{log.peso_kg}kg</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
