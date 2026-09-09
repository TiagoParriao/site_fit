import { useEffect, useState, useCallback } from 'react'
import { supabase } from '../lib/supabaseClient'
import { fetchGroupKcalHistory } from '../lib/kcalHistory'
import { fetchGroupProteinHistory } from '../lib/proteinHistory'
import { colorForUser } from '../lib/avatarColor'
import PeriodSelector from './PeriodSelector'
import KcalHistoryChart from './KcalHistoryChart'
import { todayISO } from '../lib/dates'

export default function KcalHistoryPanel({ group, members, refreshKey }) {
  const [preset, setPreset] = useState('semana')
  const [date, setDate] = useState(todayISO())
  const [start, setStart] = useState(todayISO())
  const [end, setEnd] = useState(todayISO())
  const [result, setResult] = useState({ rows: [], chartDates: [], chartSeries: [] })

  const load = useCallback(async () => {
    const [data, proteinData] = await Promise.all([
      fetchGroupKcalHistory(supabase, members, preset, { date, start, end }),
      fetchGroupProteinHistory(supabase, members, preset, { date, start, end }),
    ])
    setResult({ ...data, chartDatesProteina: proteinData.chartDates, chartSeriesProteina: proteinData.chartSeries })
  }, [members, preset, date, start, end, refreshKey])

  useEffect(() => {
    load()
  }, [load])

  if (!group) return null

  return (
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

          <div className="group-exercise-section">
            <div className="group-chart-heading">
              <div>
                <span className="section-kicker">Nutrição do grupo</span>
                <h3>Proteína consumida</h3>
                <p>Valores diários de todos os membros no período selecionado.</p>
              </div>
            </div>
            <KcalHistoryChart
              dates={result.chartDatesProteina}
              series={result.chartSeriesProteina}
              emptyMessage="Sem proteína registrada nesse período."
              unit="g"
              step={50}
              ariaLabel="Proteína consumida por dia e por membro"
            />
            <div className="exercise-member-grid">
              {(result.chartSeriesProteina ?? []).map((s) => (
                <div className="exercise-member-card" key={s.user_id}>
                  <span className="chart-legend-swatch" style={{ background: colorForUser(s.user_id, s.cor) }} />
                  <div>
                    <strong>{s.nome}</strong>
                  </div>
                  <b>{s.totalG}g</b>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </section>
  )
}
