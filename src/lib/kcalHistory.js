import { resolvePeriodRange } from './periods'

export async function fetchGroupKcalHistory(supabase, members, preset, opts) {
  const { start, end } = resolvePeriodRange(preset, opts)
  const userIds = members.map((m) => m.user_id)
  if (userIds.length === 0) return { start, end, rows: [], chartDates: [], chartSeries: [] }

  const [{ data }, { data: exerciseData }] = await Promise.all([
    supabase.from('calorie_logs').select('user_id, data, kcal').in('user_id', userIds).gte('data', start).lte('data', end),
    supabase.from('exercise_logs').select('user_id, kcal_gasta').in('user_id', userIds).gte('data', start).lte('data', end),
  ])

  const totals = {}
  const datesSet = new Set()
  for (const row of data ?? []) {
    totals[row.user_id] ??= {}
    totals[row.user_id][row.data] = (totals[row.user_id][row.data] ?? 0) + row.kcal
    datesSet.add(row.data)
  }

  const gastoTotals = {}
  for (const row of exerciseData ?? []) {
    gastoTotals[row.user_id] = (gastoTotals[row.user_id] ?? 0) + row.kcal_gasta
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
      cor: m.cor,
      meta,
      diasRegistrados: days.length,
      diasEstourados: days.filter((d) => d.over).length,
      diasEstouradosLista: days.filter((d) => d.over),
      totalPeriodo: days.reduce((sum, d) => sum + d.total, 0),
      totalGastoPeriodo: gastoTotals[m.user_id] ?? 0,
    }
  })

  const chartDates = [...datesSet].sort()
  const chartSeries = members.map((m) => ({
    user_id: m.user_id,
    nome: m.nome,
    cor: m.cor,
    values: chartDates.map((d) => totals[m.user_id]?.[d] ?? 0),
  }))

  return { start, end, rows, chartDates, chartSeries }
}
