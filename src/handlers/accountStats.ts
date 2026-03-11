import { Position, AccountStat, PeriodAccountStat } from '../model'
import { DecodedEventData, getAddress, getUint, getInt, getBool } from '../decoding/eventDecoder'
import * as eventKeys from '../decoding/eventKeys'
import { generatePositionId, generateAccountStatsId, generateAllTimePeriodAccountStatsId } from '../utils/ids'
import { EventContext, PositionFeeData } from './orders'

function abs(n: bigint): bigint {
  return n < 0n ? -n : n
}

function getOrCreateAccountStat(
  accountStatsMap: Map<string, AccountStat>,
  account: string,
  timestamp: number
): AccountStat {
  const id = generateAccountStatsId(account)
  let stat = accountStatsMap.get(id)
  if (!stat) {
    stat = new AccountStat({
      id,
      closedCount: 0,
      wins: 0,
      losses: 0,
      volume: 0n,
      cumsumSize: 0n,
      cumsumCollateral: 0n,
      sumMaxSize: 0n,
      maxCapital: 0n,
      netCapital: 0n,
      deposits: 0n,
      realizedPnl: 0n,
      realizedFees: 0n,
      realizedPriceImpact: 0n,
      realizedSwapImpact: 0n,
      updatedAt: timestamp,
    })
    accountStatsMap.set(id, stat)
  }
  return stat
}

function getOrCreatePeriodAccountStat(
  periodStatsMap: Map<string, PeriodAccountStat>,
  account: string
): PeriodAccountStat {
  const id = generateAllTimePeriodAccountStatsId(account)
  let stat = periodStatsMap.get(id)
  if (!stat) {
    stat = new PeriodAccountStat({
      id,
      account: account.toLowerCase(),
      periodStart: 0,
      periodEnd: 0,
      closedCount: 0,
      wins: 0,
      losses: 0,
      volume: 0n,
      cumsumSize: 0n,
      cumsumCollateral: 0n,
      sumMaxSize: 0n,
      maxCapital: 0n,
      netCapital: 0n,
      realizedPnl: 0n,
      realizedFees: 0n,
      realizedPriceImpact: 0n,
      startUnrealizedPnl: 0n,
      startUnrealizedFees: 0n,
      startUnrealizedPriceImpact: 0n,
      hasRank: true,
    })
    periodStatsMap.set(id, stat)
  }
  return stat
}

function getOrCreatePosition(
  positionsMap: Map<string, Position>,
  accountStatsMap: Map<string, AccountStat>,
  account: string,
  market: string,
  collateralToken: string,
  isLong: boolean,
  timestamp: number
): Position {
  const id = generatePositionId(account, market, collateralToken, isLong)
  let pos = positionsMap.get(id)
  if (!pos) {
    const accountStat = getOrCreateAccountStat(accountStatsMap, account, timestamp)
    pos = new Position({
      id,
      account: account.toLowerCase(),
      market: market.toLowerCase(),
      collateralToken: collateralToken.toLowerCase(),
      isLong,
      accountStat,
      sizeInUsd: 0n,
      sizeInTokens: 0n,
      collateralAmount: 0n,
      entryPrice: 0n,
      maxSize: 0n,
      realizedFees: 0n,
      unrealizedFees: 0n,
      realizedPriceImpact: 0n,
      unrealizedPriceImpact: 0n,
      realizedPnl: 0n,
      unrealizedPnl: 0n,
      isSnapshot: false,
      createdAt: timestamp,
      updatedAt: timestamp,
    })
    positionsMap.set(id, pos)
  }
  return pos
}

/**
 * Process PositionIncrease/Decrease events to maintain Position, AccountStat,
 * and PeriodAccountStat entities for the leaderboard.
 */
export function handlePositionAndAccountStats(
  ctx: EventContext,
  data: DecodedEventData,
  positionsMap: Map<string, Position>,
  accountStatsMap: Map<string, AccountStat>,
  periodStatsMap: Map<string, PeriodAccountStat>,
  feeData?: PositionFeeData,
): boolean {
  const eventName = data.eventName
  if (eventName !== eventKeys.POSITION_INCREASE && eventName !== eventKeys.POSITION_DECREASE) {
    return false
  }

  const account = getAddress(data, 'account') || data.msgSender
  const market = getAddress(data, 'market') || ''
  const collateralToken = getAddress(data, 'collateralToken') || ''
  const isLong = getBool(data, 'isLong') ?? false

  const sizeDeltaUsd = getUint(data, 'sizeDeltaUsd') || 0n
  const sizeDeltaInTokens = getUint(data, 'sizeDeltaInTokens') || 0n
  // collateralDeltaAmount is int256 (intItems) in PositionIncrease but uint256 (uintItems) in PositionDecrease
  const collateralDeltaAmountInt = getInt(data, 'collateralDeltaAmount')
  const collateralDeltaAmountUint = getUint(data, 'collateralDeltaAmount')
  const collateralDeltaAmount = collateralDeltaAmountInt != null
    ? (collateralDeltaAmountInt < 0n ? 0n : collateralDeltaAmountInt)  // abs for increase (int256)
    : (collateralDeltaAmountUint || 0n)  // uint256 for decrease
  const executionPrice = getUint(data, 'executionPrice') || 0n
  const collateralTokenPriceMin = getUint(data, 'collateralTokenPrice.min') || 0n

  // Signed values
  const basePnlUsd = getInt(data, 'basePnlUsd') || 0n
  const priceImpactUsd = getInt(data, 'priceImpactUsd') || 0n

  // Fees from PositionFeesCollected event (separate from PositionIncrease/Decrease)
  // Fee amounts are in collateral token units — multiply by price to get USD in 1e30 scale
  const positionFeeAmount = feeData?.positionFeeAmount || 0n
  const borrowingFeeAmount = feeData?.borrowingFeeAmount || 0n
  const fundingFeeAmount = feeData?.fundingFeeAmount || 0n
  const totalFeeAmount = positionFeeAmount + borrowingFeeAmount + fundingFeeAmount
  // Use fee event's own collateral price if available, otherwise fall back to position event's price
  const feePriceMin = feeData?.collateralTokenPriceMin || collateralTokenPriceMin
  const totalFeeUsd = totalFeeAmount * feePriceMin

  // collateralDeltaAmount is in token units (e.g. 6 decimals for USDC)
  // price is in 1e30/token_decimals format, so product is in 1e30 (USD scale)
  const collateralDeltaUsd = collateralDeltaAmount * collateralTokenPriceMin

  const timestampSeconds = Math.floor(ctx.block.timestamp / 1000)

  // Get/create entities
  const position = getOrCreatePosition(
    positionsMap, accountStatsMap,
    account, market, collateralToken, isLong,
    timestampSeconds
  )
  const accountStat = getOrCreateAccountStat(accountStatsMap, account, timestampSeconds)
  const periodStat = getOrCreatePeriodAccountStat(periodStatsMap, account)

  // --- Update Position ---
  if (eventName === eventKeys.POSITION_INCREASE) {
    // Weighted average entry price
    if (position.sizeInUsd === 0n) {
      position.entryPrice = executionPrice
    } else if (sizeDeltaUsd > 0n) {
      position.entryPrice =
        ((position.sizeInUsd * position.entryPrice) + (sizeDeltaUsd * executionPrice))
        / (position.sizeInUsd + sizeDeltaUsd)
    }

    position.sizeInUsd += sizeDeltaUsd
    position.sizeInTokens += sizeDeltaInTokens
    position.collateralAmount += collateralDeltaAmount

    const oldMaxSize = position.maxSize
    if (position.sizeInUsd > oldMaxSize) {
      position.maxSize = position.sizeInUsd
      accountStat.sumMaxSize += (position.sizeInUsd - oldMaxSize)
    }
  } else {
    // PositionDecrease
    position.sizeInUsd = position.sizeInUsd > sizeDeltaUsd
      ? position.sizeInUsd - sizeDeltaUsd
      : 0n
    position.sizeInTokens = position.sizeInTokens > sizeDeltaInTokens
      ? position.sizeInTokens - sizeDeltaInTokens
      : 0n
    position.collateralAmount = position.collateralAmount > collateralDeltaAmount
      ? position.collateralAmount - collateralDeltaAmount
      : 0n

    position.realizedPnl += basePnlUsd
    position.realizedFees += totalFeeUsd
    position.realizedPriceImpact += priceImpactUsd
  }
  position.updatedAt = timestampSeconds

  // --- Update AccountStat ---
  accountStat.volume += abs(sizeDeltaUsd)
  accountStat.cumsumSize += abs(sizeDeltaUsd)
  accountStat.updatedAt = timestampSeconds

  // sumMaxSize is now accumulated incrementally inside the position maxSize update above

  if (eventName === eventKeys.POSITION_INCREASE) {
    accountStat.cumsumCollateral += collateralDeltaUsd
    accountStat.netCapital += collateralDeltaUsd
  } else {
    // Decrease: subtract collateral withdrawn, accumulate PnL/fees
    accountStat.netCapital -= collateralDeltaUsd
    accountStat.realizedPnl += basePnlUsd
    accountStat.realizedFees += totalFeeUsd
    accountStat.realizedPriceImpact += priceImpactUsd

    // Full close detection: position size is now 0
    if (position.sizeInUsd === 0n) {
      accountStat.closedCount++
      if (basePnlUsd > 0n) {
        accountStat.wins++
      } else if (basePnlUsd < 0n) {
        accountStat.losses++
      }
    }
  }

  // High-water mark for capital
  if (accountStat.netCapital > accountStat.maxCapital) {
    accountStat.maxCapital = accountStat.netCapital
  }

  // --- Mirror to PeriodAccountStat (all-time) ---
  periodStat.volume = accountStat.volume
  periodStat.cumsumSize = accountStat.cumsumSize
  periodStat.cumsumCollateral = accountStat.cumsumCollateral
  periodStat.sumMaxSize = accountStat.sumMaxSize
  periodStat.maxCapital = accountStat.maxCapital
  periodStat.netCapital = accountStat.netCapital
  periodStat.realizedPnl = accountStat.realizedPnl
  periodStat.realizedFees = accountStat.realizedFees
  periodStat.realizedPriceImpact = accountStat.realizedPriceImpact
  periodStat.closedCount = accountStat.closedCount
  periodStat.wins = accountStat.wins
  periodStat.losses = accountStat.losses

  return true
}
