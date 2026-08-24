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

// Ticks "redondos" pra um eixo que não começa em zero (ex: peso). Escolhe um
// passo (1, 2, 5, 10... ou 0.1, 0.2, 0.5, 1...) que dê perto de `count` linhas
// dentro do intervalo [min, max].
export function niceTicks(min, max, count = 4) {
  const span = max - min || 1
  const rawStep = span / count
  const magnitude = Math.pow(10, Math.floor(Math.log10(rawStep)))
  const residual = rawStep / magnitude
  let step
  if (residual > 5) step = 10 * magnitude
  else if (residual > 2) step = 5 * magnitude
  else if (residual > 1) step = 2 * magnitude
  else step = magnitude

  const ticks = []
  for (let v = Math.ceil(min / step) * step; v <= max + step / 1e6; v += step) {
    ticks.push(Math.round(v * 100) / 100)
  }
  return ticks
}
