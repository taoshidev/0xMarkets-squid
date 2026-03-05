import { Store } from '@subsquid/typeorm-store'
import { TradeAction, Transaction } from '../model'
import {
  DecodedEventData,
  getAddress,
  getUint,
  getInt,
  getBool,
  getBytes32,
  getString,
  getAddressArray,
} from '../decoding/eventDecoder'
import * as eventKeys from '../decoding/eventKeys'

export interface EventContext {
  store: Store
  block: {
    height: number
    timestamp: number  // milliseconds
  }
  log: {
    id: string
    transactionHash: string
  }
}

const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000'

/**
 * Handle order-related events and create TradeAction entities
 */
export async function handleOrderEvent(
  ctx: EventContext,
  data: DecodedEventData
): Promise<{ tradeAction: TradeAction; transaction: Transaction } | null> {
  const eventName = data.eventName

  // Only handle order events
  if (!eventKeys.TRADE_EVENT_NAMES.includes(eventName)) {
    return null
  }

  const timestampSeconds = Math.floor(ctx.block.timestamp / 1000)
  const txHash = ctx.log.transactionHash

  // Create or reference transaction
  const transaction = new Transaction({
    id: txHash,
    hash: txHash,
    blockNumber: ctx.block.height,
    timestamp: timestampSeconds,
  })

  const swapPath = getAddressArray(data, 'swapPath') || []

  const tradeAction = new TradeAction({
    id: ctx.log.id,
    account: getAddress(data, 'account') || data.msgSender,
    eventName: eventName,
    marketAddress: getAddress(data, 'market'),
    orderType: Number(getUint(data, 'orderType') || 0n),
    orderKey: getBytes32(data, 'key') || '',
    isLong: getBool(data, 'isLong'),

    // Swap path
    swapPath: swapPath,

    // Collateral & Size
    initialCollateralTokenAddress: getAddress(data, 'initialCollateralToken') || ZERO_ADDRESS,
    initialCollateralDeltaAmount: getUint(data, 'initialCollateralDeltaAmount') || 0n,
    sizeDeltaUsd: getUint(data, 'sizeDeltaUsd'),
    sizeDeltaInTokens: getUint(data, 'sizeDeltaInTokens'),

    // Prices
    acceptablePrice: getUint(data, 'acceptablePrice'),
    executionPrice: getUint(data, 'executionPrice'),
    triggerPrice: getUint(data, 'triggerPrice'),
    contractTriggerPrice: getUint(data, 'contractTriggerPrice'),
    indexTokenPriceMin: getUint(data, 'indexTokenPrice.min'),
    indexTokenPriceMax: getUint(data, 'indexTokenPrice.max'),
    collateralTokenPriceMin: getUint(data, 'collateralTokenPrice.min'),
    collateralTokenPriceMax: getUint(data, 'collateralTokenPrice.max'),

    // Output
    minOutputAmount: getUint(data, 'minOutputAmount'),
    executionAmountOut: getUint(data, 'executionAmountOut'),

    // Fees
    positionFeeAmount: getUint(data, 'positionFeeAmount'),
    borrowingFeeAmount: getUint(data, 'borrowingFeeAmount'),
    fundingFeeAmount: getUint(data, 'fundingFeeAmount'),
    liquidationFeeAmount: getUint(data, 'liquidationFeeAmount'),
    collateralTotalCostAmount: getUint(data, 'collateralTotalCostAmount'),

    // PnL & Impact (signed int256 in contract)
    basePnlUsd: getInt(data, 'basePnlUsd'),
    priceImpactUsd: getInt(data, 'priceImpactUsd'),
    priceImpactDiffUsd: getUint(data, 'values.priceImpactDiffUsd'),
    priceImpactAmount: getInt(data, 'priceImpactAmount'),

    // TWAP
    twapGroupId: getBytes32(data, 'twapGroupId'),
    numberOfParts: Number(getUint(data, 'numberOfParts') || 0n),
    totalImpactUsd: getUint(data, 'totalImpactUsd'),
    proportionalPendingImpactUsd: getUint(data, 'proportionalPendingImpactUsd'),

    // Metadata
    reason: getString(data, 'reason'),
    reasonBytes: getString(data, 'reasonBytes'),
    shouldUnwrapNativeToken: getBool(data, 'shouldUnwrapNativeToken'),
    decreasePositionSwapType: Number(getUint(data, 'decreasePositionSwapType') || 0n),
    uiFeeReceiver: getAddress(data, 'uiFeeReceiver') || ZERO_ADDRESS,
    srcChainId: getUint(data, 'srcChainId'),

    // Relations
    transaction: transaction,
    timestamp: timestampSeconds,
  })

  return { tradeAction, transaction }
}

/**
 * Handle PositionIncrease / PositionDecrease events
 */
export async function handlePositionEvent(
  ctx: EventContext,
  data: DecodedEventData
): Promise<{ tradeAction: TradeAction; transaction: Transaction } | null> {
  const eventName = data.eventName

  if (eventName !== eventKeys.POSITION_INCREASE && eventName !== eventKeys.POSITION_DECREASE) {
    return null
  }

  const timestampSeconds = Math.floor(ctx.block.timestamp / 1000)
  const txHash = ctx.log.transactionHash

  const transaction = new Transaction({
    id: txHash,
    hash: txHash,
    blockNumber: ctx.block.height,
    timestamp: timestampSeconds,
  })

  const swapPath = getAddressArray(data, 'swapPath') || []

  const tradeAction = new TradeAction({
    id: ctx.log.id,
    account: getAddress(data, 'account') || data.msgSender,
    eventName: eventName,
    marketAddress: getAddress(data, 'market'),
    orderType: Number(getUint(data, 'orderType') || 0n),
    orderKey: getBytes32(data, 'orderKey') || '',
    isLong: getBool(data, 'isLong'),

    swapPath: swapPath,

    // Collateral & Size
    initialCollateralTokenAddress: getAddress(data, 'collateralToken') || ZERO_ADDRESS,
    initialCollateralDeltaAmount: getUint(data, 'collateralDeltaAmount') || 0n,
    sizeDeltaUsd: getUint(data, 'sizeDeltaUsd'),
    sizeDeltaInTokens: getUint(data, 'sizeDeltaInTokens'),

    // Execution details
    executionPrice: getUint(data, 'executionPrice'),
    indexTokenPriceMin: getUint(data, 'indexTokenPrice.min'),
    indexTokenPriceMax: getUint(data, 'indexTokenPrice.max'),
    collateralTokenPriceMin: getUint(data, 'collateralTokenPrice.min'),
    collateralTokenPriceMax: getUint(data, 'collateralTokenPrice.max'),

    // Fees — NOT in PositionIncrease/Decrease events; populated from PositionFeesCollected via enrichment
    // positionFeeAmount, borrowingFeeAmount, fundingFeeAmount left undefined here

    // PnL & Impact (signed int256 in contract)
    pnlUsd: getInt(data, 'basePnlUsd'),  // pnlUsd = basePnlUsd for trade history display
    basePnlUsd: getInt(data, 'basePnlUsd'),
    priceImpactUsd: getInt(data, 'priceImpactUsd'),
    priceImpactAmount: getInt(data, 'priceImpactAmount'),

    // Metadata
    uiFeeReceiver: getAddress(data, 'uiFeeReceiver') || ZERO_ADDRESS,

    transaction: transaction,
    timestamp: timestampSeconds,
  })

  return { tradeAction, transaction }
}

/**
 * Handle PositionFeesCollected events — fee data emitted separately from PositionIncrease/Decrease.
 * Returns a partial TradeAction with fee fields, keyed by orderKey for enrichment merge.
 */
export function handlePositionFeesEvent(
  ctx: EventContext,
  data: DecodedEventData
): { orderKey: string; fees: PositionFeeData } | null {
  if (data.eventName !== eventKeys.POSITION_FEES_COLLECTED &&
      data.eventName !== eventKeys.POSITION_FEES_INFO) {
    return null
  }

  const orderKey = getBytes32(data, 'orderKey') || ''
  if (!orderKey) return null

  return {
    orderKey,
    fees: {
      positionFeeAmount: getUint(data, 'positionFeeAmount'),
      borrowingFeeAmount: getUint(data, 'borrowingFeeAmount'),
      fundingFeeAmount: getUint(data, 'fundingFeeAmount'),
      totalCostAmount: getUint(data, 'totalCostAmount'),
      collateralTokenPriceMin: getUint(data, 'collateralTokenPrice.min'),
    },
  }
}

export interface PositionFeeData {
  positionFeeAmount: bigint | undefined
  borrowingFeeAmount: bigint | undefined
  fundingFeeAmount: bigint | undefined
  totalCostAmount: bigint | undefined
  collateralTokenPriceMin: bigint | undefined
}
