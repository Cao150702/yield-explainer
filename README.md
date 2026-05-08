# Yield Explainer 🌿

> "让 DeFi 不再是一个黑盒——AI 驱动的收益策略解释器"

## 问题定义

### 现状
DeFi 收益聚合器（Yearn、Beefy、Autofarm 等）的用户界面通常只显示一个 APY 数字：

```
存入 USDC → 年化收益 12.3% ✅
```

但用户完全不知道：
- 这个收益从哪里来？
- 策略有没有风险？
- 为什么今天 APY 是 12%，明天变成 5%？

**结果**：用户盲目存入，遇到策略亏损时措手不及。

---

## 产品方案

Yield Explainer 是一个 **DeFi 收益策略透明化工具**：

1. **智能合约集成**：读取收益聚合器的策略合约
2. **AI 解释器**：把合约逻辑翻译成自然语言
3. **风险评分**：基于策略组成（借贷/LP/杠杆）给出风险评分
4. **收益来源分解**：展示 APY 的组成部分（交易费 / 代币奖励 / 杠杆）

### 核心功能

| 功能 | 说明 |
|------|------|
| 🔍 策略解析 | 输入策略合约地址，输出自然语言解释 |
| 📊 收益分解 | APY = 交易费 X% + 代币奖励 Y% + 杠杆放大 Z 倍 |
| ⚠️ 风险评分 | 0-100 分，基于策略复杂度 + 审计状态 + TVL 集中度 |
| 📰 策略变更通知 | 策略合约升级时，AI 生成"变更说明" |
| 🌐 多链支持 | Ethereum / Polygon / BSC / Arbitrum |

---

## 技术架构

```
用户地址/策略合约地址
  ↓
链上数据读取（viem）
  ↓
策略合约 AB就业解析
  ↓
AI 解释生成（GPT-4o）
  ↓
前端展示（Next.js + wagmi）
```

### 智能合约

本项目的核心是一个 **解释器合约**（可选，链上验证）：

```solidity
// contracts/YieldExplainer.sol
// 存储已验证的策略解释（链上透明化）
struct StrategyExplanation {
    address strategy;
    string naturalLanguage;  // "该策略将 80% 资金存入 Aave，20% 做 ETH/USDC LP..."
    uint256 riskScore;
    uint256 lastUpdate;
}
```

---

## AI 协作记录

详见 `/docs/ai-dialogue/`：

- [01-initial-problem.md](docs/ai-dialogue/01-initial-problem.md) — 问题定义：DeFi 黑盒问题
- [02-contract-design.md](docs/ai-dialogue/02-contract-design.md) — 智能合约设计决策
- [03-risk-scoring.md](docs/ai-dialogue/03-risk-scoring.md) — 风险评分算法设计

---

## 技术栈

- **Smart Contract**: Solidity + Hardhat + OpenZeppelin
- **Frontend**: Next.js 14 + TypeScript + wagmi v2 + Tailwind CSS
- **Blockchain Interaction**: viem /wagmi
- **AI Layer**: OpenAI GPT-4o（策略解释生成）
- **Deploy**: Vercel（前端）+ Alchemy（RPC）

---

## 快速开始

```bash
# 安装依赖
npm install

# 运行前端
cd src && npm run dev

# 部署合约（可选）
npx hardhat run scripts/deploy.ts --network sepolia
```

---

## 项目结构

```
contracts/
├── YieldExplainer.sol    # 策略解释存储合约
└── RiskOracle.sol        # 风险评分预言机（可选）

src/
├── app/
│   ├── page.tsx          # 首页（输入策略地址）
│   ├── strategy/[address] # 策略详情页
│   └── api/
│       └── explain/      # AI 解释生成 API
├── components/
│   ├── StrategyInput.tsx # 地址输入
│   ├── YieldBreakdown.tsx # 收益分解图表
│   └── RiskMeter.tsx    # 风险评分组件
└── lib/
    ├── chainReader.ts    # 链上数据读取
    └── prompts.ts       # AI 提示词模板
```

---

## 为什么这个项目能展示我的能力

| 能力维度 | 展示方式 |
|---------|---------|
| 问题定义 | 指出 DeFi 的"黑盒"问题，不是"做一个 yield aggregator" |
| 逻辑思维 | 策略解析 → 收益分解 → 风险评分的链路设计 |
| 产品能力 | 不只做合约，还有完整的前端 + 用户体验 |
| AI协作 | `/docs/ai-dialogue/` 展示合约设计和风险算法的协作过程 |
| Web3 能力 | Solidity + wagmi + viem，完整的 Web3 技术栈 |

---

## Author

[@Cao150702](https://github.com/Cao150702) — 正在寻找 Web3 / 全栈开发机会 🚀
