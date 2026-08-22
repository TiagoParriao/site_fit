import { todayISO, addDaysISO, toLocalISO } from './dates'
import { calcularIdade, calcularTMB, calcularGetDia } from './metabolism'

// Foto fixa: 7 dias completos (terminando ontem, nunca hoje — hoje ainda não
// acabou de ser lançado) + o GET estimado de hoje separado, pra não misturar
// um dado "fechado" com um em andamento.
export async function fetchWeeklyMetabolicBalance(supabase, userId, profile) {
  if (!profile?.sexo || !profile?.altura_cm || !profile?.data_nascimento) return null

  const hoje = todayISO()
  const ontem = addDaysISO(hoje, -1)
  // Não faz sentido contar dias de antes da conta existir como "deixou de consumir"
  // a GET inteira — não é que a pessoa não comeu, é que nem tinha onde lançar ainda.
  const criadoEm = profile.created_at ? toLocalISO(new Date(profile.created_at)) : null
  let start = addDaysISO(ontem, -6)
  if (criadoEm && criadoEm > start) start = criadoEm

  // As três buscas são independentes entre si (nenhuma usa o resultado da
  // outra) — rodam em paralelo em vez de esperar o peso pra só então buscar
  // calorias/exercício.
  const [{ data: pesoRow }, { data: caloriaRows }, { data: exercicioRows }] = await Promise.all([
    supabase
      .from('weight_logs')
      .select('peso_kg')
      .eq('user_id', userId)
      .lte('data', hoje)
      .order('data', { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabase.from('calorie_logs').select('kcal, data').eq('user_id', userId).gte('data', start).lte('data', hoje),
    supabase.from('exercise_logs').select('kcal_gasta, data').eq('user_id', userId).gte('data', start).lte('data', hoje),
  ])
  if (!pesoRow) return null

  const idade = calcularIdade(profile.data_nascimento, hoje)
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
  for (let data = start; data <= ontem; data = addDaysISO(data, 1)) {
    const consumido = consumidoPorDia[data] || 0
    const exercicio = exercicioPorDia[data] || 0
    const getDia = calcularGetDia(tmb, exercicio)
    dias.push({ data, consumido, exercicio, getDia, saldo: getDia - consumido })
  }

  const getHoje = calcularGetDia(tmb, exercicioPorDia[hoje] || 0)

  return {
    tmb,
    idade,
    dias,
    acumulado: dias.reduce((sum, d) => sum + d.saldo, 0),
    getHoje,
  }
}
