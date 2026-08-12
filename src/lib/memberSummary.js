import { resolvePeriodRange } from './periods'

export async function fetchMemberSummary(supabase, userId, preset, opts) {
  const { start, end } = resolvePeriodRange(preset, opts)

  const [weightRes, measurementRes, calorieRes, exerciseRes] = await Promise.all([
    supabase
      .from('weight_logs')
      .select('peso_kg, data')
      .eq('user_id', userId)
      .gte('data', start)
      .lte('data', end)
      .order('data', { ascending: true }),
    supabase
      .from('measurement_logs')
      .select('nome, valor_cm, data')
      .eq('user_id', userId)
      .gte('data', start)
      .lte('data', end)
      .order('data', { ascending: true }),
    supabase.from('calorie_logs').select('kcal, data, tipo_refeicao').eq('user_id', userId).gte('data', start).lte('data', end),
    supabase.from('exercise_logs').select('minutos, kcal_gasta, data').eq('user_id', userId).gte('data', start).lte('data', end),
  ])

  const pesoLogs = weightRes.data ?? []
  const peso = {
    logs: pesoLogs,
    inicial: pesoLogs[0]?.peso_kg ?? null,
    final: pesoLogs[pesoLogs.length - 1]?.peso_kg ?? null,
    delta: pesoLogs.length >= 2 ? pesoLogs[pesoLogs.length - 1].peso_kg - pesoLogs[0].peso_kg : null,
    registros: pesoLogs.length,
  }

  const medidaLogs = measurementRes.data ?? []
  const medidasPorNome = {}
  for (const m of medidaLogs) {
    if (!medidasPorNome[m.nome] || medidasPorNome[m.nome].data < m.data) medidasPorNome[m.nome] = m
  }
  const medidas = Object.values(medidasPorNome).sort((a, b) => a.nome.localeCompare(b.nome))

  const calorieLogs = calorieRes.data ?? []
  const diasComRegistroKcal = new Set(calorieLogs.map((c) => c.data)).size
  const totalKcal = calorieLogs.reduce((sum, c) => sum + c.kcal, 0)
  const mediaKcalDia = diasComRegistroKcal > 0 ? Math.round(totalKcal / diasComRegistroKcal) : 0

  const exerciseLogs = exerciseRes.data ?? []
  const totalMinutosExercicio = exerciseLogs.reduce((sum, e) => sum + e.minutos, 0)
  const totalKcalGasta = exerciseLogs.reduce((sum, e) => sum + e.kcal_gasta, 0)

  return {
    start,
    end,
    peso,
    medidas,
    calorias: {
      totalKcal,
      diasRegistrados: diasComRegistroKcal,
      mediaKcalDia,
      totalRefeicoes: calorieLogs.length,
    },
    exercicio: {
      totalSessoes: exerciseLogs.length,
      totalMinutos: totalMinutosExercicio,
      totalKcalGasta,
    },
  }
}
