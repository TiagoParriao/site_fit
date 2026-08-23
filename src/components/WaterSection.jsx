import { useEffect, useState, useCallback } from 'react'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../context/AuthContext'
import WaterProgressBar from './WaterProgressBar'
import { todayISO } from '../lib/dates'
import { PencilIcon, TrashIcon } from './icons'

const WATER_PRESETS = [
  { ml: 200, label: 'Copo · 200ml' },
  { ml: 300, label: 'Copo grande · 300ml' },
  { ml: 500, label: 'Garrafa · 500ml' },
  { ml: 1000, label: '1 litro' },
]

export default function WaterSection({ onDataChange }) {
  const { user, profile, updateProfile } = useAuth()
  const [data, setData] = useState(todayISO())
  const [entries, setEntries] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const [ml, setMl] = useState('')

  const [editingMeta, setEditingMeta] = useState(false)
  const [novaMetaLitros, setNovaMetaLitros] = useState('')

  const [editingId, setEditingId] = useState(null)
  const [editMl, setEditMl] = useState('')

  const [showEntries, setShowEntries] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    const { data: rows } = await supabase
      .from('water_logs')
      .select('*')
      .eq('user_id', user.id)
      .eq('data', data)
      .order('created_at', { ascending: true })
    setEntries(rows ?? [])
    setLoading(false)
  }, [user.id, data])

  useEffect(() => {
    load()
  }, [load])

  async function handleUpdateMeta(e) {
    e.preventDefault()
    setError('')
    try {
      await updateProfile({ meta_agua_ml: Math.round(Number(novaMetaLitros) * 1000) })
      setNovaMetaLitros('')
      setEditingMeta(false)
    } catch (err) {
      setError(err.message)
    }
  }

  async function addWater(amountMl) {
    setError('')
    const { error } = await supabase.from('water_logs').insert({ user_id: user.id, ml: amountMl, data })
    if (error) {
      setError(error.message)
      return
    }
    load()
    onDataChange?.()
  }

  async function handleAdd(e) {
    e.preventDefault()
    if (!ml) return
    await addWater(Number(ml))
    setMl('')
  }

  async function handleDelete(id) {
    await supabase.from('water_logs').delete().eq('id', id)
    load()
    onDataChange?.()
  }

  function startEdit(entry) {
    setEditingId(entry.id)
    setEditMl(String(entry.ml))
  }

  async function handleSaveEdit(id) {
    setError('')
    const { error } = await supabase.from('water_logs').update({ ml: Number(editMl) }).eq('id', id)
    if (error) {
      setError(error.message)
      return
    }
    setEditingId(null)
    load()
    onDataChange?.()
  }

  const totalMl = entries.reduce((sum, e) => sum + e.ml, 0)
  const metaMl = profile?.meta_agua_ml ?? 2000

  return (
    <>
      {error && <p className="error">{error}</p>}

      <label>
        Dia
        <input type="date" value={data} onChange={(e) => setData(e.target.value)} />
      </label>
      <WaterProgressBar consumidoMl={totalMl} metaMl={metaMl} />
      {editingMeta ? (
        <form onSubmit={handleUpdateMeta} className="form-actions">
          <label>
            Nova meta diária (litros)
            <input
              type="number"
              step="0.1"
              value={novaMetaLitros}
              onChange={(e) => setNovaMetaLitros(e.target.value)}
              required
            />
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
            setNovaMetaLitros(String(metaMl / 1000))
            setEditingMeta(true)
          }}
        >
          Editar meta
        </button>
      )}

      <div className="water-quick-add">
        {WATER_PRESETS.map((p) => (
          <button key={p.ml} type="button" onClick={() => addWater(p.ml)}>
            {p.label}
          </button>
        ))}
      </div>

      <form className="stacked-form" onSubmit={handleAdd}>
        <label>
          Quantidade (ml)
          <input type="number" value={ml} onChange={(e) => setMl(e.target.value)} placeholder="Ex: 350" required />
        </label>
        <button type="submit">Adicionar</button>
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
                  <th>Quantidade</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {entries.map((e) =>
                  editingId === e.id ? (
                    <tr key={e.id}>
                      <td colSpan={2}>
                        <div className="inline-edit-row">
                          <label>
                            ml
                            <input
                              type="number"
                              value={editMl}
                              onChange={(ev) => setEditMl(ev.target.value)}
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
                      <td data-label="Quantidade">{e.ml} ml</td>
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
