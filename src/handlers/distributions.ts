import { Distribution, Transaction } from '../model'
import {
  DecodedEventData,
  getAddress,
  getUint,
  getString,
  getAddressArray,
  getUintArray,
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
 * Handle distribution/incentive events.
 * Checks for DistributionCreated and AffiliateRewardUpdated event names.
 * Returns null for unrecognized events (safe no-op).
 */
export function handleDistributionEvent(
  ctx: EventContext,
  data: DecodedEventData
): { distribution: Distribution; transaction: Transaction } | null {
  const eventName = data.eventName

  if (
    eventName !== eventKeys.DISTRIBUTION_CREATED &&
    eventName !== eventKeys.AFFILIATE_REWARD_UPDATED
  ) {
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

  const receiver = getAddress(data, 'receiver') || getAddress(data, 'affiliate') || data.msgSender
  const amounts = (getUintArray(data, 'amounts') || []).map(a => a.toString())
  const amountsInUsd = (getUintArray(data, 'amountsInUsd') || []).map(a => a.toString())
  const tokens = getAddressArray(data, 'tokens') || []

  const distribution = new Distribution({
    id: ctx.log.id,
    receiver: receiver?.toLowerCase() || '',
    typeId: getString(data, 'typeId') || eventName,
    amounts,
    amountsInUsd,
    tokens,
    transaction,
    timestamp: timestampSeconds,
  })

  return { distribution, transaction }
}
