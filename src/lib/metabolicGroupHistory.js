import { resolvePeriodRange } from './periods'
import { todayISO, addDaysISO } from './dates'
import { calcularIdade, calcularTMB, calcularGetDia } from './metabolism'

// Saldo diário (TMB + exercício do dia − consumido) de cada membro do grupo,
// no formato de série que MetabolicHistoryChart espera. Membros sem sexo
// definido, ou sem nenhum peso lançado até o fim do período, ficam de fora
// (não dá pra calcular TMB sem esses dados) e voltam em `membrosSemDados`.
export async function fetchGroupMetabolicHistory(supabase, members, preset, opts) {
  let { start, end } = resolvePeriodRange(preset, opts)
  // Hoje ainda não fechou (e a semana de calendário pode até incluir dias
  // futuros, tipo sábado/domingo antes de chegar neles), então por padrão a
  // janela nunca passa de ontem — a exceção é o preset "dia", onde a pessoa
  // escolheu aquela data explicitamente.
  const ontem = addDaysISO(todayISO(), -1)
  if (preset !== 'dia' && end > ontem) {
    end = ontem
  }

  const elegiveis = members.filter((m) => m.sexo && m.altura_cm && m.data_nascimento)
  const userIds = elegiveis.map((m) => m.user_id)
  const membrosSemDados = members.filter((m) => !(m.sexo && m.altura_cm && m.data_nascimento)).map((m) => m.nome)

  if (userIds.length === 0) return { start, end, chartDates: [], chartSeries: [], membrosSemDados }

  const hoje = todayISO()

  const [{ data: pesoRows }, { data: calRows }, { data: exRows }, { data: exHojeRows }] = await Promise.all([
    supabase
      .from('weight_logs')
      .select('user_id, peso_kg, data')
      .in('user_id', userIds)
      .lte('data', end)
      .order('data', { ascending: false }),
    supabase.from('calorie_logs').select('user_id, data, kcal').in('user_id', userIds).gte('data', start).lte('data', end),
    supabase.from('exercise_logs').select('user_id, data, kcal_gasta').in('user_id', userIds).gte('data', start).lte('data', end),
    supabase.from('exercise_logs').select('user_id, kcal_gasta').in('user_id', userIds).eq('data', hoje),
  ])

  const exercicioHojePorUsuario = {}
  for (const row of exHojeRows ?? []) {
    exercicioHojePorUsuario[row.user_id] = (exercicioHojePorUsuario[row.user_id] ?? 0) + row.kcal_gasta
  }

  const pesoPorUsuario = {}
  for (const row of pesoRows ?? []) {
    if (!(row.user_id in pesoPorUsuario)) pesoPorUsuario[row.user_id] = Number(row.peso_kg)
  }

  const consumidoPorUsuarioDia = {}
  const datesSet = new Set()
  for (const row of calRows ?? []) {
    consumidoPorUsuarioDia[row.user_id] ??= {}
    consumidoPorUsuarioDia[row.user_id][row.data] = (consumidoPorUsuarioDia[row.user_id][row.data] ?? 0) + row.kcal
    datesSet.add(row.data)
  }
  const exercicioPorUsuarioDia = {}
  for (const row of exRows ?? []) {
    exercicioPorUsuarioDia[row.user_id] ??= {}
    exercicioPorUsuarioDia[row.user_id][row.data] = (exercicioPorUsuarioDia[row.user_id][row.data] ?? 0) + row.kcal_gasta
    datesSet.add(row.data)
  }

  const chartDates = [...datesSet].sort()

  const chartSeries = elegiveis
    .filter((m) => pesoPorUsuario[m.user_id] != null)
    .map((m) => {
      const idade = calcularIdade(m.data_nascimento, end)
      const tmb = calcularTMB({ sexo: m.sexo, pesoKg: pesoPorUsuario[m.user_id], alturaCm: Number(m.altura_cm), idade })
      let totalGet = 0
      const values = chartDates.map((d) => {
        const consumido = consumidoPorUsuarioDia[m.user_id]?.[d] ?? 0
        const exercicio = exercicioPorUsuarioDia[m.user_id]?.[d] ?? 0
        const getDia = calcularGetDia(tmb, exercicio)
        totalGet += getDia
        return Math.round(getDia - consumido)
      })
      const getHoje = calcularGetDia(tmb, exercicioHojePorUsuario[m.user_id] ?? 0)
      return { user_id: m.user_id, nome: m.nome, cor: m.cor, values, totalGet: Math.round(totalGet), getHoje }
    })

  const semPeso = elegiveis.filter((m) => pesoPorUsuario[m.user_id] == null).map((m) => m.nome)

  return { start, end, chartDates, chartSeries, membrosSemDados: [...membrosSemDados, ...semPeso] }
}
