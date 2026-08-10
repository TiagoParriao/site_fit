import { useEffect, useState, useCallback } from 'react'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../context/AuthContext'
import { colorForUser } from '../lib/avatarColor'

export default function Group() {
  const { user, updateProfile } = useAuth()
  const [groups, setGroups] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [info, setInfo] = useState('')

  const [novoNome, setNovoNome] = useState('')
  const [codigoEntrada, setCodigoEntrada] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    const { data: memberships } = await supabase
      .from('group_members')
      .select('group_id, groups(id, nome, invite_code, created_at)')
      .eq('user_id', user.id)

    const groupList = (memberships ?? []).map((m) => m.groups).filter(Boolean)

    const withMembers = await Promise.all(
      groupList.map(async (g) => {
        const { data: members } = await supabase
          .from('group_members')
          .select('user_id, profiles(nome, cor)')
          .eq('group_id', g.id)
        return { ...g, members: members ?? [] }
      })
    )

    setGroups(withMembers)
    setLoading(false)
  }, [user.id])

  useEffect(() => {
    load()
  }, [load])

  async function handleCreate(e) {
    e.preventDefault()
    setError('')
    setInfo('')
    const { error } = await supabase.rpc('create_group', { p_nome: novoNome })
    if (error) {
      setError(error.message)
      return
    }
    setNovoNome('')
    setInfo('Grupo criado!')
    load()
  }

  async function handleColorChange(cor) {
    try {
      await updateProfile({ cor })
      setGroups((prev) =>
        prev.map((g) => ({
          ...g,
          members: g.members.map((m) => (m.user_id === user.id ? { ...m, profiles: { ...m.profiles, cor } } : m)),
        }))
      )
    } catch (err) {
      setError(err.message)
    }
  }

  async function handleJoin(e) {
    e.preventDefault()
    setError('')
    setInfo('')
    const { error } = await supabase.rpc('join_group_by_code', { p_invite_code: codigoEntrada })
    if (error) {
      setError(error.message)
      return
    }
    setCodigoEntrada('')
    setInfo('Você entrou no grupo!')
    load()
  }

  if (loading) return <div className="page-loading">Carregando...</div>

  return (
    <div className="page">
      <h1>Grupo</h1>
      {error && <p className="error">{error}</p>}
      {info && <p className="info">{info}</p>}

      <div className="grid-2">
        <form className="card" onSubmit={handleCreate}>
          <h2>Criar grupo</h2>
          <label>
            Nome do grupo
            <input value={novoNome} onChange={(e) => setNovoNome(e.target.value)} required />
          </label>
          <button type="submit">Criar</button>
        </form>

        <form className="card" onSubmit={handleJoin}>
          <h2>Entrar com código</h2>
          <label>
            Código de convite
            <input
              value={codigoEntrada}
              onChange={(e) => setCodigoEntrada(e.target.value.toUpperCase())}
              placeholder="Ex: A1B2C3"
              required
            />
          </label>
          <button type="submit">Entrar</button>
        </form>
      </div>

      {groups.length === 0 ? (
        <p className="empty-state">Você ainda não está em nenhum grupo.</p>
      ) : (
        groups.map((g) => (
          <div className="card" key={g.id}>
            <h2>{g.nome}</h2>
            <p className="info">
              Código de convite: <strong>{g.invite_code}</strong> (compartilhe com seus amigos)
            </p>
            <ul className="member-list">
              {g.members.map((m) => (
                <li key={m.user_id} className="member-color-row">
                  <span>{m.profiles?.nome ?? 'Membro'}</span>
                  {m.user_id === user.id ? (
                    <input
                      type="color"
                      className="color-input"
                      value={colorForUser(m.user_id, m.profiles?.cor)}
                      onChange={(e) => handleColorChange(e.target.value)}
                      title="Escolha sua cor"
                    />
                  ) : (
                    <span
                      className="color-swatch"
                      style={{ background: colorForUser(m.user_id, m.profiles?.cor) }}
                    />
                  )}
                </li>
              ))}
            </ul>
          </div>
        ))
      )}
    </div>
  )
}
