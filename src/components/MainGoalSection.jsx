import { useEffect, useState, useCallback } from 'react'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../context/AuthContext'
import MainGoalCard from './MainGoalCard'

function statusOf(c) {
  const hoje = todayISO()
  if (hoje < c.data_inicio) return 'Ainda não começou'
  if (hoje > c.data_fim) return 'Concluído'
  return 'Em andamento'
}

function todayISO() {
  return new Date().toISOString().slice(0, 10)
}

export default function MainGoalSection({ group }) {
  const { user } = useAuth()
  const [challenge, setChallenge] = useState(null)
  const [history, setHistory] = useState([])
  const [error, setError] = useState('')

  const load = useCallback(async () => {
    if (!group) {
      setChallenge(null)
      setHistory([])
      return
    }
    const { data } = await supabase
      .from('main_goals')
      .select('*')
      .eq('group_id', group.id)
      .order('created_at', { ascending: false })
    const [current, ...past] = data ?? []
    setChallenge(current ?? null)
    setHistory(past)
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
      {history.length > 0 && (
        <div className="card">
          <h2>Desafios anteriores</h2>
          <ul className="challenge-history-list">
            {history.map((c) => (
              <li key={c.id} className="challenge-history-item">
                <span>
                  {c.titulo} — {new Date(`${c.data_inicio}T00:00:00`).toLocaleDateString('pt-BR')} até{' '}
                  {new Date(`${c.data_fim}T00:00:00`).toLocaleDateString('pt-BR')}
                </span>
                <span className="challenge-history-status">{statusOf(c)}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </>
  )
}
