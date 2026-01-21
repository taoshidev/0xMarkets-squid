import { Store } from '@subsquid/typeorm-store'
import { ClaimAction, ClaimableCollateral, Transaction } from '../model'
import {
  DecodedEventData,
  getAddress,
  getUint,
  getString,
  getAddressArray,
  getUintArray,
  getBoolArray,
} from '../decoding/eventDecoder'
import * as eventKeys from '../decoding/eventKeys'

export interface EventContext {
  store: Store
  block: {
    height: number
    timestamp: number
  }
  log: {
    id: string
    transactionHash: string
  }
}

/**
 * Handle claim events (FundingFeesClaimed, CollateralClaimed)
 */
export async function handleClaimEvent(
  ctx: EventContext,
  data: DecodedEventData
): Promise<{ claim: ClaimAction; transaction: Transaction } | null> {
  const eventName = data.eventName

  const claimEvents = [
    eventKeys.FUNDING_FEES_CLAIMED,
    eventKeys.COLLATERAL_CLAIMED,
  ]

  if (!claimEvents.includes(eventName)) {
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

  const marketAddresses = getAddressArray(data, 'markets') || []
  const tokenAddresses = getAddressArray(data, 'tokens') || []
  const amounts = (getUintArray(data, 'amounts') || []).map(a => a.toString())
  const tokenPrices = (getUintArray(data, 'tokenPrices') || []).map(p => p.toString())
  const isLongOrders = getBoolArray(data, 'isLongs') || []

  const claim = new ClaimAction({
    id: ctx.log.id,
    account: getAddress(data, 'account') || data.msgSender,
    eventName: eventName === eventKeys.FUNDING_FEES_CLAIMED ? 'ClaimFundingFee' : 'ClaimCollateral',

    marketAddresses: marketAddresses,
    tokenAddresses: tokenAddresses,
    amounts: amounts,
    tokenPrices: tokenPrices,
    isLongOrders: isLongOrders,

    timestamp: timestampSeconds,
    transaction: transaction,
  })

  return { claim, transaction }
}

/**
 * Handle ClaimableCollateralUpdated events
 */
export async function handleClaimableCollateralUpdated(
  ctx: EventContext,
  data: DecodedEventData
): Promise<ClaimableCollateral | null> {
  const eventName = data.eventName

  if (eventName !== eventKeys.CLAIMABLE_COLLATERAL_UPDATED) {
    return null
  }

  const timestampSeconds = Math.floor(ctx.block.timestamp / 1000)

  const account = getAddress(data, 'account') || data.msgSender
  const market = getAddress(data, 'market') || ''
  const token = getAddress(data, 'token') || ''
  const timeKey = getString(data, 'timeKey') || ''

  // Create composite ID
  const id = `${account}-${market}-${token}-${timeKey}`

  const claimable = new ClaimableCollateral({
    id: id,
    account: account,
    marketAddress: market,
    tokenAddress: token,
    timeKey: timeKey,

    value: getUint(data, 'value') || 0n,
    factor: getUint(data, 'factor') || 0n,
    reductionFactor: getUint(data, 'reductionFactor') || 0n,
    factorByTime: getUint(data, 'factorByTime') || 0n,
    claimed: false,

    updatedAt: timestampSeconds,
  })

  return claimable
}
