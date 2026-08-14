import { todayISO, addDaysISO, toLocalISO } from './dates'

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

function startOfMonth(dataISO) {
  const d = new Date(`${dataISO}T00:00:00`)
  return toLocalISO(new Date(d.getFullYear(), d.getMonth(), 1))
}

function endOfMonth(dataISO) {
  const d = new Date(`${dataISO}T00:00:00`)
  return toLocalISO(new Date(d.getFullYear(), d.getMonth() + 1, 0))
}

function startOfYear(dataISO) {
  const d = new Date(`${dataISO}T00:00:00`)
  return toLocalISO(new Date(d.getFullYear(), 0, 1))
}

function endOfYear(dataISO) {
  const d = new Date(`${dataISO}T00:00:00`)
  return toLocalISO(new Date(d.getFullYear(), 11, 31))
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
    case 'mes': {
      // Mês de calendário (dia 1 até o último dia do mês escolhido, ou o atual por padrão).
      const ref = date || today
      return { start: startOfMonth(ref), end: endOfMonth(ref) }
    }
    case 'ano': {
      // Ano de calendário (1º de janeiro até 31 de dezembro do ano escolhido, ou o atual por padrão).
      const ref = date || today
      return { start: startOfYear(ref), end: endOfYear(ref) }
    }
    case 'custom':
      return { start: start || today, end: end || today }
    default:
      return { start: today, end: today }
  }
}
