import { useEffect, useState, useCallback } from 'react'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../context/AuthContext'
import PeriodSelector from './PeriodSelector'
import ExerciseChart from './ExerciseChart'
import { fetchExerciseHistory } from '../lib/exerciseHistory'

function todayISO() {
  return new Date().toISOString().slice(0, 10)
}

export default function ExerciseSection() {
  const { user } = useAuth()
  const [entries, setEntries] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const [data, setData] = useState(todayISO())
  const [minutos, setMinutos] = useState('')
  const [kcalGasta, setKcalGasta] = useState('')
  const [descricao, setDescricao] = useState('')

  const [preset, setPreset] = useState('semana')
  const [chartDate, setChartDate] = useState(todayISO())
  const [chartStart, setChartStart] = useState(todayISO())
  const [chartEnd, setChartEnd] = useState(todayISO())
  const [chartData, setChartData] = useState({ days: [] })

  const load = useCallback(async () => {
    setLoading(true)
    const { data: rows } = await supabase
      .from('exercise_logs')
      .select('*')
      .eq('user_id', user.id)
      .order('data', { ascending: false })
      .limit(30)
    setEntries(rows ?? [])
    setLoading(false)
  }, [user.id])

  const loadChart = useCallback(async () => {
    const result = await fetchExerciseHistory(supabase, user.id, preset, {
      date: chartDate,
      start: chartStart,
      end: chartEnd,
    })
    setChartData(result)
  }, [user.id, preset, chartDate, chartStart, chartEnd])

  useEffect(() => {
    load()
  }, [load])

  useEffect(() => {
    loadChart()
  }, [loadChart])

  async function handleAdd(e) {
    e.preventDefault()
    setError('')
    const { error } = await supabase.from('exercise_logs').insert({
      user_id: user.id,
      minutos: Number(minutos),
      kcal_gasta: Number(kcalGasta),
      descricao,
      data,
    })
    if (error) {
      setError(error.message)
      return
    }
    setMinutos('')
    setKcalGasta('')
    setDescricao('')
    setData(todayISO())
    load()
    loadChart()
  }

  async function handleDelete(id) {
    await supabase.from('exercise_logs').delete().eq('id', id)
    load()
    loadChart()
  }

  return (
    <div className="card">
      <h2>Exercício</h2>
      {error && <p className="error">{error}</p>}

      <PeriodSelector
        preset={preset}
        onPresetChange={setPreset}
        date={chartDate}
        onDateChange={setChartDate}
        start={chartStart}
        onStartChange={setChartStart}
        end={chartEnd}
        onEndChange={setChartEnd}
      />
      <ExerciseChart days={chartData.days} />

      <form className="stacked-form" onSubmit={handleAdd}>
        <div className="grid-3">
          <label>
            Dia
            <input type="date" value={data} onChange={(e) => setData(e.target.value)} required />
          </label>
          <label>
            Minutos
            <input type="number" value={minutos} onChange={(e) => setMinutos(e.target.value)} required />
          </label>
          <label>
            Kcal gastas
            <input type="number" value={kcalGasta} onChange={(e) => setKcalGasta(e.target.value)} required />
          </label>
        </div>
        <label>
          Descrição
          <input value={descricao} onChange={(e) => setDescricao(e.target.value)} placeholder="Ex: corrida, musculação..." />
        </label>
        <button type="submit">Adicionar exercício</button>
      </form>

      {loading ? (
        <p>Carregando...</p>
      ) : entries.length === 0 ? (
        <p className="empty-state">Nada registrado ainda.</p>
      ) : (
        <table className="table">
          <thead>
            <tr>
              <th>Dia</th>
              <th>Descrição</th>
              <th>Minutos</th>
              <th>Kcal</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {entries.map((e) => (
              <tr key={e.id}>
                <td data-label="Dia">{e.data}</td>
                <td data-label="Descrição">{e.descricao || '-'}</td>
                <td data-label="Minutos">{e.minutos}</td>
                <td data-label="Kcal">{e.kcal_gasta}</td>
                <td>
                  <button className="link-button" onClick={() => handleDelete(e.id)}>
                    remover
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  )
}
