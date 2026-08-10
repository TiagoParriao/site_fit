import { useEffect, useState, useCallback } from 'react'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../context/AuthContext'
import MainGoalCard from './MainGoalCard'

export default function MainGoalSection({ group }) {
  const { user } = useAuth()
  const [challenge, setChallenge] = useState(null)
  const [error, setError] = useState('')

  const load = useCallback(async () => {
    if (!group) {
      setChallenge(null)
      return
    }
    const { data } = await supabase
      .from('main_goals')
      .select('*')
      .eq('group_id', group.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()
    setChallenge(data ?? null)
  }, [group])

  useEffect(() => {
    load()
  }, [load])

  async function handleSetChallenge({ titulo, data_inicio, data_fim }) {
    setError('')
    const { error } = await supabase
      .from('main_goals')
      .insert({ group_id: group.id, user_id: user.id, titulo, data_inicio, data_fim })
    if (error) {
      setError(error.message)
      return
    }
    load()
  }

  if (!group) {
    return (
      <div className="card">
        <h2>Desafio do grupo</h2>
        <p className="empty-state">Entre em um grupo para criar um desafio com seus amigos.</p>
      </div>
    )
  }

  return (
    <>
      {error && <p className="error">{error}</p>}
      <MainGoalCard challenge={challenge} onSetChallenge={handleSetChallenge} />
    </>
  )
}
