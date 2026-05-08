# 智能合约设计决策 — Yield Explainer

## 日期：2026-05-08

---

## 问题：合约存什么？怎么存？

### 初版方案：链上存完整解释

```solidity
mapping(address => string) public explanations;
// 地址 → 自然语言解释
```

**AI 的反对**：
> "链上存字符串（尤其是长文本）非常贵。一个 500 字的解释，Gas 可能让用户负担不起。
> 
> 而且，解释是主观的——不同 AI 可能生成不同解释，你存哪个版本的？"

---

## 改进方案：链上存 Hash + 链下存解释

```solidity
struct StrategyRecord {
    address strategy;       // 策略合约地址
    bytes32 contentHash;    // 解释内容的 Hash
    uint256 riskScore;      // 风险评分（0-100）
    uint256 timestamp;      // 时间戳
    address analyst;        // 分析者地址
    bool verified;          // 是否经过人工验证
}
```

**链下**：解释的完整内容存在 IPFS / 数据库

**链上**：只存 Hash + 元数据（风险评分 + 时间戳）

**验证流程**：
```
1. AI 生成解释
2. 计算 contentHash = keccak256(abi.encodePacked(explanation))
3. 存入合约
4. 任何人可以验证：keccak256(explanation) == storedHash
```

---

## 设计亮点

### 1. 存储成本最小化
- 只存 Hash（32 bytes），不存长文本
- Gas 成本 < 0.01 ETH（非常便宜）

### 2. 可验证性
- 任何人可以验证解释没有被篡改
- 通过 `verified` 字段，人工审核者可以"背书"某个解释

### 3. 治理扩展性
- 未来可以做 DAO 治理：社区投票决定哪个解释最准确
- `analyst` 字段记录谁提交的解释，建立信誉体系

---

## AI 协作的关键决策

| 问题 | AI 建议 | 我的决定 |
|------|---------|---------|
| 存完整文本还是存 Hash？ | 存 Hash，省 Gas | 采纳 |
| 风险评分要不要上链？ | 可以，评分是客观的 | 采纳 |
| 谁能提交解释？ | 任何人（Permissionless） | 采纳，但加 `verified` 标记 |
| 需不需要治理？ | MVP 不需要 | 采纳，先做最小可用版本 |

---

## 这个文档展示的能力

1. **我理解区块链的 Trade-off** —— 存储贵，所以存 Hash
2. **我会与 AI 讨论合约设计** —— 不是"AI 写代码我复制"，而是"讨论方案后我自己设计"
3. **我有 MVP 意识** —— 治理和 DAO 可以后续加，先做核心功能

**这才是面试官想看到的"Web3 开发能力"。**
