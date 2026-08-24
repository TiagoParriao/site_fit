import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabaseClient'
import { PencilIcon, TrashIcon } from './icons'

export default function PlanNode({ node, siblings, index, ownerId, onChange, depth, expandCommand }) {
  const [expanded, setExpanded] = useState(false)

  useEffect(() => {
    if (expandCommand) setExpanded(expandCommand.value)
  }, [expandCommand])
  const [editing, setEditing] = useState(false)
  const [texto, setTexto] = useState(node.texto)
  const [valor, setValor] = useState(node.valor ?? '')

  const [addingTipo, setAddingTipo] = useState(null)
  const [novoTexto, setNovoTexto] = useState('')
  const [novoValor, setNovoValor] = useState('')

  const isPasta = node.tipo === 'pasta'
  const canMoveUp = index > 0
  const canMoveDown = index < siblings.length - 1

  async function handleSaveEdit(e) {
    e.preventDefault()
    await supabase.from('plan_nodes').update({ texto, valor: valor.trim() || null }).eq('id', node.id)
    setEditing(false)
    onChange()
  }

  function cancelEdit() {
    setTexto(node.texto)
    setValor(node.valor ?? '')
    setEditing(false)
  }

  async function handleDelete() {
    if (isPasta && node.children.length > 0) {
      const ok = window.confirm(`Apagar "${node.texto}" e tudo dentro dela?`)
      if (!ok) return
    }
    await supabase.from('plan_nodes').delete().eq('id', node.id)
    onChange()
  }

  async function moveSwap(otherIndex) {
    const other = siblings[otherIndex]
    if (!other) return
    await Promise.all([
      supabase.from('plan_nodes').update({ ordem: other.ordem }).eq('id', node.id),
      supabase.from('plan_nodes').update({ ordem: node.ordem }).eq('id', other.id),
    ])
    onChange()
  }

  function closeAddForm() {
    setAddingTipo(null)
    setNovoTexto('')
    setNovoValor('')
  }

  async function handleAddChild(e) {
    e.preventDefault()
    if (!novoTexto.trim()) return
    const ordem = node.children.length === 0 ? 0 : Math.max(...node.children.map((c) => c.ordem)) + 1
    await supabase.from('plan_nodes').insert({
      user_id: ownerId,
      parent_id: node.id,
      tipo: addingTipo,
      texto: novoTexto,
      valor: novoValor.trim() || null,
      ordem,
    })
    closeAddForm()
    onChange()
  }

  return (
    <div className={`plan-node plan-node-${node.tipo}`} style={{ marginLeft: depth > 0 ? 18 : 0 }}>
      <div className="plan-node-row">
        {isPasta ? (
          <button type="button" className="plan-node-toggle" onClick={() => setExpanded((v) => !v)}>
            {expanded ? '▾' : '▸'}
          </button>
        ) : (
          <span className="plan-node-bullet">•</span>
        )}

        {editing ? (
          <form className="plan-node-edit-form" onSubmit={handleSaveEdit}>
            <input value={texto} onChange={(e) => setTexto(e.target.value)} required autoFocus />
            <input value={valor} onChange={(e) => setValor(e.target.value)} placeholder="detalhe (opcional)" />
            <button type="submit">Salvar</button>
            <button type="button" className="link-button" onClick={cancelEdit}>
              Cancelar
            </button>
          </form>
        ) : (
          <>
            <span className="plan-node-label">
              <span className="plan-node-texto">{node.texto}</span>
              {node.valor && <span className="plan-node-valor">{node.valor}</span>}
            </span>
            <span className="plan-node-actions">
              <button type="button" className="icon-button" title="mover pra cima" disabled={!canMoveUp} onClick={() => moveSwap(index - 1)}>
                ▲
              </button>
              <button type="button" className="icon-button" title="mover pra baixo" disabled={!canMoveDown} onClick={() => moveSwap(index + 1)}>
                ▼
              </button>
              <button type="button" className="icon-button" title="editar" onClick={() => setEditing(true)}>
                <PencilIcon size={14} />
              </button>
              <button type="button" className="icon-button" title="remover" onClick={handleDelete}>
                <TrashIcon size={14} />
              </button>
            </span>
          </>
        )}
      </div>

      {isPasta && expanded && (
        <div className="plan-node-children">
          {node.children.map((child, i) => (
            <PlanNode
              key={child.id}
              node={child}
              siblings={node.children}
              index={i}
              ownerId={ownerId}
              onChange={onChange}
              depth={depth + 1}
              expandCommand={expandCommand}
            />
          ))}

          {addingTipo ? (
            <form className="plan-node-add-form" onSubmit={handleAddChild}>
              <input
                value={novoTexto}
                onChange={(e) => setNovoTexto(e.target.value)}
                placeholder={addingTipo === 'pasta' ? 'Nome da subpasta' : 'Item'}
                required
                autoFocus
              />
              <input value={novoValor} onChange={(e) => setNovoValor(e.target.value)} placeholder="detalhe (opcional)" />
              <button type="submit">Adicionar</button>
              <button type="button" className="link-button" onClick={closeAddForm}>
                Cancelar
              </button>
            </form>
          ) : (
            <div className="plan-node-add-buttons">
              <button type="button" className="link-button" onClick={() => setAddingTipo('pasta')}>
                + Subpasta
              </button>
              <button type="button" className="link-button" onClick={() => setAddingTipo('item')}>
                + Item
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
