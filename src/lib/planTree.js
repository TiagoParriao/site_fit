export function buildTree(nodes) {
  const byParent = new Map()
  for (const n of nodes) {
    const key = n.parent_id ?? 'root'
    if (!byParent.has(key)) byParent.set(key, [])
    byParent.get(key).push(n)
  }
  for (const list of byParent.values()) list.sort((a, b) => a.ordem - b.ordem)

  function attach(node) {
    return { ...node, children: (byParent.get(node.id) ?? []).map(attach) }
  }

  return (byParent.get('root') ?? []).map(attach)
}
