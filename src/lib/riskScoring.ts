// Risk scoring algorithm
// Hybrid: rule-based (60%) + AI (40%)
// See /docs/ai-dialogue/03-risk-scoring.md (planned)

export interface RiskFactors {
  isAudited: boolean
  hasVerifiedSource: boolean
  isProxy: boolean
  tvlConcentration: 'low' | 'medium' | 'high'
  protocolCount: number
  hasLeverage: boolean
  tokenQuality: 'bluechip' | 'midcap' | 'unknown'
}

export function calculateRuleBasedRisk(factors: RiskFactors): number {
  let risk = 0

  // Audit status (-20 to +20)
  if (factors.isAudited) risk -= 20
  else risk += 15

  // Source verification
  if (factors.hasVerifiedSource) risk -= 5
  else risk += 15

  // Proxy pattern (upgrade risk)
  if (factors.isProxy) risk += 10

  // Protocol count (complexity)
  risk += Math.min(factors.protocolCount * 5, 15)

  // Leverage
  if (factors.hasLeverage) risk += 15

  // Token quality
  if (factors.tokenQuality === 'bluechip') risk -= 5
  else if (factors.tokenQuality === 'midcap') risk += 5
  else risk += 10

  // TVL concentration
  if (factors.tvlConcentration === 'high') risk += 10

  return Math.max(0, Math.min(100, risk + 50)) // 50 is baseline
}

export function getRiskLabel(score: number): { label: string; color: string } {
  if (score <= 30) return { label: 'Low Risk', color: '#22c55e' }
  if (score <= 60) return { label: 'Medium Risk', color: '#f59e0b' }
  return { label: 'High Risk', color: '#ef4444' }
}
