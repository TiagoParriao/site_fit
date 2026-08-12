import { occurrenceDateForMonth } from './dates'

export async function materializeSubscriptions(supabase, userId, subscriptions, mesAtualISO) {
  const ativas = subscriptions.filter((s) => s.ativa)
  if (ativas.length === 0) return

  const [year, month] = mesAtualISO.split('-').map(Number)

  const toInsert = []
  for (const sub of ativas) {
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
    // onConflict casa com o índice único (subscription_id, data); ignoreDuplicates
    // faz chamadas concorrentes (ex: StrictMode remontando) não duplicarem o lançamento.
    await supabase
      .from('finance_logs')
      .upsert(toInsert, { onConflict: 'subscription_id,data', ignoreDuplicates: true })
  }
}
