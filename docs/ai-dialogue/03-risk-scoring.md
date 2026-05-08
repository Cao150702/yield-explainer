# Risk Scoring Algorithm Design — Yield Explainer

## Date: 2026-05-08

---

## Problem: How to quantify DeFi risk?

### Root Cause
Users see "12% APY" and assume it's safe. They don't know:
- Is this 12% from lending fees (safe) or from token emissions (risky)?
- Does the strategy use leverage? How much?
- Has the protocol been audited? How recently?
- Is the TVL concentrated in one protocol?

---

## Hybrid Scoring Architecture

### Rule-Based Score (60% weight — deterministic, reproducible)

| Factor | Weight | Scoring |
|--------|--------|---------|
| Audit status | +/- 20 | Audited = -20, Not audited = +15 |
| Source verified | +/- 5 | Verified = -5, Not verified = +15 |
| Proxy pattern | +10 | Upgradeable contracts have admin risk |
| Protocol count | +5/protocol | More protocols = more complex = more risk |
| Leverage | +15 | Any leverage detected |
| Token quality | -5 to +10 | Bluechip = -5, Midcap = +5, Unknown = +10 |
| TVL concentration | +10 | Single protocol = +10 |

**Baseline**: 50 (medium risk)

**Formula**: `score = baseline + all_factors, clamped to [0, 100]`

### AI Score (40% weight — semantic, contextual)

The AI looks at the **combination** of factors and makes judgments that rules can't:
- "This strategy uses Aave (safe) but with 3x leverage on DAI (risky)" → the combination is medium-high
- "Token emissions are 80% of the yield" → yield is likely unsustainable

### Final Score

```
final_score = rule_score * 0.6 + ai_score * 0.4
```

---

## Why Not Pure AI?

1. **Reproducibility** — Same contract should get similar scores across runs
2. **Cost** — Rule-based scoring is free, AI costs tokens
3. **Trust** — Users can understand rule-based factors; AI is a black box
4. **Speed** — Rules run in <1ms; AI takes 2-5 seconds

---

## Implementation Notes

```typescript
// src/lib/riskScoring.ts
// Rule-based risk calculation — zero AI dependency

export function calculateRuleBasedRisk(factors: RiskFactors): number {
  let risk = 50 // baseline
  if (factors.isAudited) risk -= 20 else risk += 15
  if (factors.hasVerifiedSource) risk -= 5 else risk += 15
  if (factors.isProxy) risk += 10
  risk += Math.min(factors.protocolCount * 5, 15)
  if (factors.hasLeverage) risk += 15
  // ... etc
  return Math.max(0, Math.min(100, risk))
}
```

---

## This Document Shows

1. **I design before coding** — Algorithm spec before implementation
2. **I understand hybrid systems** — Rules + AI, not "everything with AI"
3. **I think about edge cases** — What if audit data is unavailable?
