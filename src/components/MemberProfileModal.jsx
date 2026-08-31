import { useEffect, useState, useCallback } from 'react'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../context/AuthContext'
import Modal from './Modal'
import PeriodSelector from './PeriodSelector'
import { fetchMemberSummary } from '../lib/memberSummary'
import { todayISO } from '../lib/dates'

export default function MemberProfileModal({ member, onClose }) {
  const { user, profile, updateProfile } = useAuth()
  const isSelf = member.user_id === user.id

  const [preset, setPreset] = useState('mes')
  const [date, setDate] = useState(todayISO())
  const [start, setStart] = useState(todayISO())
  const [end, setEnd] = useState(todayISO())
  const [summary, setSummary] = useState(null)
  const [loading, setLoading] = useState(true)

  const [editingProfile, setEditingProfile] = useState(false)
  const [savingProfile, setSavingProfile] = useState(false)
  const [profileError, setProfileError] = useState('')
  const [form, setForm] = useState(null)

  const load = useCallback(async () => {
    setLoading(true)
    const result = await fetchMemberSummary(supabase, member.user_id, preset, { date, start, end })
    setSummary(result)
    setLoading(false)
  }, [member.user_id, preset, date, start, end])

  useEffect(() => {
    load()
  }, [load])

  function startEditProfile() {
    setForm({
      nome: profile?.nome ?? '',
      data_nascimento: profile?.data_nascimento ?? '',
      sexo: profile?.sexo ?? 'M',
      altura_cm: profile?.altura_cm != null ? String(profile.altura_cm) : '',
      meta_kcal_diaria: profile?.meta_kcal_diaria != null ? String(profile.meta_kcal_diaria) : '',
    })
    setProfileError('')
    setEditingProfile(true)
  }

  async function handleSaveProfile(e) {
    e.preventDefault()
    if (savingProfile) return
    setProfileError('')
    setSavingProfile(true)
    try {
      await updateProfile({
        nome: form.nome,
        data_nascimento: form.data_nascimento || null,
        sexo: form.sexo,
        altura_cm: form.altura_cm ? Number(form.altura_cm) : null,
        meta_kcal_diaria: Number(form.meta_kcal_diaria),
      })
      setEditingProfile(false)
    } catch (err) {
      setProfileError(err.message)
    } finally {
      setSavingProfile(false)
    }
  }

  return (
    <Modal title={member.nome} onClose={onClose}>
      {isSelf && (
        <div className="profile-edit-block">
          {editingProfile ? (
            <form className="stacked-form" onSubmit={handleSaveProfile}>
              {profileError && <p className="error">{profileError}</p>}
              <label>
                Nome
                <input value={form.nome} onChange={(e) => setForm((f) => ({ ...f, nome: e.target.value }))} required />
              </label>
              <div className="grid-2">
                <label>
                  Data de nascimento
                  <input
                    type="date"
                    value={form.data_nascimento}
                    onChange={(e) => setForm((f) => ({ ...f, data_nascimento: e.target.value }))}
                  />
                </label>
                <label>
                  Sexo
                  <select value={form.sexo} onChange={(e) => setForm((f) => ({ ...f, sexo: e.target.value }))}>
                    <option value="M">Masculino</option>
                    <option value="F">Feminino</option>
                  </select>
                </label>
              </div>
              <div className="grid-2">
                <label>
                  Altura (cm)
                  <input
                    type="number"
                    step="0.1"
                    value={form.altura_cm}
                    onChange={(e) => setForm((f) => ({ ...f, altura_cm: e.target.value }))}
                  />
                </label>
                <label>
                  Meta de calorias diárias
                  <input
                    type="number"
                    value={form.meta_kcal_diaria}
                    onChange={(e) => setForm((f) => ({ ...f, meta_kcal_diaria: e.target.value }))}
                    required
                  />
                </label>
              </div>
              <div className="form-actions">
                <button type="submit" disabled={savingProfile}>
                  {savingProfile ? 'Salvando...' : 'Salvar'}
                </button>
                <button type="button" className="link-button" onClick={() => setEditingProfile(false)} disabled={savingProfile}>
                  Cancelar
                </button>
              </div>
            </form>
          ) : (
            <button type="button" className="link-button" onClick={startEditProfile}>
              Editar meu perfil
            </button>
          )}
        </div>
      )}

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
              <ul className="profile-summary-list">
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
