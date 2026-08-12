export function toLocalISO(date) {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

export function todayISO() {
  return toLocalISO(new Date())
}

export function isoDaysAgo(days) {
  const d = new Date()
  d.setDate(d.getDate() - days)
  return toLocalISO(d)
}

export function addDaysISO(dataISO, days) {
  const d = new Date(`${dataISO}T00:00:00`)
  d.setDate(d.getDate() + days)
  return toLocalISO(d)
}

export function daysInMonth(year, month) {
  return new Date(year, month, 0).getDate()
}

export function occurrenceDateForMonth(year, month, diaMes) {
  const dia = Math.min(diaMes, daysInMonth(year, month))
  return toLocalISO(new Date(year, month - 1, dia))
}
