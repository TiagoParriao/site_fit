import { resolvePeriodRange } from './periods'
import { MEAL_TYPES } from './mealTypes'

export async function fetchMealTypeAverages(supabase, userId, preset, opts) {
  const { start, end } = resolvePeriodRange(preset, opts)

  const { data } = await supabase
    .from('calorie_logs')
    .select('kcal, tipo_refeicao')
    .eq('user_id', userId)
    .gte('data', start)
    .lte('data', end)

  const groups = {}
  for (const row of data ?? []) {
    const key = row.tipo_refeicao || 'outro'
    groups[key] ??= { total: 0, count: 0 }
    groups[key].total += row.kcal
    groups[key].count += 1
  }

  const rows = MEAL_TYPES.map((t) => {
    const g = groups[t.key]
    return {
      key: t.key,
      label: t.label,
      registros: g?.count ?? 0,
      media: g && g.count > 0 ? Math.round(g.total / g.count) : 0,
    }
  }).filter((r) => r.registros > 0)

  return { start, end, rows }
}
