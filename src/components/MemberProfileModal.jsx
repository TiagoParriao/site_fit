import { useEffect, useState, useCallback } from 'react'
import { supabase } from '../lib/supabaseClient'
import Modal from './Modal'
import PeriodSelector from './PeriodSelector'
import { fetchMemberSummary } from '../lib/memberSummary'
import { todayISO } from '../lib/dates'

export default function MemberProfileModal({ member, onClose }) {
  const [preset, setPreset] = useState('mes')
  const [date, setDate] = useState(todayISO())
  const [start, setStart] = useState(todayISO())
  const [end, setEnd] = useState(todayISO())
  const [summary, setSummary] = useState(null)
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    setLoading(true)
    const result = await fetchMemberSummary(supabase, member.user_id, preset, { date, start, end })
    setSummary(result)
    setLoading(false)
  }, [member.user_id, preset, date, start, end])

  useEffect(() => {
    load()
  }, [load])

  return (
    <Modal title={member.nome} onClose={onClose}>
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

      {loading || !summary ? (
        <p>Carregando...</p>
      ) : (
        <div className="profile-summary-grid">
          <div className="profile-summary-block">
            <h3>Peso</h3>
            {summary.peso.registros === 0 ? (
              <p className="empty-state">Sem registros no período.</p>
            ) : (
              <>
                <p className="big-number">{summary.peso.final}kg</p>
                {summary.peso.delta != null && (
                  <p className={`weight-diff${summary.peso.delta > 0 ? ' up' : ''}`}>
                    {summary.peso.delta > 0 ? '+' : ''}
                    {summary.peso.delta.toFixed(1)}kg no período
                  </p>
                )}
              </>
            )}
          </div>

          <div className="profile-summary-block">
            <h3>Medidas</h3>
            {summary.medidas.length === 0 ? (
              <p className="empty-state">Sem registros no período.</p>
            ) : (
              <ul className="finance-category-breakdown">
                {summary.medidas.map((m) => (
                  <li key={m.nome}>
                    <span>{m.nome}</span>
                    <span>{m.valor_cm}cm</span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="profile-summary-block">
            <h3>Calorias</h3>
            {summary.calorias.totalRefeicoes === 0 ? (
              <p className="empty-state">Sem registros no período.</p>
            ) : (
              <>
                <p className="big-number">{summary.calorias.totalKcal} kcal</p>
                <p className="calorie-progress-label">
                  {summary.calorias.totalRefeicoes} refeições em {summary.calorias.diasRegistrados} dias — média de{' '}
                  {summary.calorias.mediaKcalDia} kcal/dia registrado
                </p>
              </>
            )}
          </div>

          <div className="profile-summary-block">
            <h3>Exercício</h3>
            {summary.exercicio.totalSessoes === 0 ? (
              <p className="empty-state">Sem registros no período.</p>
            ) : (
              <>
                <p className="big-number">{summary.exercicio.totalKcalGasta} kcal</p>
                <p className="calorie-progress-label">
                  {summary.exercicio.totalSessoes} sessões, {summary.exercicio.totalMinutos} minutos no total
                </p>
              </>
            )}
          </div>
        </div>
      )}
    </Modal>
  )
}
