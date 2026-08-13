import { useEffect, useState, useCallback } from 'react'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../context/AuthContext'
import { todayISO } from '../lib/dates'
import { PencilIcon, TrashIcon } from './icons'

export default function ExerciseSection() {
  const { user } = useAuth()
  const [entries, setEntries] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showEntries, setShowEntries] = useState(false)

  const [data, setData] = useState(todayISO())
  const [minutos, setMinutos] = useState('')
  const [kcalGasta, setKcalGasta] = useState('')
  const [descricao, setDescricao] = useState('')

  const [editingId, setEditingId] = useState(null)
  const [editData, setEditData] = useState('')
  const [editMinutos, setEditMinutos] = useState('')
  const [editKcalGasta, setEditKcalGasta] = useState('')
  const [editDescricao, setEditDescricao] = useState('')

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

  useEffect(() => {
    load()
  }, [load])

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
  }

  async function handleDelete(id) {
    await supabase.from('exercise_logs').delete().eq('id', id)
    load()
  }

  function startEdit(entry) {
    setEditingId(entry.id)
    setEditData(entry.data)
    setEditMinutos(String(entry.minutos))
    setEditKcalGasta(String(entry.kcal_gasta))
    setEditDescricao(entry.descricao || '')
  }

  async function handleSaveEdit(id) {
    setError('')
    const { error } = await supabase
      .from('exercise_logs')
      .update({ data: editData, minutos: Number(editMinutos), kcal_gasta: Number(editKcalGasta), descricao: editDescricao })
      .eq('id', id)
    if (error) {
      setError(error.message)
      return
    }
    setEditingId(null)
    load()
  }

  return (
    <>
      {error && <p className="error">{error}</p>}

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
        <>
          <button type="button" className="link-button" onClick={() => setShowEntries((v) => !v)}>
            {showEntries ? 'Ocultar lançamentos' : `Ver lançamentos (${entries.length})`}
          </button>
          {showEntries && (
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
                {entries.map((e) =>
                  editingId === e.id ? (
                    <tr key={e.id}>
                      <td colSpan={5}>
                        <div className="inline-edit-row">
                          <label>
                            Dia
                            <input
                              type="date"
                              value={editData}
                              onChange={(ev) => setEditData(ev.target.value)}
                              required
                            />
                          </label>
                          <label>
                            Descrição
                            <input value={editDescricao} onChange={(ev) => setEditDescricao(ev.target.value)} />
                          </label>
                          <label>
                            Minutos
                            <input
                              type="number"
                              value={editMinutos}
                              onChange={(ev) => setEditMinutos(ev.target.value)}
                              required
                            />
                          </label>
                          <label>
                            Kcal
                            <input
                              type="number"
                              value={editKcalGasta}
                              onChange={(ev) => setEditKcalGasta(ev.target.value)}
                              required
                            />
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
                      <td data-label="Dia">{e.data}</td>
                      <td data-label="Descrição">{e.descricao || '-'}</td>
                      <td data-label="Minutos">{e.minutos}</td>
                      <td data-label="Kcal">{e.kcal_gasta}</td>
                      <td>
                        <span className="row-actions">
                          <button className="icon-button" title="editar" onClick={() => startEdit(e)}>
                            <PencilIcon />
                          </button>
                          <button className="icon-button" title="remover" onClick={() => handleDelete(e.id)}>
                            <TrashIcon />
                          </button>
                        </span>
                      </td>
                    </tr>
                  )
                )}
              </tbody>
            </table>
          )}
        </>
      )}
    </>
  )
}
