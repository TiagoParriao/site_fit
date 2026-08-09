import { useEffect, useState, useCallback } from 'react'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../context/AuthContext'
import CalorieProgressBar from '../components/CalorieProgressBar'
import { fetchOverBudgetHistory } from '../lib/weeklyProgress'

function todayISO() {
  return new Date().toISOString().slice(0, 10)
}

function nowHHMM() {
  return new Date().toTimeString().slice(0, 5)
}

export default function Calories() {
  const { user, profile, updateProfile } = useAuth()
  const [data, setData] = useState(todayISO())
  const [entries, setEntries] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const [kcal, setKcal] = useState('')
  const [descricao, setDescricao] = useState('')
  const [hora, setHora] = useState(nowHHMM())

  const [editingMeta, setEditingMeta] = useState(false)
  const [novaMeta, setNovaMeta] = useState('')
  const [overBudget, setOverBudget] = useState(null)

  const load = useCallback(async () => {
    setLoading(true)
    const { data: rows } = await supabase
      .from('calorie_logs')
      .select('*')
      .eq('user_id', user.id)
      .eq('data', data)
      .order('hora', { ascending: true })
    setEntries(rows ?? [])
    setLoading(false)
  }, [user.id, data])

  const loadOverBudget = useCallback(async () => {
    const result = await fetchOverBudgetHistory(supabase, user.id, profile?.meta_kcal_diaria ?? 2000)
    setOverBudget(result)
  }, [user.id, profile?.meta_kcal_diaria])

  useEffect(() => {
    load()
  }, [load])

  useEffect(() => {
    loadOverBudget()
  }, [loadOverBudget])

  async function handleUpdateMeta(e) {
    e.preventDefault()
    setError('')
    try {
      await updateProfile({ meta_kcal_diaria: Number(novaMeta) })
      setNovaMeta('')
      setEditingMeta(false)
    } catch (err) {
      setError(err.message)
    }
  }

  async function handleAdd(e) {
    e.preventDefault()
    setError('')
    const { error } = await supabase.from('calorie_logs').insert({
      user_id: user.id,
      kcal: Number(kcal),
      descricao,
      data,
      hora,
    })
    if (error) {
      setError(error.message)
      return
    }
    setKcal('')
    setDescricao('')
    setHora(nowHHMM())
    load()
  }

  async function handleDelete(id) {
    await supabase.from('calorie_logs').delete().eq('id', id)
    load()
  }

  const total = entries.reduce((sum, e) => sum + e.kcal, 0)

  return (
    <div className="page">
      <h1>Calorias</h1>
      {error && <p className="error">{error}</p>}

      <div className="card">
        <label>
          Dia
          <input type="date" value={data} onChange={(e) => setData(e.target.value)} />
        </label>
        <CalorieProgressBar consumido={total} meta={profile?.meta_kcal_diaria ?? 2000} />
        {editingMeta ? (
          <form onSubmit={handleUpdateMeta} className="form-actions">
            <label>
              Nova meta diária (kcal)
              <input type="number" value={novaMeta} onChange={(e) => setNovaMeta(e.target.value)} required />
            </label>
            <button type="submit">Salvar</button>
            <button type="button" className="link-button" onClick={() => setEditingMeta(false)}>
              Cancelar
            </button>
          </form>
        ) : (
          <button className="link-button" onClick={() => { setNovaMeta(String(profile?.meta_kcal_diaria ?? 2000)); setEditingMeta(true) }}>
            Editar meta
          </button>
        )}
      </div>

      {overBudget && overBudget.totalDias > 0 && (
        <div className="card">
          <h2>Histórico de teto</h2>
          <p className="info">
            Estourou em {overBudget.diasEstourados} de {overBudget.totalDias} dias registrados
          </p>
          {overBudget.ultimosEstourados.length > 0 && (
            <ul className="overbudget-list">
              {overBudget.ultimosEstourados.map(({ data: dia, total }) => (
                <li key={dia} className="overbudget-item">
                  <span>{new Date(`${dia}T00:00:00`).toLocaleDateString('pt-BR')}</span>
                  <span>{total} kcal</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      <form className="card" onSubmit={handleAdd}>
        <h2>Adicionar refeição</h2>
        <div className="grid-3">
          <label>
            Kcal
            <input type="number" value={kcal} onChange={(e) => setKcal(e.target.value)} required />
          </label>
          <label>
            Descrição
            <input value={descricao} onChange={(e) => setDescricao(e.target.value)} placeholder="Ex: almoço" />
          </label>
          <label>
            Hora
            <input type="time" value={hora} onChange={(e) => setHora(e.target.value)} required />
          </label>
        </div>
        <button type="submit">Adicionar</button>
      </form>

      <div className="card">
        <h2>Refeições do dia</h2>
        {loading ? (
          <p>Carregando...</p>
        ) : entries.length === 0 ? (
          <p className="empty-state">Nada registrado ainda.</p>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>Hora</th>
                <th>Descrição</th>
                <th>Kcal</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {entries.map((e) => (
                <tr key={e.id}>
                  <td data-label="Hora">{e.hora?.slice(0, 5)}</td>
                  <td data-label="Descrição">{e.descricao || '-'}</td>
                  <td data-label="Kcal">{e.kcal}</td>
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
    </div>
  )
}
