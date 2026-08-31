import { useEffect, useState, useCallback, useMemo } from 'react'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../context/AuthContext'
import CalorieProgressBar from './CalorieProgressBar'
import { MEAL_TYPES, mealTypeLabel, suggestMealType } from '../lib/mealTypes'
import { todayISO } from '../lib/dates'
import { fetchWeeklyMetabolicBalance } from '../lib/metabolicBalance'
import { PencilIcon, TrashIcon } from './icons'

function nowHHMM() {
  return new Date().toTimeString().slice(0, 5)
}

export default function CaloriesSection({ onDataChange }) {
  const { user, profile, updateProfile } = useAuth()
  const [data, setData] = useState(todayISO())
  const [entries, setEntries] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const [kcal, setKcal] = useState('')
  const [proteina, setProteina] = useState('')
  const [descricao, setDescricao] = useState('')
  const [hora, setHora] = useState(nowHHMM())
  const [tipoRefeicao, setTipoRefeicao] = useState(suggestMealType(nowHHMM()))

  const [editingMeta, setEditingMeta] = useState(false)
  const [novaMeta, setNovaMeta] = useState('')
  const [savingMeta, setSavingMeta] = useState(false)

  const [editingId, setEditingId] = useState(null)
  const [editKcal, setEditKcal] = useState('')
  const [editProteina, setEditProteina] = useState('')
  const [editDescricao, setEditDescricao] = useState('')
  const [editHora, setEditHora] = useState('')
  const [editTipoRefeicao, setEditTipoRefeicao] = useState('outro')

  const [showEntries, setShowEntries] = useState(false)

  const [metabolic, setMetabolic] = useState(null)
  const [editingSexo, setEditingSexo] = useState(false)
  const [novoSexo, setNovoSexo] = useState('M')
  const [savingSexo, setSavingSexo] = useState(false)

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

  useEffect(() => {
    load()
  }, [load])

  const loadMetabolic = useCallback(async () => {
    const result = await fetchWeeklyMetabolicBalance(supabase, user.id, profile)
    setMetabolic(result)
  }, [user.id, profile])

  useEffect(() => {
    loadMetabolic()
  }, [loadMetabolic])

  async function handleUpdateMeta(e) {
    e.preventDefault()
    if (savingMeta) return
    setError('')
    setSavingMeta(true)
    try {
      await updateProfile({ meta_kcal_diaria: Number(novaMeta) })
      setNovaMeta('')
      setEditingMeta(false)
    } catch (err) {
      setError(err.message)
    } finally {
      setSavingMeta(false)
    }
  }

  async function handleSetSexo(e) {
    e.preventDefault()
    if (savingSexo) return
    setError('')
    setSavingSexo(true)
    try {
      await updateProfile({ sexo: novoSexo })
      setEditingSexo(false)
    } catch (err) {
      setError(err.message)
    } finally {
      setSavingSexo(false)
    }
  }

  async function handleAdd(e) {
    e.preventDefault()
    setError('')
    const { error } = await supabase.from('calorie_logs').insert({
      user_id: user.id,
      kcal: Number(kcal),
      proteina_g: proteina === '' ? null : Number(proteina),
      descricao,
      data,
      hora,
      tipo_refeicao: tipoRefeicao,
    })
    if (error) {
      setError(error.message)
      return
    }
    setKcal('')
    setProteina('')
    setDescricao('')
    setHora(nowHHMM())
    setTipoRefeicao(suggestMealType(nowHHMM()))
    load()
    loadMetabolic()
    onDataChange?.()
  }

  async function handleDelete(id) {
    await supabase.from('calorie_logs').delete().eq('id', id)
    load()
    loadMetabolic()
    onDataChange?.()
  }

  function startEdit(entry) {
    setEditingId(entry.id)
    setEditKcal(String(entry.kcal))
    setEditProteina(entry.proteina_g == null ? '' : String(entry.proteina_g))
    setEditDescricao(entry.descricao || '')
    setEditHora(entry.hora?.slice(0, 5) || nowHHMM())
    setEditTipoRefeicao(entry.tipo_refeicao || 'outro')
  }

  async function handleSaveEdit(id) {
    setError('')
    const { error } = await supabase
      .from('calorie_logs')
      .update({
        kcal: Number(editKcal),
        proteina_g: editProteina === '' ? null : Number(editProteina),
        descricao: editDescricao,
        hora: editHora,
        tipo_refeicao: editTipoRefeicao,
      })
      .eq('id', id)
    if (error) {
      setError(error.message)
      return
    }
    setEditingId(null)
    load()
    loadMetabolic()
    onDataChange?.()
  }

  const total = entries.reduce((sum, e) => sum + e.kcal, 0)
  const meta = profile?.meta_kcal_diaria ?? 2000
  const saldo = meta - total

  const saldoLabel = useMemo(() => {
    if (saldo >= 0) return `Faltam ${saldo} kcal para bater a meta`
    return `${Math.abs(saldo)} kcal acima da meta`
  }, [saldo])

  return (
    <>
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
          <button type="submit" disabled={savingMeta}>{savingMeta ? 'Salvando...' : 'Salvar'}</button>
          <button type="button" className="link-button" onClick={() => setEditingMeta(false)} disabled={savingMeta}>
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

      {!metabolic && (
        <div className="metabolic-balance">
          <p className="empty-state">
            Defina seu sexo pra calcular sua taxa metabólica basal — o saldo baseado nela aparece lá em cima, no
            histórico do grupo, em "Ver saldo por TMB de cada membro".
          </p>
          {editingSexo ? (
            <form onSubmit={handleSetSexo} className="form-actions">
              <label>
                Sexo
                <select value={novoSexo} onChange={(e) => setNovoSexo(e.target.value)}>
                  <option value="M">Masculino</option>
                  <option value="F">Feminino</option>
                </select>
              </label>
              <button type="submit" disabled={savingSexo}>{savingSexo ? 'Salvando...' : 'Salvar'}</button>
              <button type="button" className="link-button" onClick={() => setEditingSexo(false)} disabled={savingSexo}>
                Cancelar
              </button>
            </form>
          ) : (
            <button className="link-button" onClick={() => setEditingSexo(true)}>
              Definir sexo
            </button>
          )}
        </div>
      )}

      <form className="stacked-form" onSubmit={handleAdd}>
        <div className="grid-3">
          <label>
            Kcal
            <input type="number" value={kcal} onChange={(e) => setKcal(e.target.value)} required />
          </label>
          <label>
            Proteína (g, opcional)
            <input type="number" step="0.1" value={proteina} onChange={(e) => setProteina(e.target.value)} />
          </label>
          <label>
            Hora
            <input type="time" value={hora} onChange={(e) => setHora(e.target.value)} required />
          </label>
        </div>
        <label>
          Tipo de refeição
          <select value={tipoRefeicao} onChange={(e) => setTipoRefeicao(e.target.value)}>
            {MEAL_TYPES.map((t) => (
              <option key={t.key} value={t.key}>
                {t.label}
              </option>
            ))}
          </select>
        </label>
        <label>
          Descrição (opcional)
          <input value={descricao} onChange={(e) => setDescricao(e.target.value)} placeholder="Ex: com batata doce" />
        </label>
        <button type="submit">Adicionar refeição</button>
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
                  <th>Hora</th>
                  <th>Refeição</th>
                  <th>Kcal</th>
                  <th>Proteína</th>
                  <th>Descrição</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {entries.map((e) =>
                  editingId === e.id ? (
                    <tr key={e.id}>
                      <td colSpan={6}>
                        <div className="inline-edit-row">
                          <label>
                            Hora
                            <input
                              type="time"
                              value={editHora}
                              onChange={(ev) => setEditHora(ev.target.value)}
                              required
                            />
                          </label>
                          <label>
                            Refeição
                            <select value={editTipoRefeicao} onChange={(ev) => setEditTipoRefeicao(ev.target.value)}>
                              {MEAL_TYPES.map((t) => (
                                <option key={t.key} value={t.key}>
                                  {t.label}
                                </option>
                              ))}
                            </select>
                          </label>
                          <label>
                            Kcal
                            <input
                              type="number"
                              value={editKcal}
                              onChange={(ev) => setEditKcal(ev.target.value)}
                              required
                            />
                          </label>
                          <label>
                            Proteína (g)
                            <input
                              type="number"
                              step="0.1"
                              value={editProteina}
                              onChange={(ev) => setEditProteina(ev.target.value)}
                            />
                          </label>
                          <label>
                            Descrição (opcional)
                            <input value={editDescricao} onChange={(ev) => setEditDescricao(ev.target.value)} />
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
                      <td data-label="Refeição">{mealTypeLabel(e.tipo_refeicao)}</td>
                      <td data-label="Kcal">{e.kcal}</td>
                      <td data-label="Proteína">{e.proteina_g != null ? `${e.proteina_g}g` : '-'}</td>
                      <td data-label="Descrição">{e.descricao || '-'}</td>
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
