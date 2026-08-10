const COLORS = ['#ff6b6b', '#4dabf7', '#51cf66', '#ffd43b', '#cc5de8', '#ff922b', '#20c997']

export function colorForUser(userId, override) {
  if (override) return override
  let hash = 0
  for (const ch of userId) hash = (hash * 31 + ch.charCodeAt(0)) % COLORS.length
  return COLORS[hash]
}
