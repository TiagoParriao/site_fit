import { resolvePeriodRange } from './periods'

export async function fetchExerciseHistory(supabase, userId, preset, opts) {
  const { start, end } = resolvePeriodRange(preset, opts)

  const { data } = await supabase
    .from('exercise_logs')
    .select('data, minutos, kcal_gasta')
    .eq('user_id', userId)
    .gte('data', start)
    .lte('data', end)

  const totals = {}
  for (const row of data ?? []) {
    totals[row.data] ??= { data: row.data, minutos: 0, kcal_gasta: 0 }
    totals[row.data].minutos += row.minutos
    totals[row.data].kcal_gasta += row.kcal_gasta
  }

  const days = Object.values(totals).sort((a, b) => (a.data < b.data ? -1 : 1))
  return { start, end, days }
}
