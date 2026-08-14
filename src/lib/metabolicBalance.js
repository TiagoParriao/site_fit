import { todayISO, isoDaysAgo } from './dates'
import { calcularIdade, calcularTMB, calcularGetDia } from './metabolism'

// Saldo dos últimos 7 dias (mesma janela usada em toda a "Semana" do app),
// com base na TMB real da pessoa em vez da meta fixa de kcal.
export async function fetchWeeklyMetabolicBalance(supabase, userId, profile) {
  if (!profile?.sexo || !profile?.altura_cm || !profile?.data_nascimento) return null

  const { data: pesoRow } = await supabase
    .from('weight_logs')
    .select('peso_kg')
    .eq('user_id', userId)
    .order('data', { ascending: false })
    .limit(1)
    .maybeSingle()
  if (!pesoRow) return null

  const start = isoDaysAgo(6)
  const end = todayISO()

  const [{ data: caloriaRows }, { data: exercicioRows }] = await Promise.all([
    supabase.from('calorie_logs').select('kcal, data').eq('user_id', userId).gte('data', start).lte('data', end),
    supabase.from('exercise_logs').select('kcal_gasta, data').eq('user_id', userId).gte('data', start).lte('data', end),
  ])

  const idade = calcularIdade(profile.data_nascimento, end)
  const tmb = calcularTMB({
    sexo: profile.sexo,
    pesoKg: Number(pesoRow.peso_kg),
    alturaCm: Number(profile.altura_cm),
    idade,
  })

  const consumidoPorDia = {}
  ;(caloriaRows ?? []).forEach((r) => {
    consumidoPorDia[r.data] = (consumidoPorDia[r.data] || 0) + r.kcal
  })
  const exercicioPorDia = {}
  ;(exercicioRows ?? []).forEach((r) => {
    exercicioPorDia[r.data] = (exercicioPorDia[r.data] || 0) + r.kcal_gasta
  })

  const dias = []
  for (let i = 6; i >= 0; i--) {
    const data = isoDaysAgo(i)
    const consumido = consumidoPorDia[data] || 0
    const exercicio = exercicioPorDia[data] || 0
    const getDia = calcularGetDia(tmb, exercicio)
    dias.push({ data, consumido, exercicio, getDia, saldo: getDia - consumido })
  }

  return {
    tmb,
    idade,
    dias,
    saldoHoje: dias[dias.length - 1].saldo,
    acumuladoSemana: dias.reduce((sum, d) => sum + d.saldo, 0),
  }
}
