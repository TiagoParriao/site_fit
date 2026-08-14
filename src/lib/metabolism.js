const FATOR_BASE_SEDENTARIO = 1.2

export function calcularIdade(dataNascimentoISO, referenciaISO) {
  const ref = new Date(`${referenciaISO}T00:00:00`)
  const nascimento = new Date(`${dataNascimentoISO}T00:00:00`)
  let idade = ref.getFullYear() - nascimento.getFullYear()
  const aindaNaoFezAniversario =
    ref.getMonth() < nascimento.getMonth() ||
    (ref.getMonth() === nascimento.getMonth() && ref.getDate() < nascimento.getDate())
  if (aindaNaoFezAniversario) idade -= 1
  return idade
}

// Mifflin-St Jeor
export function calcularTMB({ sexo, pesoKg, alturaCm, idade }) {
  const base = 10 * pesoKg + 6.25 * alturaCm - 5 * idade
  return sexo === 'M' ? base + 5 : base - 161
}

// GET do dia = TMB com fator sedentário como base + exercício reportado naquele dia,
// pra refletir a variação real (dia que treinou vs dia de descanso) em vez de um
// fator de atividade fixo que já "embutiria" o exercício e contaria ele duas vezes.
export function calcularGetDia(tmb, kcalExercicio) {
  return tmb * FATOR_BASE_SEDENTARIO + kcalExercicio
}
