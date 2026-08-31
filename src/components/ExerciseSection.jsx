import { useEffect, useState, useCallback, useMemo } from 'react'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../context/AuthContext'
import PeriodSelector from './PeriodSelector'
import ExerciseChart from './ExerciseChart'
import ExerciseCalendar from './ExerciseCalendar'
import { fetchExerciseHistory, fetchKnownSubcategorias } from '../lib/exerciseHistory'
import { todayISO } from '../lib/dates'
import { PencilIcon, TrashIcon } from './icons'

const CATEGORIAS = [
  { key: 'cardio', label: 'Cardio' },
  { key: 'forca', label: 'Força' },
]

function categoriaLabel(key) {
  return CATEGORIAS.find((c) => c.key === key)?.label ?? key
}

export default function ExerciseSection({ onDataChange }) {
  const { user } = useAuth()
  const [entries, setEntries] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showEntries, setShowEntries] = useState(false)

  const [data, setData] = useState(todayISO())
  const [minutos, setMinutos] = useState('')
  const [kcalGasta, setKcalGasta] = useState('')
  const [descricao, setDescricao] = useState('')
  const [categoria, setCategoria] = useState('')
  const [subcategoria, setSubcategoria] = useState('')

  const [editingId, setEditingId] = useState(null)
  const [editData, setEditData] = useState('')
  const [editMinutos, setEditMinutos] = useState('')
  const [editKcalGasta, setEditKcalGasta] = useState('')
  const [editDescricao, setEditDescricao] = useState('')
  const [editCategoria, setEditCategoria] = useState('')
  const [editSubcategoria, setEditSubcategoria] = useState('')

  const [conhecidas, setConhecidas] = useState({ cardio: [], forca: [] })
  const [filtro, setFiltro] = useState(() => new Set())
  const [calendarRefresh, setCalendarRefresh] = useState(0)

  const [resumoPreset, setResumoPreset] = useState('semana')
  const [resumoDate, setResumoDate] = useState(todayISO())
  const [resumoStart, setResumoStart] = useState(todayISO())
  const [resumoEnd, setResumoEnd] = useState(todayISO())
  const [resumo, setResumo] = useState({ days: [], totalSessoes: 0, totalMinutos: 0, mediaMinutos: 0, mediaKcalGasta: 0 })

  const filtroArray = useMemo(() => [...filtro], [filtro])

  const loadConhecidas = useCallback(async () => {
    const result = await fetchKnownSubcategorias(supabase, user.id)
    setConhecidas(result)
  }, [user.id])

  useEffect(() => {
    loadConhecidas()
  }, [loadConhecidas])

  const loadResumo = useCallback(async () => {
    const result = await fetchExerciseHistory(
      supabase,
      user.id,
      resumoPreset,
      { date: resumoDate, start: resumoStart, end: resumoEnd },
      filtroArray
    )
    setResumo(result)
  }, [user.id, resumoPreset, resumoDate, resumoStart, resumoEnd, filtroArray])

  useEffect(() => {
    loadResumo()
  }, [loadResumo])

  const load = useCallback(async () => {
    setLoading(true)
    let query = supabase.from('exercise_logs').select('*').eq('user_id', user.id).order('data', { ascending: false }).limit(30)
    if (filtroArray.length > 0) query = query.in('subcategoria', filtroArray)
    const { data: rows } = await query
    setEntries(rows ?? [])
    setLoading(false)
  }, [user.id, filtroArray])

  useEffect(() => {
    load()
  }, [load])

  function toggleFiltro(nome) {
    setFiltro((prev) => {
      const next = new Set(prev)
      if (next.has(nome)) next.delete(nome)
      else next.add(nome)
      return next
    })
  }

  async function handleAdd(e) {
    e.preventDefault()
    setError('')
    const { error } = await supabase.from('exercise_logs').insert({
      user_id: user.id,
      minutos: Number(minutos),
      kcal_gasta: Number(kcalGasta),
      descricao,
      data,
      categoria,
      subcategoria: subcategoria.trim() || null,
    })
    if (error) {
      setError(error.message)
      return
    }
    setMinutos('')
    setKcalGasta('')
    setDescricao('')
    setSubcategoria('')
    setData(todayISO())
    load()
    loadResumo()
    loadConhecidas()
    setCalendarRefresh((k) => k + 1)
    onDataChange?.()
  }

  async function handleDelete(id) {
    await supabase.from('exercise_logs').delete().eq('id', id)
    load()
    loadResumo()
    setCalendarRefresh((k) => k + 1)
    onDataChange?.()
  }

  function startEdit(entry) {
    setEditingId(entry.id)
    setEditData(entry.data)
    setEditMinutos(String(entry.minutos))
    setEditKcalGasta(String(entry.kcal_gasta))
    setEditDescricao(entry.descricao || '')
    setEditCategoria(entry.categoria || '')
    setEditSubcategoria(entry.subcategoria || '')
  }

  async function handleSaveEdit(id) {
    setError('')
    const { error } = await supabase
      .from('exercise_logs')
      .update({
        data: editData,
        minutos: Number(editMinutos),
        kcal_gasta: Number(editKcalGasta),
        descricao: editDescricao,
        categoria: editCategoria || null,
        subcategoria: editSubcategoria.trim() || null,
      })
      .eq('id', id)
    if (error) {
      setError(error.message)
      return
    }
    setEditingId(null)
    load()
    loadResumo()
    loadConhecidas()
    setCalendarRefresh((k) => k + 1)
    onDataChange?.()
  }

  const temSubcategoriasConhecidas = conhecidas.cardio.length > 0 || conhecidas.forca.length > 0

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
        <div className="grid-2">
          <label>
            Categoria
            <select value={categoria} onChange={(e) => setCategoria(e.target.value)} required>
              <option value="" disabled>
                Selecione...
              </option>
              {CATEGORIAS.map((c) => (
                <option key={c.key} value={c.key}>
                  {c.label}
                </option>
              ))}
            </select>
          </label>
          <label>
            Subcategoria (opcional)
            <input
              list="subcategorias-conhecidas"
              value={subcategoria}
              onChange={(e) => setSubcategoria(e.target.value)}
              placeholder="Ex: Corrida, Peito..."
              disabled={!categoria}
            />
            <datalist id="subcategorias-conhecidas">
              {(conhecidas[categoria] ?? []).map((s) => (
                <option key={s} value={s} />
              ))}
            </datalist>
          </label>
        </div>
        <label>
          Descrição
          <input value={descricao} onChange={(e) => setDescricao(e.target.value)} placeholder="Ex: corrida no parque" />
        </label>
        <button type="submit">Adicionar exercício</button>
      </form>

      {temSubcategoriasConhecidas && (
        <div className="exercise-filter">
          <span className="exercise-filter-label">Filtrar por:</span>
          {CATEGORIAS.map(
            (c) =>
              conhecidas[c.key].length > 0 && (
                <div key={c.key} className="exercise-filter-group">
                  <span className="exercise-filter-group-label">{c.label}</span>
                  <div className="exercise-filter-chips">
                    {conhecidas[c.key].map((s) => (
                      <button
                        key={s}
                        type="button"
                        className={`exercise-filter-chip${filtro.has(s) ? ' active' : ''}`}
                        onClick={() => toggleFiltro(s)}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
              )
          )}
          {filtro.size > 0 && (
            <button type="button" className="link-button" onClick={() => setFiltro(new Set())}>
              Limpar filtro (ver todos)
            </button>
          )}
        </div>
      )}

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
                  <th>Categoria</th>
                  <th>Minutos</th>
                  <th>Kcal</th>
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
                            Categoria
                            <select value={editCategoria} onChange={(ev) => setEditCategoria(ev.target.value)}>
                              <option value="">Sem categoria</option>
                              {CATEGORIAS.map((c) => (
                                <option key={c.key} value={c.key}>
                                  {c.label}
                                </option>
                              ))}
                            </select>
                          </label>
                          <label>
                            Subcategoria
                            <input
                              list="subcategorias-conhecidas"
                              value={editSubcategoria}
                              onChange={(ev) => setEditSubcategoria(ev.target.value)}
                            />
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
                      <td data-label="Categoria">
                        {e.categoria && <span className="finance-tag">{categoriaLabel(e.categoria)}</span>}
                        {e.subcategoria && <span className="finance-tag">{e.subcategoria}</span>}
                      </td>
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

      <ExerciseCalendar subcategorias={filtroArray} refreshKey={calendarRefresh} />

      <PeriodSelector
        preset={resumoPreset}
        onPresetChange={setResumoPreset}
        date={resumoDate}
        onDateChange={setResumoDate}
        start={resumoStart}
        onStartChange={setResumoStart}
        end={resumoEnd}
        onEndChange={setResumoEnd}
      />
      <ExerciseChart days={resumo.days} />
      {resumo.totalSessoes > 0 && (
        <div className="chart-legend">
          <span>{resumo.totalSessoes} sessões</span>
          <span>Total de minutos: {resumo.totalMinutos} min</span>
          <span>Tempo médio: {resumo.mediaMinutos} min</span>
          <span>Kcal média: {resumo.mediaKcalGasta} kcal</span>
        </div>
      )}
    </>
  )
}
