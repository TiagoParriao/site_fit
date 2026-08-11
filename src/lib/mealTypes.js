export const MEAL_TYPES = [
  { key: 'cafe_da_manha', label: 'Café da manhã' },
  { key: 'almoco', label: 'Almoço' },
  { key: 'lanche', label: 'Lanche' },
  { key: 'janta', label: 'Janta' },
  { key: 'ceia', label: 'Ceia' },
  { key: 'outro', label: 'Outro' },
]

export function mealTypeLabel(key) {
  return MEAL_TYPES.find((m) => m.key === key)?.label ?? 'Outro'
}

export function suggestMealType(horaHHMM) {
  const hour = Number((horaHHMM || '').slice(0, 2))
  if (hour >= 5 && hour < 10) return 'cafe_da_manha'
  if (hour >= 10 && hour < 14) return 'almoco'
  if (hour >= 14 && hour < 18) return 'lanche'
  if (hour >= 18 && hour < 22) return 'janta'
  return 'ceia'
}
