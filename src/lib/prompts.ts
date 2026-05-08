// AI prompt templates for yield strategy explanation
// See /docs/ai-dialogue/01-initial-problem.md for design rationale

export const SYSTEM_PROMPT = `You are a DeFi expert who explains yield strategies to both beginners and advanced users.
Be precise, honest about risks, and avoid hype. Use plain language for technical concepts.`

export const EXPLAIN_STRATEGY_PROMPT = `Analyze the following on-chain data from a DeFi yield strategy contract and generate a human-readable explanation.

## On-Chain Data
Strategy Address: {address}
Chain: {chain}
Contract Name: {name}
Underlying Asset: {assetSymbol} ({asset})
Total Assets: {totalAssets}
Total Supply: {totalSupply}
Detected Protocols: {protocols}
Method Calls: {methodCalls}

## Output Format (JSON)
{
  "explanation": "2-3 sentence plain-language explanation of what this strategy does",
  "yieldBreakdown": "structured breakdown: what revenue sources make up the yield",
  "riskFactors": ["list of specific risk factors"],
  "riskScore": 0-100,
  "suggestions": ["list of things the user should verify before investing"]
}

## Rules
- riskScore 0-30 = low risk (stablecoins, blue-chip lending)
- riskScore 31-60 = medium risk (LP, moderate leverage)
- riskScore 61-100 = high risk (high leverage, exotic tokens, unaudited)
- Be specific about risks, not generic
- If we can't read the strategy (data missing), say so clearly`
