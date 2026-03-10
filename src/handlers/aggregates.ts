import { VolumeInfo, FeesInfo, AprSnapshot, MarketInfo } from '../model'
import {
  DecodedEventData,
  getAddress,
  getUint,
} from '../decoding/eventDecoder'
import * as eventKeys from '../decoding/eventKeys'
import { EventContext } from './orders'

// USD0 has 6 decimals, price precision is 10^(30-6) = 10^24
// Fee amounts are in token terms; multiply by price and divide by price precision to get 30-decimal USD
const PRICE_PRECISION = 10n ** 24n

// Seconds per day / hour
const HOUR_SECONDS = 3600
const DAY_SECONDS = 86400

// APR precision: basis points * 10^28 (matching GMX convention for 30-decimal values)
const APR_PRECISION = 10n ** 30n
const SECONDS_PER_YEAR = 365n * 24n * 3600n

/**
 * Aggregate VolumeInfo from PositionIncrease/Decrease events.
 * Creates hourly ("1h") and total ("total") volume records per market.
 */
export function handleVolumeFromPositionEvent(
  ctx: EventContext,
  data: DecodedEventData,
  volumeInfos: Map<string, VolumeInfo>,
): void {
  if (data.eventName !== eventKeys.POSITION_INCREASE &&
      data.eventName !== eventKeys.POSITION_DECREASE) {
    return
  }

  const market = getAddress(data, 'market')
  const sizeDeltaUsd = getUint(data, 'sizeDeltaUsd')

  if (!market || !sizeDeltaUsd || sizeDeltaUsd === 0n) return

  const marketLower = market.toLowerCase()
  const timestampSeconds = Math.floor(ctx.block.timestamp / 1000)
  const hourTs = Math.floor(timestampSeconds / HOUR_SECONDS) * HOUR_SECONDS

  // Hourly volume
  const hourlyId = `${marketLower}-1h-${hourTs}`
  const existing = volumeInfos.get(hourlyId)
  if (existing) {
    existing.volumeUsd += sizeDeltaUsd
  } else {
    volumeInfos.set(hourlyId, new VolumeInfo({
      id: hourlyId,
      market: marketLower,
      period: '1h',
      volumeUsd: sizeDeltaUsd,
      timestamp: hourTs,
    }))
  }

  // Total volume
  const totalId = `${marketLower}-total-0`
  const existingTotal = volumeInfos.get(totalId)
  if (existingTotal) {
    existingTotal.volumeUsd += sizeDeltaUsd
  } else {
    volumeInfos.set(totalId, new VolumeInfo({
      id: totalId,
      market: marketLower,
      period: 'total',
      volumeUsd: sizeDeltaUsd,
      timestamp: 0,
    }))
  }
}

/**
 * Aggregate FeesInfo from PositionFeesCollected events.
 * Creates daily ("1d") and total ("total") fee records.
 *
 * Fee amounts arrive in collateral token terms. We convert to USD using the
 * collateral token price included in the same event.
 */
export function handleFeesFromPositionFeesEvent(
  ctx: EventContext,
  data: DecodedEventData,
  feesInfos: Map<string, FeesInfo>,
): void {
  if (data.eventName !== eventKeys.POSITION_FEES_COLLECTED) return

  const positionFeeAmount = getUint(data, 'positionFeeAmount') ?? 0n
  const borrowingFeeAmount = getUint(data, 'borrowingFeeAmount') ?? 0n
  const fundingFeeAmount = getUint(data, 'fundingFeeAmount') ?? 0n
  const collateralTokenPriceMin = getUint(data, 'collateralTokenPrice.min')

  if (!collateralTokenPriceMin || collateralTokenPriceMin === 0n) return

  // Convert token amounts to 30-decimal USD values
  const positionFeeUsd = positionFeeAmount * collateralTokenPriceMin / PRICE_PRECISION
  const borrowingFeeUsd = borrowingFeeAmount * collateralTokenPriceMin / PRICE_PRECISION
  // fundingFeeAmount can be negative (paid to trader), only count positive values
  const liquidationFeeUsd = fundingFeeAmount > 0n ? fundingFeeAmount * collateralTokenPriceMin / PRICE_PRECISION : 0n

  const timestampSeconds = Math.floor(ctx.block.timestamp / 1000)
  const dayTs = Math.floor(timestampSeconds / DAY_SECONDS) * DAY_SECONDS

  // Daily fees — ID is the day timestamp as string (frontend queries id_gte for weekly)
  const dailyId = String(dayTs)
  upsertFeesInfo(feesInfos, dailyId, '1d', dayTs, positionFeeUsd, borrowingFeeUsd, liquidationFeeUsd, 0n)

  // Total fees
  upsertFeesInfo(feesInfos, 'total', 'total', timestampSeconds, positionFeeUsd, borrowingFeeUsd, liquidationFeeUsd, 0n)
}

function upsertFeesInfo(
  feesInfos: Map<string, FeesInfo>,
  id: string,
  period: string,
  timestamp: number,
  positionFeeUsd: bigint,
  borrowingFeeUsd: bigint,
  liquidationFeeUsd: bigint,
  swapFeeUsd: bigint,
): void {
  const existing = feesInfos.get(id)
  if (existing) {
    existing.totalPositionFeeUsd += positionFeeUsd
    existing.totalBorrowingFeeUsd += borrowingFeeUsd
    existing.totalLiquidationFeeUsd += liquidationFeeUsd
    existing.totalSwapFeeUsd += swapFeeUsd
    existing.timestamp = timestamp
  } else {
    feesInfos.set(id, new FeesInfo({
      id,
      period,
      totalPositionFeeUsd: positionFeeUsd,
      totalBorrowingFeeUsd: borrowingFeeUsd,
      totalLiquidationFeeUsd: liquidationFeeUsd,
      totalSwapFeeUsd: swapFeeUsd,
      timestamp,
    }))
  }
}

/**
 * Compute daily APR snapshots from PositionFeesCollected events.
 *
 * APR = (daily fees / pool value) * 365 * 100
 * Requires MarketInfo with poolValueMax to be available.
 */
export function handleAprSnapshotFromFees(
  ctx: EventContext,
  data: DecodedEventData,
  aprSnapshots: Map<string, AprSnapshot>,
  marketInfos: Map<string, MarketInfo>,
): void {
  if (data.eventName !== eventKeys.POSITION_FEES_COLLECTED) return

  const market = getAddress(data, 'market')
  if (!market) return

  const marketLower = market.toLowerCase()
  const positionFeeAmount = getUint(data, 'positionFeeAmount') ?? 0n
  const borrowingFeeAmount = getUint(data, 'borrowingFeeAmount') ?? 0n
  const collateralTokenPriceMin = getUint(data, 'collateralTokenPrice.min')

  if (!collateralTokenPriceMin || collateralTokenPriceMin === 0n) return

  const positionFeeUsd = positionFeeAmount * collateralTokenPriceMin / PRICE_PRECISION
  const borrowingFeeUsd = borrowingFeeAmount * collateralTokenPriceMin / PRICE_PRECISION

  // Find the MarketInfo to get pool value
  const marketInfo = marketInfos.get(marketLower)
  if (!marketInfo || !marketInfo.poolValueMax || marketInfo.poolValueMax === 0n) return

  const timestampSeconds = Math.floor(ctx.block.timestamp / 1000)
  const dayTs = Math.floor(timestampSeconds / DAY_SECONDS) * DAY_SECONDS

  // Look up the market token address from MarketInfo for the snapshot key
  const marketTokenAddress = marketInfo.marketTokenAddress.toLowerCase()
  const snapshotId = `${marketTokenAddress}-${dayTs}`

  const existing = aprSnapshots.get(snapshotId)
  if (existing) {
    // Accumulate fees for the day, recompute APR
    // Store accumulated fees in the APR fields temporarily, recompute at end
    existing.aprByFee += positionFeeUsd
    existing.aprByBorrowingFee += borrowingFeeUsd
  } else {
    aprSnapshots.set(snapshotId, new AprSnapshot({
      id: snapshotId,
      address: marketTokenAddress,
      aprByFee: positionFeeUsd,
      aprByBorrowingFee: borrowingFeeUsd,
      snapshotTimestamp: dayTs,
    }))
  }
}

/**
 * Finalize APR snapshots by converting accumulated daily fees to annualized rates.
 * Call this after all events in a batch have been processed.
 *
 * APR = (dailyFees / poolValue) * 365 * APR_PRECISION
 */
export function finalizeAprSnapshots(
  aprSnapshots: Map<string, AprSnapshot>,
  marketInfos: Map<string, MarketInfo>,
): void {
  for (const snapshot of aprSnapshots.values()) {
    // Find the pool value for this market token
    let poolValue = 0n
    for (const mi of marketInfos.values()) {
      if (mi.marketTokenAddress.toLowerCase() === snapshot.address) {
        poolValue = mi.poolValueMax
        break
      }
    }

    if (!poolValue || poolValue === 0n) continue

    // Convert accumulated fee USD amounts to annualized percentage
    // aprByFee currently holds accumulated position fees in USD for the day
    // APR = (fees / poolValue) * 365 * APR_PRECISION
    snapshot.aprByFee = snapshot.aprByFee * SECONDS_PER_YEAR * APR_PRECISION / (poolValue * BigInt(DAY_SECONDS))
    snapshot.aprByBorrowingFee = snapshot.aprByBorrowingFee * SECONDS_PER_YEAR * APR_PRECISION / (poolValue * BigInt(DAY_SECONDS))
  }
}
