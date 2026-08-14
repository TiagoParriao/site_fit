import { useEffect, useState, useCallback, useMemo } from 'react'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../context/AuthContext'
import CalorieProgressBar from './CalorieProgressBar'
import PeriodSelector from './PeriodSelector'
import { MEAL_TYPES, mealTypeLabel, suggestMealType } from '../lib/mealTypes'
import { fetchMealTypeAverages } from '../lib/mealAverages'
import { todayISO, addDaysISO } from '../lib/dates'
import { shortDateLabel } from '../lib/chartAxis'
import { fetchWeeklyMetabolicBalance } from '../lib/metabolicBalance'
import { PencilIcon, TrashIcon } from './icons'

function yesterdayOf(dataISO) {
  return addDaysISO(dataISO, -1)
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
  const [tipoRefeicao, setTipoRefeicao] = useState(suggestMealType(nowHHMM()))

  const [editingMeta, setEditingMeta] = useState(false)
  const [novaMeta, setNovaMeta] = useState('')

  const [editingId, setEditingId] = useState(null)
  const [editKcal, setEditKcal] = useState('')
  const [editDescricao, setEditDescricao] = useState('')
  const [editHora, setEditHora] = useState('')
  const [editTipoRefeicao, setEditTipoRefeicao] = useState('outro')

  const [mealPreset, setMealPreset] = useState('semana')
  const [mealDate, setMealDate] = useState(todayISO())
  const [mealStart, setMealStart] = useState(todayISO())
  const [mealEnd, setMealEnd] = useState(todayISO())
  const [mealAverages, setMealAverages] = useState({ rows: [] })
  const [showEntries, setShowEntries] = useState(false)
  const [showAverages, setShowAverages] = useState(false)

  const [metabolic, setMetabolic] = useState(null)
  const [editingSexo, setEditingSexo] = useState(false)
  const [novoSexo, setNovoSexo] = useState('M')

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

  const loadMetabolic = useCallback(async () => {
    const result = await fetchWeeklyMetabolicBalance(supabase, user.id, profile, data)
    setMetabolic(result)
  }, [user.id, profile, data])

  useEffect(() => {
    loadMetabolic()
  }, [loadMetabolic])

  const loadMealAverages = useCallback(async () => {
    const result = await fetchMealTypeAverages(supabase, user.id, mealPreset, {
      date: mealDate,
      start: mealStart,
      end: mealEnd,
    })
    setMealAverages(result)
  }, [user.id, mealPreset, mealDate, mealStart, mealEnd])

  useEffect(() => {
    loadMealAverages()
  }, [loadMealAverages])

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

  async function handleSetSexo(e) {
    e.preventDefault()
    setError('')
    try {
      await updateProfile({ sexo: novoSexo })
      setEditingSexo(false)
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
      tipo_refeicao: tipoRefeicao,
    })
    if (error) {
      setError(error.message)
      return
    }
    setKcal('')
    setDescricao('')
    setHora(nowHHMM())
    setTipoRefeicao(suggestMealType(nowHHMM()))
    load()
    loadMealAverages()
    loadMetabolic()
  }

  async function handleDelete(id) {
    await supabase.from('calorie_logs').delete().eq('id', id)
    load()
    loadMealAverages()
    loadMetabolic()
  }

  function startEdit(entry) {
    setEditingId(entry.id)
    setEditKcal(String(entry.kcal))
    setEditDescricao(entry.descricao || '')
    setEditHora(entry.hora?.slice(0, 5) || nowHHMM())
    setEditTipoRefeicao(entry.tipo_refeicao || 'outro')
  }

  async function handleSaveEdit(id) {
    setError('')
    const { error } = await supabase
      .from('calorie_logs')
      .update({ kcal: Number(editKcal), descricao: editDescricao, hora: editHora, tipo_refeicao: editTipoRefeicao })
      .eq('id', id)
    if (error) {
      setError(error.message)
      return
    }
    setEditingId(null)
    load()
    loadMealAverages()
    loadMetabolic()
  }

  async function handleCopyFromYesterday(entry) {
    setError('')
    const { error } = await supabase.from('calorie_logs').insert({
      user_id: user.id,
      kcal: entry.kcal,
      descricao: entry.descricao,
      data,
      hora: nowHHMM(),
      tipo_refeicao: entry.tipo_refeicao,
    })
    if (error) {
      setError(error.message)
      return
    }
    load()
    loadMealAverages()
    loadMetabolic()
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

      {metabolic ? (
        <div className="metabolic-balance">
          <h3>Baseado na sua taxa metabólica</h3>
          <p className={`kcal-saldo${metabolic.saldoDia < 0 ? ' negative' : ''}`}>
            {isToday ? 'Hoje' : `Em ${shortDateLabel(data)}`}:{' '}
            {metabolic.saldoDia >= 0 ? 'deixou de consumir' : 'consumiu'}{' '}
            {Math.abs(Math.round(metabolic.saldoDia))} kcal
          </p>
          <p className={`kcal-saldo${metabolic.acumuladoSemana < 0 ? ' negative' : ''}`}>
            7 dias até {shortDateLabel(data)}: {metabolic.acumuladoSemana >= 0 ? 'acumulou' : 'ultrapassou em'}{' '}
            {Math.abs(Math.round(metabolic.acumuladoSemana))} kcal
            {metabolic.acumuladoSemana >= 0 ? ' a menos do que gastou' : ' do que gastou'}
          </p>
        </div>
      ) : (
        <div className="metabolic-balance">
          <p className="empty-state">
            Defina seu sexo pra calcular sua taxa metabólica basal e ver quanto você deixou de consumir com base no
            que realmente gastou (não só na meta).
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
              <button type="submit">Salvar</button>
              <button type="button" className="link-button" onClick={() => setEditingSexo(false)}>
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
        <div className="grid-2">
          <label>
            Kcal
            <input type="number" value={kcal} onChange={(e) => setKcal(e.target.value)} required />
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
                  <th>Descrição</th>
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

      <button type="button" className="link-button" onClick={() => setShowAverages((v) => !v)}>
        {showAverages ? 'Ocultar média por refeição' : 'Ver média por refeição'}
      </button>
      {showAverages && (
        <>
          <h3>Média por refeição</h3>
          <PeriodSelector
            preset={mealPreset}
            onPresetChange={setMealPreset}
            date={mealDate}
            onDateChange={setMealDate}
            start={mealStart}
            onStartChange={setMealStart}
            end={mealEnd}
            onEndChange={setMealEnd}
          />
          {mealAverages.rows.length === 0 ? (
            <p className="empty-state">Sem registros suficientes nesse período.</p>
          ) : (
            <table className="table">
              <thead>
                <tr>
                  <th>Refeição</th>
                  <th>Média</th>
                  <th>Registros</th>
                </tr>
              </thead>
              <tbody>
                {mealAverages.rows.map((r) => (
                  <tr key={r.key}>
                    <td data-label="Refeição">{r.label}</td>
                    <td data-label="Média">{r.media} kcal</td>
                    <td data-label="Registros">{r.registros}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </>
      )}
    </>
  )
}
