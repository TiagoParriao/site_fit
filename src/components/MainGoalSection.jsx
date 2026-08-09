import { useEffect, useState, useCallback } from 'react'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../context/AuthContext'
import MainGoalCard from './MainGoalCard'
import ProgressTrail from './ProgressTrail'
import { fetchGroupMainGoals, buildMainGoalLanes } from '../lib/mainGoalTrail'

export default function MainGoalSection({ members, hasGroup }) {
  const { user } = useAuth()
  const [myGoal, setMyGoal] = useState(null)
  const [lanes, setLanes] = useState([])
  const [error, setError] = useState('')

  const load = useCallback(async () => {
    const { data: goalRow } = await supabase
      .from('main_goals')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()
    setMyGoal(goalRow ?? null)

    if (members.length > 0) {
      const goalsByUser = await fetchGroupMainGoals(supabase, members.map((m) => m.user_id))
      setLanes(buildMainGoalLanes(members, goalsByUser))
    } else {
      setLanes([])
    }
  }, [user.id, members])

  useEffect(() => {
    load()
  }, [load])

  async function handleSetGoal({ titulo, dias_totais }) {
    setError('')
    const { error } = await supabase.from('main_goals').insert({ user_id: user.id, titulo, dias_totais })
    if (error) {
      setError(error.message)
      return
    }
    load()
  }

  return (
    <div className="grid-2">
      <MainGoalCard goal={myGoal} onSetGoal={handleSetGoal} />
      <div className="card">
        <h2>Trilha das metas do grupo</h2>
        {error && <p className="error">{error}</p>}
        <ProgressTrail
          lanes={lanes}
          emptyMessage={
            hasGroup ? 'Ninguém do grupo definiu uma meta principal ainda.' : 'Entre em um grupo para ver a trilha de metas dos seus amigos.'
          }
        />
      </div>
    </div>
  )
}
