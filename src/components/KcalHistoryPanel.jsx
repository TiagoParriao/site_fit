import { useEffect, useState, useCallback } from 'react'
import { supabase } from '../lib/supabaseClient'
import { fetchGroupKcalHistory } from '../lib/kcalHistory'
import { fetchGroupMetabolicHistory } from '../lib/metabolicGroupHistory'
import { colorForUser } from '../lib/avatarColor'
import PeriodSelector from './PeriodSelector'
import KcalHistoryChart from './KcalHistoryChart'
import MetabolicHistoryChart from './MetabolicHistoryChart'
import { todayISO } from '../lib/dates'

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

  const [metabolicPreset, setMetabolicPreset] = useState('semana')
  const [metabolicDate, setMetabolicDate] = useState(todayISO())
  const [metabolicStart, setMetabolicStart] = useState(todayISO())
  const [metabolicEnd, setMetabolicEnd] = useState(todayISO())
  const [metabolicResult, setMetabolicResult] = useState({ chartDates: [], chartSeries: [], membrosSemDados: [] })

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

  const loadMetabolic = useCallback(async () => {
    const data = await fetchGroupMetabolicHistory(supabase, members, metabolicPreset, {
      date: metabolicDate,
      start: metabolicStart,
      end: metabolicEnd,
    })
    setMetabolicResult(data)
  }, [members, metabolicPreset, metabolicDate, metabolicStart, metabolicEnd])

  useEffect(() => {
    loadMetabolic()
  }, [loadMetabolic])

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

          <input type="checkbox" id="kcal-details-toggle" className="details-toggle-input" />
          <label htmlFor="kcal-details-toggle" className="details-toggle-label link-button">
            <span className="details-toggle-text-show">Ver detalhes por membro</span>
            <span className="details-toggle-text-hide">Ocultar detalhes por membro</span>
          </label>
          <div className="details-toggle-content">
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
          </div>

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

          <h3>Saldo calórico baseado na TMB</h3>
          <PeriodSelector
            preset={metabolicPreset}
            onPresetChange={setMetabolicPreset}
            date={metabolicDate}
            onDateChange={setMetabolicDate}
            start={metabolicStart}
            onStartChange={setMetabolicStart}
            end={metabolicEnd}
            onEndChange={setMetabolicEnd}
          />
          <MetabolicHistoryChart
            dates={metabolicResult.chartDates}
            series={metabolicResult.chartSeries}
            emptyMessage="Sem dados suficientes nesse período."
          />
          {metabolicResult.chartSeries.length > 0 && (
            <div className="chart-legend">
              {metabolicResult.chartSeries.map((s) => (
                <span key={s.user_id}>
                  <span className="chart-legend-swatch" style={{ background: colorForUser(s.user_id, s.cor) }} />
                  {s.nome}
                </span>
              ))}
            </div>
          )}
          {metabolicResult.membrosSemDados.length > 0 && (
            <p className="empty-state">
              {metabolicResult.membrosSemDados.join(', ')} ainda não {metabolicResult.membrosSemDados.length > 1 ? 'definiram' : 'definiu'} sexo, peso ou altura suficientes pra calcular a TMB.
            </p>
          )}
          {metabolicResult.chartSeries.map((s) => {
            const acumulado = s.values.reduce((sum, v) => sum + v, 0)
            return (
              <div key={s.user_id} className="metabolic-balance">
                <p className={`kcal-saldo${acumulado < 0 ? ' negative' : ''}`}>
                  {s.nome} — gasto calórico de {s.totalGet} kcal, {acumulado >= 0 ? 'acumulou' : 'ultrapassou em'}{' '}
                  {Math.abs(Math.round(acumulado))} kcal{acumulado >= 0 ? ' a menos do que gastou' : ' do que gastou'}
                </p>
                <p className="kcal-saldo">Gasto estimado para hoje será {Math.round(s.getHoje)} kcal</p>
              </div>
            )
          })}
        </>
      )}
    </div>
  )
}
