import { useEffect, useState, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../context/AuthContext'
import MainGoalSection from '../components/MainGoalSection'
import KcalHistoryPanel from '../components/KcalHistoryPanel'
import TrilhaSection from '../components/TrilhaSection'

export default function Dashboard() {
  const { user, profile } = useAuth()
  const [loading, setLoading] = useState(true)
  const [group, setGroup] = useState(null)
  const [members, setMembers] = useState([])

  const load = useCallback(async () => {
    setLoading(true)

    const { data: memberships } = await supabase
      .from('group_members')
      .select('joined_at, groups(id, nome, kcal_titulo)')
      .eq('user_id', user.id)
      .order('joined_at', { ascending: false })
      .limit(1)

    const activeGroup = memberships?.[0]?.groups ?? null
    setGroup(activeGroup)

    if (activeGroup) {
      const { data: groupMembers } = await supabase
        .from('group_members')
        .select('user_id, profiles(nome, meta_kcal_diaria, cor, sexo, altura_cm, data_nascimento, avatar_key)')
        .eq('group_id', activeGroup.id)

      const flatMembers = (groupMembers ?? []).map((m) => ({
        user_id: m.user_id,
        nome: m.profiles?.nome ?? 'Membro',
        meta_kcal_diaria: m.profiles?.meta_kcal_diaria ?? 2000,
        cor: m.profiles?.cor ?? null,
        sexo: m.profiles?.sexo ?? null,
        altura_cm: m.profiles?.altura_cm ?? null,
        data_nascimento: m.profiles?.data_nascimento ?? null,
        avatar_key: m.profiles?.avatar_key ?? null,
      }))
      setMembers(flatMembers)
    } else {
      setMembers([])
    }

    setLoading(false)
  }, [user.id])

  useEffect(() => {
    load()
  }, [load])

  if (loading) return <div className="page-loading">Carregando...</div>

  return (
    <div className="page">
      <header className="route-header">
        <span>Visão geral</span>
        <h1>Olá, {profile?.nome}!</h1>
        <p>Seu progresso e o ritmo do grupo em um só lugar.</p>
      </header>

      {!group && (
        <p className="empty-state">
          Você ainda não está em um grupo. <Link to="/grupo">Crie ou entre em um</Link> para ver a trilha e o histórico
          com seus amigos.
        </p>
      )}

      <MainGoalSection group={group} />

      {group && <KcalHistoryPanel group={group} members={members} />}

      <TrilhaSection />
    </div>
  )
}
