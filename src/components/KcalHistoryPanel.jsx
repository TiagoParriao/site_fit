import { useEffect, useState, useCallback } from 'react'
import { supabase } from '../lib/supabaseClient'
import { fetchGroupKcalHistory } from '../lib/kcalHistory'
import { fetchGroupMetabolicHistory } from '../lib/metabolicGroupHistory'
import { colorForUser } from '../lib/avatarColor'
import { AnimalAvatar } from './AnimalIcons'
import PeriodSelector from './PeriodSelector'
import KcalHistoryChart from './KcalHistoryChart'
import MetabolicHistoryChart from './MetabolicHistoryChart'
import { todayISO } from '../lib/dates'

export default function KcalHistoryPanel({ group, members, refreshKey }) {
  const [preset, setPreset] = useState('semana')
  const [date, setDate] = useState(todayISO())
  const [start, setStart] = useState(todayISO())
  const [end, setEnd] = useState(todayISO())
  const [result, setResult] = useState({ rows: [], chartDates: [], chartSeries: [] })

  const [metabolicPreset, setMetabolicPreset] = useState('semana')
  const [metabolicDate, setMetabolicDate] = useState(todayISO())
  const [metabolicStart, setMetabolicStart] = useState(todayISO())
  const [metabolicEnd, setMetabolicEnd] = useState(todayISO())
  const [metabolicResult, setMetabolicResult] = useState({ chartDates: [], chartSeries: [], membrosSemDados: [] })

  const load = useCallback(async () => {
    const data = await fetchGroupKcalHistory(supabase, members, preset, { date, start, end })
    setResult(data)
  }, [members, preset, date, start, end, refreshKey])

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
  }, [members, metabolicPreset, metabolicDate, metabolicStart, metabolicEnd, refreshKey])

  useEffect(() => {
    loadMetabolic()
  }, [loadMetabolic])

  if (!group) return null

  return (
    <div className="dashboard-insights-grid">
      <section className="card kcal-history-card">
      <h2>Histórico de Calorias</h2>

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

          <div className="group-exercise-section">
            <div className="group-chart-heading">
              <div>
                <span className="section-kicker">Exercícios do grupo</span>
                <h3>Kcal gastas em exercício</h3>
                <p>Valores diários de todos os membros no período selecionado.</p>
              </div>
            </div>
            <KcalHistoryChart
              dates={result.chartDatesGasto}
              series={result.chartSeriesGasto}
              emptyMessage="Sem exercícios registrados nesse período."
            />
            <div className="exercise-member-grid">
              {result.rows.map((r) => (
                <div className="exercise-member-card" key={r.user_id}>
                  <span className="chart-legend-swatch" style={{ background: colorForUser(r.user_id, r.cor) }} />
                  <div>
                    <strong>{r.nome}</strong>
                    <span>{r.totalSessoesPeriodo} {r.totalSessoesPeriodo === 1 ? 'sessão' : 'sessões'} · {r.totalMinutosPeriodo} min</span>
                  </div>
                  <b>{new Intl.NumberFormat('pt-BR').format(r.totalGastoPeriodo)} kcal</b>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
      </section>
      <section className="card metabolic-card">
          <div className="card-heading-real">
            <div><span className="section-kicker">Metabolismo do grupo</span><h2>Saldo calórico</h2><p>Gasto estimado menos consumo — apenas dias fechados.</p></div>
          </div>
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
          {metabolicResult.chartSeries.length > 0 && (
            <div className="member-report-grid">
              {metabolicResult.chartSeries.map((s) => {
                const acumulado = s.values.reduce((sum, v) => sum + v, 0)
                const positivo = acumulado >= 0
                return (
                  <div key={s.user_id} className="member-report-card">
                    <div className="member-report-head">
                      <span
                        className="member-report-avatar"
                        style={{ '--member-color': colorForUser(s.user_id, s.cor) }}
                      >
                        <AnimalAvatar avatarKey={s.avatarKey} size={28} />
                      </span>
                      <div>
                        <span className="member-report-name">{s.nome}</span>
                        <span className="member-report-status">Membro ativo</span>
                      </div>
                    </div>

                    <div className="member-report-stats">
                      <div className="member-report-stat">
                        <span>Gasto total</span>
                        <strong>{Math.round(s.totalGet).toLocaleString('pt-BR')} kcal</strong>
                      </div>
                      <div className="member-report-stat">
                        <span>Gasto estimado hoje</span>
                        <strong>{Math.round(s.getHoje).toLocaleString('pt-BR')} kcal</strong>
                      </div>
                    </div>

                    <div>
                      <div className="member-report-progress-head">
                        <span>Saldo acumulado</span>
                        <strong>{Math.abs(Math.round(acumulado)).toLocaleString('pt-BR')} kcal</strong>
                      </div>
                      <span className={`member-report-badge${positivo ? '' : ' negative'}`}>
                        {positivo ? 'Saldo positivo' : 'Saldo negativo'}
                      </span>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
      </section>
    </div>
  )
}
