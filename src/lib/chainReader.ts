// On-chain data reader using viem
// Reads strategy contract methods and events

import { createPublicClient, http, type Address } from 'viem'
import { sepolia, polygonAmoy } from 'viem/chains'

// Common DeFi protocol ABIs (minimal)
const ERC20_ABI = [
  { inputs: [], name: 'symbol', outputs: [{ type: 'string' }], stateMutability: 'view', type: 'function' },
  { inputs: [], name: 'decimals', outputs: [{ type: 'uint8' }], stateMutability: 'view', type: 'function' },
  { inputs: [], name: 'totalSupply', outputs: [{ type: 'uint256' }], stateMutability: 'view', type: 'function' },
  { inputs: [{ name: 'account', type: 'address' }], name: 'balanceOf', outputs: [{ type: 'uint256' }], stateMutability: 'view', type: 'function' },
] as const

const VAULT_ABI = [
  { inputs: [], name: 'totalAssets', outputs: [{ type: 'uint256' }], stateMutability: 'view', type: 'function' },
  { inputs: [], name: 'totalSupply', outputs: [{ type: 'uint256' }], stateMutability: 'view', type: 'function' },
  { inputs: [], name: 'asset', outputs: [{ type: 'address' }], stateMutability: 'view', type: 'function' },
  { inputs: [], name: 'name', outputs: [{ type: 'string' }], stateMutability: 'view', type: 'function' },
] as const

// Chain clients
const clients: Record<string, any> = {
  sepolia: createPublicClient({ chain: sepolia, transport: http() }),
  polygon: createPublicClient({ chain: polygonAmoy, transport: http() }),
}

function getClient(chain: string) {
  return clients[chain] || clients.sepolia
}

export interface StrategyData {
  address: Address
  name: string
  asset: Address | null
  assetSymbol: string | null
  totalAssets: bigint | null
  totalSupply: bigint | null
  tvl: number | null
  chain: string
}

export interface ChainAnalysisResult {
  strategy: StrategyData
  detectedProtocols: string[]
  rawMethodCalls: string[]
}

// Detect known DeFi protocols from contract address
const KNOWN_PROTOCOLS: Record<string, { name: string; type: string }> = {
  // Aave V3
  '0x87870bca3f3fd6335c3f4ce8392d69350b4fa4e2': { name: 'Aave V3 Pool', type: 'lending' },
  // Compound V3
  '0xc3d688b66703497daa19211eedff47125bab84c2': { name: 'Compound V3 Comet', type: 'lending' },
  // Curve
  '0x6c3f90f043a72fa612cbac8115ee7e52bde6e490': { name: 'Curve 3Pool', type: 'dex' },
}

export async function readStrategyOnChain(
  strategyAddress: Address,
  chain: string = 'sepolia'
): Promise<ChainAnalysisResult> {
  const client = getClient(chain)
  const methodCalls: string[] = []
  const detectedProtocols: string[] = []

  // Check if it's a known protocol
  if (KNOWN_PROTOCOLS[strategyAddress.toLowerCase()]) {
    detectedProtocols.push(KNOWN_PROTOCOLS[strategyAddress.toLowerCase()].name)
  }

  // Try reading as an ERC4626 Vault
  let strategyData: StrategyData = {
    address: strategyAddress,
    name: 'Unknown Strategy',
    asset: null,
    assetSymbol: null,
    totalAssets: null,
    totalSupply: null,
    tvl: null,
    chain,
  }

  try {
    const name = await client.readContract({
      address: strategyAddress,
      abi: VAULT_ABI,
      functionName: 'name',
    })
    strategyData.name = name as string
    methodCalls.push(`name() => "${name}"`)
  } catch {
    methodCalls.push('name() => FAILED (not a standard vault)')
  }

  try {
    const asset = await client.readContract({
      address: strategyAddress,
      abi: VAULT_ABI,
      functionName: 'asset',
    })
    strategyData.asset = asset as Address
    methodCalls.push(`asset() => ${asset}`)

    // Read asset symbol
    try {
      const symbol = await client.readContract({
        address: asset as Address,
        abi: ERC20_ABI,
        functionName: 'symbol',
      })
      strategyData.assetSymbol = symbol as string
      methodCalls.push(`${asset}.symbol() => "${symbol}"`)
    } catch { /* ignore */ }
  } catch {
    methodCalls.push('asset() => FAILED (no asset method)')
  }

  try {
    const totalAssets = await client.readContract({
      address: strategyAddress,
      abi: VAULT_ABI,
      functionName: 'totalAssets',
    })
    strategyData.totalAssets = totalAssets as bigint
    methodCalls.push(`totalAssets() => ${totalAssets.toString()}`)
  } catch {
    methodCalls.push('totalAssets() => FAILED')
  }

  try {
    const totalSupply = await client.readContract({
      address: strategyAddress,
      abi: VAULT_ABI,
      functionName: 'totalSupply',
    })
    strategyData.totalSupply = totalSupply as bigint
    methodCalls.push(`totalSupply() => ${totalSupply.toString()}`)
  } catch {
    methodCalls.push('totalSupply() => FAILED')
  }

  return {
    strategy: strategyData,
    detectedProtocols,
    rawMethodCalls: methodCalls,
  }
}
