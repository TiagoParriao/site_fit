import { resolvePeriodRange } from './periods'

export async function fetchGroupProteinHistory(supabase, members, preset, opts) {
  const { start, end } = resolvePeriodRange(preset, opts)
  const userIds = members.map((m) => m.user_id)
  if (userIds.length === 0) return { start, end, chartDates: [], chartSeries: [] }

  const { data } = await supabase
    .from('calorie_logs')
    .select('user_id, data, proteina_g')
    .in('user_id', userIds)
    .gte('data', start)
    .lte('data', end)

  const totals = {}
  const datesSet = new Set()
  for (const row of data ?? []) {
    totals[row.user_id] ??= {}
    totals[row.user_id][row.data] = (totals[row.user_id][row.data] ?? 0) + Number(row.proteina_g ?? 0)
    datesSet.add(row.data)
  }

  const chartDates = [...datesSet].sort()
  const chartSeries = members.map((m) => {
    const dayTotals = totals[m.user_id] ?? {}
    const totalG = Object.values(dayTotals).reduce((sum, v) => sum + v, 0)
    return {
      user_id: m.user_id,
      nome: m.nome,
      cor: m.cor,
      values: chartDates.map((d) => Math.round(dayTotals[d] ?? 0)),
      totalG: Math.round(totalG),
    }
  })

  return { start, end, chartDates, chartSeries }
}
