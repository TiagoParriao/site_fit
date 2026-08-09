export function getWeekDates(reference = new Date()) {
  const day = reference.getDay()
  const diffToMonday = (day + 6) % 7
  const monday = new Date(reference)
  monday.setDate(reference.getDate() - diffToMonday)
  monday.setHours(0, 0, 0, 0)

  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday)
    d.setDate(monday.getDate() + i)
    return d.toISOString().slice(0, 10)
  })
}

function getReachDate(metByDay, dates, goalDays) {
  let count = 0
  for (let i = 0; i < metByDay.length; i++) {
    if (metByDay[i]) count++
    if (count >= goalDays) return dates[i]
  }
  return null
}

export async function fetchWeeklyProgress(supabase, members, goalDays = 5) {
  const dates = getWeekDates()
  const userIds = members.map((m) => m.user_id)
  if (userIds.length === 0) return {}

  const { data: rows } = await supabase
    .from('calorie_logs')
    .select('user_id, data, kcal')
    .in('user_id', userIds)
    .gte('data', dates[0])
    .lte('data', dates[6])

  const totals = {}
  for (const row of rows ?? []) {
    totals[row.user_id] ??= {}
    totals[row.user_id][row.data] = (totals[row.user_id][row.data] ?? 0) + row.kcal
  }

  const result = {}
  for (const member of members) {
    const meta = member.meta_kcal_diaria ?? 2000
    const metByDay = dates.map((date) => {
      const total = totals[member.user_id]?.[date] ?? 0
      return total > 0 && total <= meta
    })
    const daysMet = metByDay.filter(Boolean).length
    result[member.user_id] = {
      dates,
      metByDay,
      daysMet,
      reachDate: getReachDate(metByDay, dates, goalDays),
    }
  }
  return result
}
