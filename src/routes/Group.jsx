import { useEffect, useState, useCallback } from 'react'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../context/AuthContext'
import { colorForUser } from '../lib/avatarColor'
import MemberProfileModal from '../components/MemberProfileModal'

export default function Group() {
  const { user, updateProfile } = useAuth()
  const [groups, setGroups] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [info, setInfo] = useState('')
  const [selectedMember, setSelectedMember] = useState(null)

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
      <header className="route-header">
        <span>Nossa equipe</span>
        <h1>Grupo</h1>
        <p>Evoluir junto deixa o caminho mais leve.</p>
      </header>
      {error && <p className="error">{error}</p>}
      {info && <p className="info">{info}</p>}

      <div className="grid-2 group-actions-real">
        <form className="card group-action-card" onSubmit={handleCreate}>
          <h2>Criar grupo</h2>
          <label>
            Nome do grupo
            <input value={novoNome} onChange={(e) => setNovoNome(e.target.value)} required />
          </label>
          <button type="submit">Criar</button>
        </form>

        <form className="card group-action-card" onSubmit={handleJoin}>
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
          <div className="card group-card-real" key={g.id}>
            <div className="group-hero-real">
              <div><span className="section-kicker">Seu grupo</span><h2>{g.nome}</h2><p>{g.members.length} {g.members.length === 1 ? 'membro' : 'membros'} acompanhando juntos</p></div>
              <div className="invite-code-real"><span>Código de convite</span><strong>{g.invite_code}</strong></div>
            </div>
            <div className="card-heading-real members-heading-real"><div><h3>Membros</h3><p>Clique em alguém para ver o resumo do período.</p></div></div>
            <ul className="member-list member-list-real">
              {g.members.map((m) => (
                <li key={m.user_id} className="member-color-row">
                  <button
                    type="button"
                    className="link-button"
                    onClick={() => setSelectedMember({ user_id: m.user_id, nome: m.profiles?.nome ?? 'Membro' })}
                  >
                    {m.profiles?.nome ?? 'Membro'}
                  </button>
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

      {selectedMember && <MemberProfileModal member={selectedMember} onClose={() => setSelectedMember(null)} />}
    </div>
  )
}
