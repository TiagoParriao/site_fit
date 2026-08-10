export async function fetchMeasurements(supabase, userId) {
  const { data } = await supabase
    .from('measurement_logs')
    .select('*')
    .eq('user_id', userId)
    .order('data', { ascending: false })
  return data ?? []
}

export function latestByName(logs) {
  const latest = {}
  for (const log of logs) {
    if (!latest[log.nome] || latest[log.nome].data < log.data) latest[log.nome] = log
  }
  return Object.values(latest).sort((a, b) => a.nome.localeCompare(b.nome))
}

export function historyForName(logs, nome) {
  return logs.filter((l) => l.nome === nome).sort((a, b) => (a.data < b.data ? -1 : 1))
}
