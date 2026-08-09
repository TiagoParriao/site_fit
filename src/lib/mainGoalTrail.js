export async function fetchGroupMainGoals(supabase, userIds) {
  if (userIds.length === 0) return {}

  const { data: rows } = await supabase
    .from('main_goals')
    .select('*')
    .in('user_id', userIds)
    .order('created_at', { ascending: false })

  const latestByUser = {}
  for (const row of rows ?? []) {
    latestByUser[row.user_id] ??= row
  }
  return latestByUser
}

function diaAtual(dataInicio) {
  const inicio = new Date(`${dataInicio}T00:00:00`)
  const hoje = new Date()
  hoje.setHours(0, 0, 0, 0)
  const diff = Math.floor((hoje - inicio) / (1000 * 60 * 60 * 24))
  return diff + 1
}

export function buildMainGoalLanes(members, goalsByUser) {
  const lanes = members
    .filter((m) => goalsByUser[m.user_id])
    .map((m) => {
      const goal = goalsByUser[m.user_id]
      const dia = Math.min(Math.max(diaAtual(goal.data_inicio), 0), goal.dias_totais)
      const pct = goal.dias_totais > 0 ? Math.min(100, (dia / goal.dias_totais) * 100) : 0
      const concluida = dia >= goal.dias_totais
      return {
        user_id: m.user_id,
        nome: m.nome,
        pct,
        label: concluida ? `${goal.titulo} — concluída 🎉` : `${goal.titulo} — dia ${dia} de ${goal.dias_totais}`,
      }
    })
    .sort((a, b) => b.pct - a.pct)

  return lanes.map((lane, i) => ({ ...lane, rank: i + 1 }))
}
