import { useEffect, useState, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../context/AuthContext'
import ProgressTrail from '../components/ProgressTrail'
import CalorieProgressBar from '../components/CalorieProgressBar'
import { fetchWeeklyProgress } from '../lib/weeklyProgress'

const GOAL_DAYS = 5

function todayISO() {
  return new Date().toISOString().slice(0, 10)
}

export default function Dashboard() {
  const { user, profile } = useAuth()
  const [loading, setLoading] = useState(true)
  const [group, setGroup] = useState(null)
  const [members, setMembers] = useState([])
  const [progress, setProgress] = useState({})
  const [kcalHoje, setKcalHoje] = useState(0)
  const [pesoAtual, setPesoAtual] = useState(null)

  const load = useCallback(async () => {
    setLoading(true)

    const [{ data: memberships }, { data: kcalRows }, { data: weightRows }] = await Promise.all([
      supabase
        .from('group_members')
        .select('joined_at, groups(id, nome)')
        .eq('user_id', user.id)
        .order('joined_at', { ascending: false })
        .limit(1),
      supabase.from('calorie_logs').select('kcal').eq('user_id', user.id).eq('data', todayISO()),
      supabase.from('weight_logs').select('peso_kg, data').eq('user_id', user.id).order('data', { ascending: false }).limit(1),
    ])

    setKcalHoje((kcalRows ?? []).reduce((sum, r) => sum + r.kcal, 0))
    setPesoAtual(weightRows?.[0]?.peso_kg ?? null)

    const activeGroup = memberships?.[0]?.groups ?? null
    setGroup(activeGroup)

    if (activeGroup) {
      const { data: groupMembers } = await supabase
        .from('group_members')
        .select('user_id, profiles(nome, meta_kcal_diaria)')
        .eq('group_id', activeGroup.id)

      const flatMembers = (groupMembers ?? []).map((m) => ({
        user_id: m.user_id,
        nome: m.profiles?.nome ?? 'Membro',
        meta_kcal_diaria: m.profiles?.meta_kcal_diaria ?? 2000,
      }))
      setMembers(flatMembers)

      const weekly = await fetchWeeklyProgress(supabase, flatMembers, GOAL_DAYS)
      setProgress(weekly)
    } else {
      setMembers([])
      setProgress({})
    }

    setLoading(false)
  }, [user.id])

  useEffect(() => {
    load()
  }, [load])

  if (loading) return <div className="page-loading">Carregando...</div>

  return (
    <div className="page">
      <h1>Olá, {profile?.nome}!</h1>

      <div className="grid-2">
        <div className="card">
          <h2>Kcal hoje</h2>
          <CalorieProgressBar consumido={kcalHoje} meta={profile?.meta_kcal_diaria ?? 2000} />
          <Link to="/calorias">Registrar refeição →</Link>
        </div>
        <div className="card">
          <h2>Peso atual</h2>
          <p className="big-number">{pesoAtual ? `${pesoAtual} kg` : 'Sem registro'}</p>
          <Link to="/peso">Atualizar peso →</Link>
        </div>
      </div>

      <div className="card">
        <h2>Trilha da semana{group ? ` — ${group.nome}` : ''}</h2>
        {group ? (
          <ProgressTrail members={members} progress={progress} goalDays={GOAL_DAYS} />
        ) : (
          <p className="empty-state">
            Você ainda não está em um grupo. <Link to="/grupo">Crie ou entre em um</Link> para começar a trilha com seus
            amigos.
          </p>
        )}
      </div>
    </div>
  )
}
