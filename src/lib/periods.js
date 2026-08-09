export const PERIOD_PRESETS = [
  { key: 'dia', label: 'Dia' },
  { key: 'semana', label: 'Semana' },
  { key: 'mes', label: 'Mês' },
  { key: 'ano', label: 'Ano' },
  { key: 'custom', label: 'Entre datas' },
]

function todayISO() {
  return new Date().toISOString().slice(0, 10)
}

function isoDaysAgo(days) {
  const d = new Date()
  d.setDate(d.getDate() - days)
  return d.toISOString().slice(0, 10)
}

export function resolvePeriodRange(preset, { date, start, end } = {}) {
  const today = todayISO()
  switch (preset) {
    case 'dia':
      return { start: date || today, end: date || today }
    case 'semana':
      return { start: isoDaysAgo(6), end: today }
    case 'mes':
      return { start: isoDaysAgo(29), end: today }
    case 'ano':
      return { start: isoDaysAgo(364), end: today }
    case 'custom':
      return { start: start || today, end: end || today }
    default:
      return { start: today, end: today }
  }
}
