export function weekdayLabel(dataISO) {
  const d = new Date(`${dataISO}T00:00:00`)
  const label = d.toLocaleDateString('pt-BR', { weekday: 'short' }).replace('.', '')
  return label.charAt(0).toUpperCase() + label.slice(1)
}

export function shortDateLabel(dataISO) {
  return new Date(`${dataISO}T00:00:00`).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })
}

export function niceMax(value, step) {
  return Math.max(step * 2, Math.ceil(Math.max(value, 1) / step) * step)
}

export function axisTicks(max, step) {
  const ticks = []
  for (let v = 0; v <= max; v += step) ticks.push(v)
  return ticks
}
