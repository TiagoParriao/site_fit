import { occurrenceDateForMonth, addDaysISO, daysInMonth } from './dates'

export async function materializeSubscriptions(supabase, userId, subscriptions, mesAtualISO) {
  const ativas = subscriptions.filter((s) => s.ativa)
  if (ativas.length === 0) return

  const [year, month] = mesAtualISO.split('-').map(Number)
  const monthEnd = addDaysISO(mesAtualISO, daysInMonth(year, month) - 1)

  const { data: existentes } = await supabase
    .from('finance_logs')
    .select('subscription_id')
    .eq('user_id', userId)
    .not('subscription_id', 'is', null)
    .gte('data', mesAtualISO)
    .lte('data', monthEnd)

  const jaMaterializadas = new Set((existentes ?? []).map((e) => e.subscription_id))

  const toInsert = []
  for (const sub of ativas) {
    if (jaMaterializadas.has(sub.id)) continue
    const occurrence = occurrenceDateForMonth(year, month, sub.dia_mes)
    if (occurrence < sub.data_inicio) continue
    toInsert.push({
      user_id: userId,
      tipo: sub.tipo,
      valor: sub.valor,
      categoria: sub.categoria,
      forma_pagamento: sub.tipo === 'despesa' ? sub.forma_pagamento : null,
      classe: sub.tipo === 'despesa' ? sub.classe : null,
      descricao: sub.descricao,
      data: occurrence,
      subscription_id: sub.id,
    })
  }

  if (toInsert.length > 0) {
    await supabase.from('finance_logs').insert(toInsert)
  }
}
