export const RECEITA_CATEGORIES = [
  { key: 'salario', label: 'Salário' },
  { key: 'freela', label: 'Freela / renda extra' },
  { key: 'presente', label: 'Presente' },
  { key: 'outro', label: 'Outro' },
]

export const DESPESA_CATEGORIES = [
  { key: 'moradia', label: 'Moradia (aluguel/condomínio)', classe: 'fixa' },
  { key: 'contas', label: 'Contas (internet, luz, água...)', classe: 'fixa' },
  { key: 'saude', label: 'Saúde', classe: 'fixa' },
  { key: 'educacao', label: 'Educação', classe: 'fixa' },
  { key: 'alimentacao', label: 'Alimentação', classe: 'diario' },
  { key: 'mercado', label: 'Mercado', classe: 'diario' },
  { key: 'transporte', label: 'Transporte', classe: 'diario' },
  { key: 'lazer', label: 'Lazer', classe: 'diario' },
  { key: 'pets', label: 'Pets', classe: 'diario' },
  { key: 'outro', label: 'Outro', classe: 'diario' },
]

export const FORMAS_PAGAMENTO = [
  { key: 'debito', label: 'Débito / Pix / Dinheiro' },
  { key: 'credito', label: 'Cartão de crédito' },
]

export const CLASSES_GASTO = [
  { key: 'fixa', label: 'Saída fixa' },
  { key: 'diario', label: 'Diário / variável' },
]

export function categoriesForTipo(tipo) {
  return tipo === 'receita' ? RECEITA_CATEGORIES : DESPESA_CATEGORIES
}

export function categoryLabel(tipo, key) {
  return categoriesForTipo(tipo).find((c) => c.key === key)?.label ?? key
}

export function defaultClasseForCategoria(categoria) {
  return DESPESA_CATEGORIES.find((c) => c.key === categoria)?.classe ?? 'diario'
}

export function formaPagamentoLabel(key) {
  return FORMAS_PAGAMENTO.find((f) => f.key === key)?.label ?? key
}

export function classeLabel(key) {
  return CLASSES_GASTO.find((c) => c.key === key)?.label ?? key
}
