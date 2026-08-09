import { resolvePeriodRange } from './periods'

export async function fetchGroupKcalHistory(supabase, members, preset, opts) {
  const { start, end } = resolvePeriodRange(preset, opts)
  const userIds = members.map((m) => m.user_id)
  if (userIds.length === 0) return { start, end, rows: [] }

  const { data } = await supabase
    .from('calorie_logs')
    .select('user_id, data, kcal')
    .in('user_id', userIds)
    .gte('data', start)
    .lte('data', end)

  const totals = {}
  for (const row of data ?? []) {
    totals[row.user_id] ??= {}
    totals[row.user_id][row.data] = (totals[row.user_id][row.data] ?? 0) + row.kcal
  }

  const rows = members.map((m) => {
    const meta = m.meta_kcal_diaria ?? 2000
    const dayTotals = totals[m.user_id] ?? {}
    const days = Object.entries(dayTotals)
      .map(([data, total]) => ({ data, total, diff: total - meta, over: total > meta }))
      .sort((a, b) => (a.data < b.data ? 1 : -1))

    return {
      user_id: m.user_id,
      nome: m.nome,
      meta,
      diasRegistrados: days.length,
      diasEstourados: days.filter((d) => d.over).length,
      diasEstouradosLista: days.filter((d) => d.over),
    }
  })

  return { start, end, rows }
}
