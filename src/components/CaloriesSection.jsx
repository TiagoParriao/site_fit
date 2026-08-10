import { useEffect, useState, useCallback, useMemo } from 'react'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../context/AuthContext'
import CalorieProgressBar from './CalorieProgressBar'

function todayISO() {
  return new Date().toISOString().slice(0, 10)
}

function yesterdayOf(dataISO) {
  const d = new Date(`${dataISO}T00:00:00`)
  d.setDate(d.getDate() - 1)
  return d.toISOString().slice(0, 10)
}

function nowHHMM() {
  return new Date().toTimeString().slice(0, 5)
}

export default function CaloriesSection() {
  const { user, profile, updateProfile } = useAuth()
  const [data, setData] = useState(todayISO())
  const [entries, setEntries] = useState([])
  const [yesterdayEntries, setYesterdayEntries] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const [kcal, setKcal] = useState('')
  const [descricao, setDescricao] = useState('')
  const [hora, setHora] = useState(nowHHMM())

  const [editingMeta, setEditingMeta] = useState(false)
  const [novaMeta, setNovaMeta] = useState('')

  const [editingId, setEditingId] = useState(null)
  const [editKcal, setEditKcal] = useState('')
  const [editDescricao, setEditDescricao] = useState('')
  const [editHora, setEditHora] = useState('')

  const isToday = data === todayISO()

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

  const loadYesterday = useCallback(async () => {
    if (!isToday) {
      setYesterdayEntries([])
      return
    }
    const { data: rows } = await supabase
      .from('calorie_logs')
      .select('*')
      .eq('user_id', user.id)
      .eq('data', yesterdayOf(data))
      .order('hora', { ascending: true })
    setYesterdayEntries(rows ?? [])
  }, [user.id, data, isToday])

  useEffect(() => {
    load()
  }, [load])

  useEffect(() => {
    loadYesterday()
  }, [loadYesterday])

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

  function startEdit(entry) {
    setEditingId(entry.id)
    setEditKcal(String(entry.kcal))
    setEditDescricao(entry.descricao || '')
    setEditHora(entry.hora?.slice(0, 5) || nowHHMM())
  }

  async function handleSaveEdit(id) {
    setError('')
    const { error } = await supabase
      .from('calorie_logs')
      .update({ kcal: Number(editKcal), descricao: editDescricao, hora: editHora })
      .eq('id', id)
    if (error) {
      setError(error.message)
      return
    }
    setEditingId(null)
    load()
  }

  async function handleCopyFromYesterday(entry) {
    setError('')
    const { error } = await supabase.from('calorie_logs').insert({
      user_id: user.id,
      kcal: entry.kcal,
      descricao: entry.descricao,
      data,
      hora: nowHHMM(),
    })
    if (error) {
      setError(error.message)
      return
    }
    load()
  }

  const total = entries.reduce((sum, e) => sum + e.kcal, 0)
  const meta = profile?.meta_kcal_diaria ?? 2000
  const saldo = meta - total

  const saldoLabel = useMemo(() => {
    if (saldo >= 0) return `Faltam ${saldo} kcal para bater a meta`
    return `${Math.abs(saldo)} kcal acima da meta`
  }, [saldo])

  return (
    <div className="card">
      <h2>Calorias</h2>
      {error && <p className="error">{error}</p>}

      <label>
        Dia
        <input type="date" value={data} onChange={(e) => setData(e.target.value)} />
      </label>
      <CalorieProgressBar consumido={total} meta={meta} />
      <p className={`kcal-saldo${saldo < 0 ? ' negative' : ''}`}>{saldoLabel}</p>
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
        <button
          className="link-button"
          onClick={() => {
            setNovaMeta(String(meta))
            setEditingMeta(true)
          }}
        >
          Editar meta
        </button>
      )}

      <form className="stacked-form" onSubmit={handleAdd}>
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
        <button type="submit">Adicionar refeição</button>
      </form>

      {isToday && yesterdayEntries.length > 0 && (
        <div className="copy-yesterday">
          <span className="copy-yesterday-title">Copiar de ontem</span>
          <div className="copy-yesterday-list">
            {yesterdayEntries.map((e) => (
              <span key={e.id} className="copy-yesterday-item">
                {e.descricao || 'refeição'} ({e.kcal} kcal)
                <button type="button" onClick={() => handleCopyFromYesterday(e)}>
                  + hoje
                </button>
              </span>
            ))}
          </div>
        </div>
      )}

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
            {entries.map((e) =>
              editingId === e.id ? (
                <tr key={e.id}>
                  <td colSpan={4}>
                    <div className="inline-edit-row">
                      <label>
                        Hora
                        <input type="time" value={editHora} onChange={(ev) => setEditHora(ev.target.value)} required />
                      </label>
                      <label>
                        Descrição
                        <input value={editDescricao} onChange={(ev) => setEditDescricao(ev.target.value)} />
                      </label>
                      <label>
                        Kcal
                        <input type="number" value={editKcal} onChange={(ev) => setEditKcal(ev.target.value)} required />
                      </label>
                      <button type="button" onClick={() => handleSaveEdit(e.id)}>
                        Salvar
                      </button>
                      <button type="button" className="link-button" onClick={() => setEditingId(null)}>
                        Cancelar
                      </button>
                    </div>
                  </td>
                </tr>
              ) : (
                <tr key={e.id}>
                  <td data-label="Hora">{e.hora?.slice(0, 5)}</td>
                  <td data-label="Descrição">{e.descricao || '-'}</td>
                  <td data-label="Kcal">{e.kcal}</td>
                  <td>
                    <span className="row-actions">
                      <button className="icon-button" title="editar" onClick={() => startEdit(e)}>
                        ✏️
                      </button>
                      <button className="icon-button" title="remover" onClick={() => handleDelete(e.id)}>
                        🗑️
                      </button>
                    </span>
                  </td>
                </tr>
              )
            )}
          </tbody>
        </table>
      )}
    </div>
  )
}
