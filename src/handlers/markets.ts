import { MarketInfo } from '../model'
import {
  DecodedEventData,
  getAddress,
  getUint,
  getBool,
} from '../decoding/eventDecoder'
import * as eventKeys from '../decoding/eventKeys'

export interface EventContext {
  store: import('@subsquid/typeorm-store').Store
  block: {
    height: number
    timestamp: number  // milliseconds
  }
  log: {
    id: string
    transactionHash: string
  }
}

/**
 * Known market configurations for Base Sepolia.
 * Used to create MarketInfo entities when first encountered,
 * since MarketCreated events predate the squid's start block.
 */
const KNOWN_MARKETS: Record<string, {
  indexTokenAddress: string
  longTokenAddress: string
  shortTokenAddress: string
}> = {
  // EUR/USD [USDC-USDC]
  '0xd25daa1a1c740c070a6dc6f0287bd14398c090e4': {
    indexTokenAddress: '0x86e6ab05217318Db4A63f0361BADBf5aF0c69270',
    longTokenAddress: '0xFDDFE40Ade3eE9aDE4A2e185C750cf28025BFd6b',
    shortTokenAddress: '0xFDDFE40Ade3eE9aDE4A2e185C750cf28025BFd6b',
  },
  // GBP/USD [USDC-USDC]
  '0x36c1ef9f39f42d7e84fb054d15e4d3171b7977bf': {
    indexTokenAddress: '0x29c46a7d11B6A3051f51a47eE93AAc03a907C81e',
    longTokenAddress: '0xFDDFE40Ade3eE9aDE4A2e185C750cf28025BFd6b',
    shortTokenAddress: '0xFDDFE40Ade3eE9aDE4A2e185C750cf28025BFd6b',
  },
  // GOLD/USD [USDC-USDC]
  '0xba69c6dc7f28e1299e20d5d1d0a48529cb189980': {
    indexTokenAddress: '0xC2E2d25b96976fC054A5A262e2bc6Fbe8d9bB1e4',
    longTokenAddress: '0xFDDFE40Ade3eE9aDE4A2e185C750cf28025BFd6b',
    shortTokenAddress: '0xFDDFE40Ade3eE9aDE4A2e185C750cf28025BFd6b',
  },
  // USD/JPY [USDC-USDC]
  '0x4834b9a77b32ca7f1d8a20cf7ca886d92be98aef': {
    indexTokenAddress: '0x5E45Df87fC8f91D5Bc73B6e75D63742dbE01400A',
    longTokenAddress: '0xFDDFE40Ade3eE9aDE4A2e185C750cf28025BFd6b',
    shortTokenAddress: '0xFDDFE40Ade3eE9aDE4A2e185C750cf28025BFd6b',
  },
  // WBTC/USD [USDC-USDC]
  '0xa4c80f91f4f4b4095220048cb24186e20e48b9d4': {
    indexTokenAddress: '0xD8a6E3FCA403d79b6AD6216b60527F51cc967D39',
    longTokenAddress: '0xFDDFE40Ade3eE9aDE4A2e185C750cf28025BFd6b',
    shortTokenAddress: '0xFDDFE40Ade3eE9aDE4A2e185C750cf28025BFd6b',
  },
  // WETH/USD [USDC-USDC]
  '0x4df435e8d40740291571df779e48662c9521ed7d': {
    indexTokenAddress: '0x4200000000000000000000000000000000000006',
    longTokenAddress: '0xFDDFE40Ade3eE9aDE4A2e185C750cf28025BFd6b',
    shortTokenAddress: '0xFDDFE40Ade3eE9aDE4A2e185C750cf28025BFd6b',
  },
}

const MARKET_EVENT_NAMES = [
  eventKeys.POOL_AMOUNT_UPDATED,
  eventKeys.OPEN_INTEREST_UPDATED,
  eventKeys.OPEN_INTEREST_IN_TOKENS_UPDATED,
  eventKeys.SWAP_IMPACT_POOL_AMOUNT_UPDATED,
  eventKeys.POSITION_IMPACT_POOL_AMOUNT_UPDATED,
]

/**
 * Check if this event is a market-related event we handle
 */
export function isMarketEvent(data: DecodedEventData): boolean {
  return MARKET_EVENT_NAMES.includes(data.eventName)
}

/**
 * Get or create a MarketInfo entity for the given market address.
 * If the entity doesn't exist in the map, creates one using known config.
 */
function getOrCreateMarketInfo(
  marketAddress: string,
  marketInfos: Map<string, MarketInfo>,
  timestamp: number
): MarketInfo | null {
  const normalizedAddress = marketAddress.toLowerCase()

  const existing = marketInfos.get(normalizedAddress)
  if (existing) return existing

  const config = KNOWN_MARKETS[normalizedAddress]
  if (!config) return null

  const marketInfo = new MarketInfo({
    id: normalizedAddress,
    marketTokenAddress: marketAddress,
    indexTokenAddress: config.indexTokenAddress,
    longTokenAddress: config.longTokenAddress,
    shortTokenAddress: config.shortTokenAddress,
    isDisabled: false,

    longPoolAmount: 0n,
    shortPoolAmount: 0n,
    maxLongPoolAmount: 0n,
    maxShortPoolAmount: 0n,
    maxLongPoolUsdForDeposit: 0n,
    maxShortPoolUsdForDeposit: 0n,
    poolValueMax: 0n,
    poolValueMin: 0n,

    reserveFactorLong: 0n,
    reserveFactorShort: 0n,
    openInterestReserveFactorLong: 0n,
    openInterestReserveFactorShort: 0n,

    longOpenInterestUsd: 0n,
    shortOpenInterestUsd: 0n,
    longOpenInterestInTokens: 0n,
    shortOpenInterestInTokens: 0n,
    maxOpenInterestLong: 0n,
    maxOpenInterestShort: 0n,

    minCollateralFactor: 0n,
    minCollateralFactorForOpenInterestLong: 0n,
    minCollateralFactorForOpenInterestShort: 0n,

    fundingFactor: 0n,
    fundingExponentFactor: 0n,
    fundingIncreaseFactorPerSecond: 0n,
    fundingDecreaseFactorPerSecond: 0n,
    thresholdForStableFunding: 0n,
    thresholdForDecreaseFunding: 0n,
    minFundingFactorPerSecond: 0n,
    maxFundingFactorPerSecond: 0n,

    totalBorrowingFees: 0n,
    borrowingFactorPerSecondForLongs: 0n,
    borrowingFactorPerSecondForShorts: 0n,

    positionImpactPoolAmount: 0n,
    minPositionImpactPoolAmount: 0n,
    positionImpactPoolDistributionRate: 0n,
    swapImpactPoolAmountLong: 0n,
    swapImpactPoolAmountShort: 0n,

    positionFeeFactorForPositiveImpact: 0n,
    positionFeeFactorForNegativeImpact: 0n,
    swapFeeFactorForPositiveImpact: 0n,
    swapFeeFactorForNegativeImpact: 0n,
    atomicSwapFeeFactor: 0n,

    maxPnlFactorForTradersLong: 0n,
    maxPnlFactorForTradersShort: 0n,

    createdAt: timestamp,
    updatedAt: timestamp,
  })

  marketInfos.set(normalizedAddress, marketInfo)
  return marketInfo
}

/**
 * Handle market-related events and update MarketInfo entities.
 * Returns true if the event was handled.
 */
export function handleMarketEvent(
  ctx: EventContext,
  data: DecodedEventData,
  marketInfos: Map<string, MarketInfo>
): boolean {
  if (!isMarketEvent(data)) return false

  const marketAddress = getAddress(data, 'market')
  if (!marketAddress) return false

  const timestampSeconds = Math.floor(ctx.block.timestamp / 1000)
  const marketInfo = getOrCreateMarketInfo(marketAddress, marketInfos, timestampSeconds)
  if (!marketInfo) return false

  marketInfo.updatedAt = timestampSeconds

  switch (data.eventName) {
    case eventKeys.POOL_AMOUNT_UPDATED: {
      const nextValue = getUint(data, 'nextValue')
      if (nextValue !== undefined) {
        // All markets use USDC as both long and short token,
        // so both pools track the same single amount
        marketInfo.longPoolAmount = nextValue
        marketInfo.shortPoolAmount = nextValue
      }
      break
    }

    case eventKeys.OPEN_INTEREST_UPDATED: {
      const isLong = getBool(data, 'isLong')
      const nextOpenInterest = getUint(data, 'nextOpenInterest')
      if (nextOpenInterest !== undefined) {
        if (isLong) {
          marketInfo.longOpenInterestUsd = nextOpenInterest
        } else {
          marketInfo.shortOpenInterestUsd = nextOpenInterest
        }
      }
      break
    }

    case eventKeys.OPEN_INTEREST_IN_TOKENS_UPDATED: {
      const isLong = getBool(data, 'isLong')
      const nextOpenInterest = getUint(data, 'nextOpenInterest')
      if (nextOpenInterest !== undefined) {
        if (isLong) {
          marketInfo.longOpenInterestInTokens = nextOpenInterest
        } else {
          marketInfo.shortOpenInterestInTokens = nextOpenInterest
        }
      }
      break
    }

    case eventKeys.SWAP_IMPACT_POOL_AMOUNT_UPDATED: {
      const nextValue = getUint(data, 'nextValue')
      const token = getAddress(data, 'token')
      if (nextValue !== undefined && token) {
        const tokenLower = token.toLowerCase()
        if (tokenLower === marketInfo.longTokenAddress.toLowerCase()) {
          marketInfo.swapImpactPoolAmountLong = nextValue
        }
        if (tokenLower === marketInfo.shortTokenAddress.toLowerCase()) {
          marketInfo.swapImpactPoolAmountShort = nextValue
        }
      }
      break
    }

    case eventKeys.POSITION_IMPACT_POOL_AMOUNT_UPDATED: {
      const nextValue = getUint(data, 'nextValue')
      if (nextValue !== undefined) {
        marketInfo.positionImpactPoolAmount = nextValue
      }
      break
    }
  }

  return true
}
