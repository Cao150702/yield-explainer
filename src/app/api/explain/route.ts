import { type NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'
import { readStrategyOnChain } from '@/lib/chainReader'
import { SYSTEM_PROMPT, EXPLAIN_STRATEGY_PROMPT } from '@/lib/prompts'
import { calculateRuleBasedRisk, type RiskFactors } from '@/lib/riskScoring'

const openai = new OpenAI()

export async function POST(request: NextRequest) {
  try {
    const { strategyAddress, chain } = await request.json()

    if (!strategyAddress || !strategyAddress.startsWith('0x')) {
      return NextResponse.json({ error: 'Valid strategy address required (0x...)' }, { status: 400 })
    }

    // Step 1: Read on-chain data
    let chainData
    try {
      chainData = await readStrategyOnChain(strategyAddress as `0x${string}`, chain || 'sepolia')
    } catch (err: any) {
      return NextResponse.json({ error: `Failed to read on-chain data: ${err.message}` }, { status: 500 })
    }

    // Step 2: Rule-based risk score
    const riskFactors: RiskFactors = {
      isAudited: false, // Would need external data source
      hasVerifiedSource: true, // Assume verified on Etherscan by default
      isProxy: false, // Would need bytecode analysis
      tvlConcentration: 'medium',
      protocolCount: chainData.detectedProtocols.length || 1,
      hasLeverage: false, // Would need deeper analysis
      tokenQuality: chainData.detectedProtocols.length > 0 ? 'bluechip' : 'unknown',
    }
    const ruleRiskScore = calculateRuleBasedRisk(riskFactors)

    // Step 3: AI explanation
    const prompt = EXPLAIN_STRATEGY_PROMPT
      .replace('{address}', chainData.strategy.address)
      .replace('{chain}', chainData.strategy.chain)
      .replace('{name}', chainData.strategy.name)
      .replace('{assetSymbol}', chainData.strategy.assetSymbol || 'Unknown')
      .replace('{asset}', chainData.strategy.asset || 'Unknown')
      .replace('{totalAssets}', chainData.strategy.totalAssets?.toString() || 'N/A')
      .replace('{totalSupply}', chainData.strategy.totalSupply?.toString() || 'N/A')
      .replace('{protocols}', chainData.detectedProtocols.join(', ') || 'Unknown')
      .replace('{methodCalls}', chainData.rawMethodCalls.join('\n'))

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: prompt },
      ],
      temperature: 0.4,
      response_format: { type: 'json_object' },
      max_tokens: 1000,
    })

    const aiResult = JSON.parse(completion.choices[0].message.content || '{}')

    // Step 4: Hybrid risk score (rule 60% + AI 40%)
    const aiRiskScore = aiResult.riskScore || 50
    const finalRiskScore = Math.round(ruleRiskScore * 0.6 + aiRiskScore * 0.4)

    return NextResponse.json({
      // Chain data
      chainData: {
        name: chainData.strategy.name,
        asset: chainData.strategy.asset,
        assetSymbol: chainData.strategy.assetSymbol,
        totalAssets: chainData.strategy.totalAssets?.toString(),
        totalSupply: chainData.strategy.totalSupply?.toString(),
        chain: chainData.strategy.chain,
        protocols: chainData.detectedProtocols,
        methodCalls: chainData.rawMethodCalls,
      },
      // AI analysis
      explanation: aiResult.explanation,
      yieldBreakdown: aiResult.yieldBreakdown,
      riskFactors: aiResult.riskFactors,
      riskScore: finalRiskScore,
      ruleRiskScore,
      aiRiskScore,
      suggestions: aiResult.suggestions,
    })
  } catch (error) {
    console.error('Yield analysis error:', error)
    return NextResponse.json({ error: 'Analysis failed' }, { status: 500 })
  }
}
