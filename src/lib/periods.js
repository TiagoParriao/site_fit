import { todayISO, isoDaysAgo, addDaysISO, toLocalISO } from './dates'

export const PERIOD_PRESETS = [
  { key: 'dia', label: 'Dia' },
  { key: 'semana', label: 'Semana' },
  { key: 'mes', label: 'Mês' },
  { key: 'ano', label: 'Ano' },
  { key: 'custom', label: 'Entre datas' },
]

// Segunda-feira da semana que contém dataISO.
function startOfWeek(dataISO) {
  const d = new Date(`${dataISO}T00:00:00`)
  const dia = d.getDay() // 0=domingo, 1=segunda, ..., 6=sábado
  const diffParaSegunda = dia === 0 ? -6 : 1 - dia
  d.setDate(d.getDate() + diffParaSegunda)
  return toLocalISO(d)
}

export function resolvePeriodRange(preset, { date, start, end } = {}) {
  const today = todayISO()
  switch (preset) {
    case 'dia':
      return { start: date || today, end: date || today }
    case 'semana': {
      // Semana de calendário (segunda a domingo), não os últimos 7 dias corridos.
      const segunda = startOfWeek(today)
      return { start: segunda, end: addDaysISO(segunda, 6) }
    }
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
