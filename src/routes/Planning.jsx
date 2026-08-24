import { useEffect, useState, useCallback } from 'react'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../context/AuthContext'
import { AnimalAvatar } from '../components/AnimalIcons'
import { colorForUser } from '../lib/avatarColor'
import PlanNode from '../components/PlanNode'
import { buildTree } from '../lib/planTree'

export default function Planning() {
  const { user, profile } = useAuth()
  const [members, setMembers] = useState([])
  const [selectedUserId, setSelectedUserId] = useState(user.id)
  const [nodes, setNodes] = useState([])
  const [loading, setLoading] = useState(true)
  const [novaPasta, setNovaPasta] = useState('')

  const loadMembers = useCallback(async () => {
    const { data: memberships } = await supabase
      .from('group_members')
      .select('joined_at, groups(id)')
      .eq('user_id', user.id)
      .order('joined_at', { ascending: false })
      .limit(1)

    const groupId = memberships?.[0]?.groups?.id
    if (!groupId) {
      setMembers([{ user_id: user.id, nome: profile?.nome ?? 'Você', avatar_key: profile?.avatar_key, cor: profile?.cor }])
      return
    }

    const { data: groupMembers } = await supabase
      .from('group_members')
      .select('user_id, profiles(nome, avatar_key, cor)')
      .eq('group_id', groupId)

    setMembers(
      (groupMembers ?? []).map((m) => ({
        user_id: m.user_id,
        nome: m.profiles?.nome ?? 'Membro',
        avatar_key: m.profiles?.avatar_key,
        cor: m.profiles?.cor,
      }))
    )
  }, [user.id, profile])

  useEffect(() => {
    loadMembers()
  }, [loadMembers])

  const loadNodes = useCallback(async () => {
    setLoading(true)
    const { data } = await supabase.from('plan_nodes').select('*').eq('user_id', selectedUserId)
    setNodes(data ?? [])
    setLoading(false)
  }, [selectedUserId])

  useEffect(() => {
    loadNodes()
  }, [loadNodes])

  async function handleAddPasta(e) {
    e.preventDefault()
    if (!novaPasta.trim()) return
    const topo = nodes.filter((n) => n.parent_id === null)
    const ordem = topo.length === 0 ? 0 : Math.max(...topo.map((n) => n.ordem)) + 1
    await supabase.from('plan_nodes').insert({ user_id: selectedUserId, parent_id: null, tipo: 'pasta', texto: novaPasta, ordem })
    setNovaPasta('')
    loadNodes()
  }

  const tree = buildTree(nodes)

  return (
    <div className="page">
      <header className="route-header">
        <span>Organização</span>
        <h1>Planejamento</h1>
        <p>Rotina, exercícios, água e cardápio — tudo organizado por pastas.</p>
      </header>

      <div className="section-tabs plan-member-tabs">
        {members.map((m) => (
          <button
            key={m.user_id}
            type="button"
            className={`section-tab${m.user_id === selectedUserId ? ' active' : ''}`}
            onClick={() => setSelectedUserId(m.user_id)}
          >
            <span className="plan-member-tab-avatar" style={{ '--member-color': colorForUser(m.user_id, m.cor) }}>
              <AnimalAvatar avatarKey={m.avatar_key} size={18} />
            </span>
            {m.nome}
          </button>
        ))}
      </div>

      <div className="card plan-tree-card">
        <form className="plan-node-add-form plan-new-root-form" onSubmit={handleAddPasta}>
          <input value={novaPasta} onChange={(e) => setNovaPasta(e.target.value)} placeholder="Nova pasta (ex: Exercícios, Rotina, Cardápio)" required />
          <button type="submit">Adicionar pasta</button>
        </form>

        {loading ? (
          <p>Carregando...</p>
        ) : tree.length === 0 ? (
          <p className="empty-state">Nenhuma pasta ainda. Crie a primeira acima.</p>
        ) : (
          <div className="plan-tree-root">
            {tree.map((node, i) => (
              <PlanNode key={node.id} node={node} siblings={tree} index={i} ownerId={selectedUserId} onChange={loadNodes} depth={0} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
