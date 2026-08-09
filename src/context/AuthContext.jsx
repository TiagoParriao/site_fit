import { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { supabase } from '../lib/supabaseClient'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)

  const loadProfile = useCallback(async (userId) => {
    if (!userId) {
      setProfile(null)
      return
    }
    const { data } = await supabase.from('profiles').select('*').eq('id', userId).maybeSingle()
    setProfile(data)
  }, [])

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      loadProfile(session?.user?.id).finally(() => setLoading(false))
    })

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
      loadProfile(session?.user?.id)
    })

    return () => listener.subscription.unsubscribe()
  }, [loadProfile])

  async function signUp({ email, password, nome, dataNascimento, alturaCm, pesoInicial, metaKcalDiaria }) {
    const { data, error } = await supabase.auth.signUp({ email, password })
    if (error) throw error

    if (!data.session) {
      return { needsEmailConfirmation: true }
    }

    const userId = data.user.id

    const { error: profileError } = await supabase.from('profiles').insert({
      id: userId,
      nome,
      data_nascimento: dataNascimento,
      altura_cm: alturaCm,
      meta_kcal_diaria: metaKcalDiaria,
    })
    if (profileError) throw profileError

    const { error: weightError } = await supabase.from('weight_logs').insert({
      user_id: userId,
      peso_kg: pesoInicial,
    })
    if (weightError) throw weightError

    await loadProfile(userId)
    return { needsEmailConfirmation: false }
  }

  async function signIn({ email, password }) {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw error
  }

  async function signOut() {
    await supabase.auth.signOut()
  }

  async function updateProfile(updates) {
    const { error } = await supabase.from('profiles').update(updates).eq('id', session.user.id)
    if (error) throw error
    await loadProfile(session.user.id)
  }

  const value = {
    session,
    user: session?.user ?? null,
    profile,
    loading,
    signUp,
    signIn,
    signOut,
    updateProfile,
    refreshProfile: () => loadProfile(session?.user?.id),
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth precisa estar dentro de AuthProvider')
  return ctx
}
