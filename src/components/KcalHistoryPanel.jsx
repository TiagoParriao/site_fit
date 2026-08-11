import { useEffect, useState, useCallback } from 'react'
import { supabase } from '../lib/supabaseClient'
import { fetchGroupKcalHistory } from '../lib/kcalHistory'
import { colorForUser } from '../lib/avatarColor'
import PeriodSelector from './PeriodSelector'
import KcalHistoryChart from './KcalHistoryChart'

function todayISO() {
  return new Date().toISOString().slice(0, 10)
}

export default function KcalHistoryPanel({ group, members }) {
  const [preset, setPreset] = useState('semana')
  const [date, setDate] = useState(todayISO())
  const [start, setStart] = useState(todayISO())
  const [end, setEnd] = useState(todayISO())
  const [result, setResult] = useState({ rows: [], chartDates: [], chartSeries: [] })
  const [editingTitle, setEditingTitle] = useState(false)
  const [tituloDraft, setTituloDraft] = useState('')
  const [tituloAtual, setTituloAtual] = useState(group?.kcal_titulo || 'Histórico de calorias')
  const [error, setError] = useState('')

  useEffect(() => {
    setTituloAtual(group?.kcal_titulo || 'Histórico de calorias')
  }, [group?.kcal_titulo])

  const load = useCallback(async () => {
    const data = await fetchGroupKcalHistory(supabase, members, preset, { date, start, end })
    setResult(data)
  }, [members, preset, date, start, end])

  useEffect(() => {
    load()
  }, [load])

  async function handleSaveTitle(e) {
    e.preventDefault()
    setError('')
    const { error } = await supabase.from('groups').update({ kcal_titulo: tituloDraft }).eq('id', group.id)
    if (error) {
      setError(error.message)
      return
    }
    setTituloAtual(tituloDraft)
    setEditingTitle(false)
  }

  if (!group) return null

  return (
    <div className="card">
      {editingTitle ? (
        <form className="form-actions" onSubmit={handleSaveTitle}>
          <input value={tituloDraft} onChange={(e) => setTituloDraft(e.target.value)} required />
          <button type="submit">Salvar</button>
          <button type="button" className="link-button" onClick={() => setEditingTitle(false)}>
            Cancelar
          </button>
        </form>
      ) : (
        <div className="form-actions">
          <h2>{tituloAtual}</h2>
          <button
            className="link-button"
            onClick={() => {
              setTituloDraft(tituloAtual)
              setEditingTitle(true)
            }}
          >
            editar título
          </button>
        </div>
      )}
      {error && <p className="error">{error}</p>}

      <PeriodSelector
        preset={preset}
        onPresetChange={setPreset}
        date={date}
        onDateChange={setDate}
        start={start}
        onStartChange={setStart}
        end={end}
        onEndChange={setEnd}
      />

      {result.rows.length === 0 ? (
        <p className="empty-state">Nenhum membro no grupo.</p>
      ) : (
        <>
          <KcalHistoryChart dates={result.chartDates} series={result.chartSeries} />
          <div className="chart-legend">
            {result.rows.map((r) => (
              <span key={r.user_id}>
                <span className="chart-legend-swatch" style={{ background: colorForUser(r.user_id, r.cor) }} />
                {r.nome} — consumiu {r.totalPeriodo} kcal / gastou {r.totalGastoPeriodo} kcal
              </span>
            ))}
          </div>

          <table className="table">
            <thead>
              <tr>
                <th>Membro</th>
                <th>Meta diária</th>
                <th>Kcal consumidas</th>
                <th>Kcal gastas</th>
                <th>Dias registrados</th>
                <th>Dias acima da meta</th>
              </tr>
            </thead>
            <tbody>
              {result.rows.map((r) => (
                <tr key={r.user_id}>
                  <td data-label="Membro">{r.nome}</td>
                  <td data-label="Meta diária">{r.meta} kcal</td>
                  <td data-label="Kcal consumidas">{r.totalPeriodo} kcal</td>
                  <td data-label="Kcal gastas">{r.totalGastoPeriodo} kcal</td>
                  <td data-label="Dias registrados">{r.diasRegistrados}</td>
                  <td data-label="Dias acima da meta">{r.diasEstourados}</td>
                </tr>
              ))}
            </tbody>
          </table>

          {result.rows.some((r) => r.diasEstouradosLista.length > 0) && (
            <ul className="overbudget-list">
              {result.rows.flatMap((r) =>
                r.diasEstouradosLista.map((d) => (
                  <li key={`${r.user_id}-${d.data}`} className="overbudget-item">
                    <span>
                      {r.nome} — {new Date(`${d.data}T00:00:00`).toLocaleDateString('pt-BR')}
                    </span>
                    <span>+{d.diff} kcal</span>
                  </li>
                ))
              )}
            </ul>
          )}

          <h3>Kcal gastas em exercício</h3>
          <KcalHistoryChart
            dates={result.chartDatesGasto}
            series={result.chartSeriesGasto}
            emptyMessage="Sem exercícios registrados nesse período."
          />
          <div className="chart-legend">
            {result.rows.map((r) => (
              <span key={r.user_id}>
                <span className="chart-legend-swatch" style={{ background: colorForUser(r.user_id, r.cor) }} />
                {r.nome} — {r.totalGastoPeriodo} kcal gastas
              </span>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
