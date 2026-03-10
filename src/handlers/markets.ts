import { MarketInfo } from '../model'
import {
  DecodedEventData,
  getAddress,
  getUint,
  getInt,
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
  // EUR/USD [USD0-USD0]
  '0x7054eb596acf4fc1c0686c9b2cdac4ae6c6d0f33': {
    indexTokenAddress: '0x18909CC26672376e8FDF1fa54Fc5B892dd6E2b0C',
    longTokenAddress: '0x3ae4474579d24a743c9016F017e76185A834d837',
    shortTokenAddress: '0x3ae4474579d24a743c9016F017e76185A834d837',
  },
  // GBP/USD [USD0-USD0]
  '0xa09b59adf15b4ed98a099441b84ff1eabf71b548': {
    indexTokenAddress: '0xf7255EAb2968Fb6B8b6226eB25c6EDC2F1CcE60a',
    longTokenAddress: '0x3ae4474579d24a743c9016F017e76185A834d837',
    shortTokenAddress: '0x3ae4474579d24a743c9016F017e76185A834d837',
  },
  // GOLD/USD [USD0-USD0]
  '0x89c3b33bee4b9cd1b246be44adced870f74637a3': {
    indexTokenAddress: '0xf4ac308123764edFB7453a7446D01277D7DEa1A7',
    longTokenAddress: '0x3ae4474579d24a743c9016F017e76185A834d837',
    shortTokenAddress: '0x3ae4474579d24a743c9016F017e76185A834d837',
  },
  // USD/JPY [USD0-USD0]
  '0xd847a999face1f862120117c33ae8faba768fd4b': {
    indexTokenAddress: '0x7836DF766375f02D71fa3617F5F06a0712699A81',
    longTokenAddress: '0x3ae4474579d24a743c9016F017e76185A834d837',
    shortTokenAddress: '0x3ae4474579d24a743c9016F017e76185A834d837',
  },
  // WTI/USD [USD0-USD0]
  '0x80d260188c592f7f175f843edc257b6a6af6e5ef': {
    indexTokenAddress: '0x4B4A8E5a0deEC8611e647255425eC68A846046d4',
    longTokenAddress: '0x3ae4474579d24a743c9016F017e76185A834d837',
    shortTokenAddress: '0x3ae4474579d24a743c9016F017e76185A834d837',
  },
  // WBTC/USD [USD0-USD0]
  '0x63d05da932541380df8d9ee20d8fdb4b02849398': {
    indexTokenAddress: '0xD8a6E3FCA403d79b6AD6216b60527F51cc967D39',
    longTokenAddress: '0x3ae4474579d24a743c9016F017e76185A834d837',
    shortTokenAddress: '0x3ae4474579d24a743c9016F017e76185A834d837',
  },
  // WETH/USD [USD0-USD0]
  '0x23f40e3279685413b252a6944af9a0641d3aa6ce': {
    indexTokenAddress: '0x4200000000000000000000000000000000000006',
    longTokenAddress: '0x3ae4474579d24a743c9016F017e76185A834d837',
    shortTokenAddress: '0x3ae4474579d24a743c9016F017e76185A834d837',
  },
}

const MARKET_EVENT_NAMES = [
  eventKeys.POOL_AMOUNT_UPDATED,
  eventKeys.OPEN_INTEREST_UPDATED,
  eventKeys.OPEN_INTEREST_IN_TOKENS_UPDATED,
  eventKeys.SWAP_IMPACT_POOL_AMOUNT_UPDATED,
  eventKeys.POSITION_IMPACT_POOL_AMOUNT_UPDATED,
  eventKeys.MARKET_POOL_VALUE_UPDATED,
  eventKeys.MARKET_POOL_VALUE_INFO,
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
        // All markets use USD0 as both long and short token,
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

    case eventKeys.MARKET_POOL_VALUE_UPDATED:
    case eventKeys.MARKET_POOL_VALUE_INFO: {
      // poolValue is a signed int (can be negative if PnL exceeds pool)
      const poolValue = getInt(data, 'poolValue')
      if (poolValue !== undefined && poolValue > 0n) {
        marketInfo.poolValueMax = poolValue
        marketInfo.poolValueMin = poolValue
      }
      break
    }
  }

  return true
}
