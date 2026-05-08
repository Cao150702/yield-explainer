'use client'

import { useState } from 'react'

export default function Home() {
  const [address, setAddress] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<any>(null)

  const handleAnalyze = async () => {
    if (!address.startsWith('0x')) return
    setLoading(true)
    try {
      const res = await fetch('/api/explain', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ strategyAddress: address }),
      })
      const data = await res.json()
      setResult(data)
    } catch {
      setResult({ error: '分析失败' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-8">
      <div className="text-center space-y-4">
        <h2 className="text-3xl font-bold">分析 DeFi 收益策略</h2>
        <p className="text-gray-400 max-w-2xl mx-auto">
          输入策略合约地址，AI 会解析链上数据并生成自然语言解释。
          了解你的收益从哪里来，风险有多大。
        </p>
      </div>

      {/* Input */}
      <div className="flex gap-4 max-w-2xl mx-auto">
        <input
          type="text"
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          placeholder="0x... 策略合约地址"
          className="flex-1 bg-gray-900 border border-gray-700 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-green-500"
        />
        <button
          onClick={handleAnalyze}
          disabled={loading || !address.startsWith('0x')}
          className="px-6 py-3 bg-green-600 hover:bg-green-700 disabled:bg-gray-700 rounded-lg font-medium transition-colors"
        >
          {loading ? '分析中...' : '分析'}
        </button>
      </div>

      {/* Results */}
      {result && !result.error && (
        <div className="space-y-6">
          {/* Risk Score */}
          {result.riskScore && (
            <div className="bg-gray-900 border border-gray-700 rounded-lg p-6">
              <h3 className="text-lg font-bold mb-3">⚠️ 风险评分</h3>
              <div className="flex items-center gap-4">
                <div className="text-4xl font-bold" style={{
                  color: result.riskScore > 70 ? '#ef4444' : result.riskScore > 40 ? '#f59e0b' : '#22c55e'
                }}>
                  {result.riskScore}/100
                </div>
                <span className="text-gray-400">
                  {result.riskScore > 70 ? '高风险' : result.riskScore > 40 ? '中风险' : '低风险'}
                </span>
              </div>
            </div>
          )}

          {/* Yield Breakdown */}
          {result.yieldBreakdown && (
            <div className="bg-gray-900 border border-gray-700 rounded-lg p-6">
              <h3 className="text-lg font-bold mb-3">📊 收益来源分解</h3>
              <pre className="text-sm text-gray-300 whitespace-pre-wrap">{result.yieldBreakdown}</pre>
            </div>
          )}

          {/* Explanation */}
          {result.explanation && (
            <div className="bg-gray-900 border border-gray-700 rounded-lg p-6">
              <h3 className="text-lg font-bold mb-3">📝 策略解释</h3>
              <p className="text-gray-300 leading-relaxed">{result.explanation}</p>
            </div>
          )}
        </div>
      )}

      {result?.error && (
        <div className="text-center text-red-400">{result.error}</div>
      )}

      {/* How it works */}
      <div className="border-t border-gray-800 pt-8">
        <h3 className="text-xl font-bold mb-6 text-center">工作原理</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {[
            { step: '1', title: '读取链上数据', desc: 'viem 读取策略合约的公开方法和事件' },
            { step: '2', title: '结构化解析', desc: '识别资金流向：借贷/LP/杠杆/奖励' },
            { step: '3', title: 'AI 解释生成', desc: 'GPT-4o 把链上数据翻译成自然语言' },
            { step: '4', title: '链上存证', desc: '解释 Hash 存入智能合约，可验证不可篡改' },
          ].map(item => (
            <div key={item.step} className="bg-gray-900 border border-gray-700 rounded-lg p-4">
              <div className="text-2xl font-bold text-green-500 mb-2">{item.step}</div>
              <h4 className="font-bold mb-1">{item.title}</h4>
              <p className="text-sm text-gray-400">{item.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
