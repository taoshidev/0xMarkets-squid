import { Store } from '@subsquid/typeorm-store'
import { DepositAction, WithdrawalAction, Transaction } from '../model'
import {
  DecodedEventData,
  getAddress,
  getUint,
  getBytes32,
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
 * Handle deposit events
 */
export async function handleDepositEvent(
  ctx: EventContext,
  data: DecodedEventData
): Promise<{ deposit: DepositAction; transaction: Transaction } | null> {
  const eventName = data.eventName

  const depositEvents = [
    eventKeys.DEPOSIT_CREATED,
    eventKeys.DEPOSIT_EXECUTED,
    eventKeys.DEPOSIT_CANCELLED,
  ]

  if (!depositEvents.includes(eventName)) {
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

  const deposit = new DepositAction({
    id: ctx.log.id,
    account: getAddress(data, 'account') || data.msgSender,
    eventName: eventName,
    marketAddress: getAddress(data, 'market') || '',

    initialLongToken: getUint(data, 'initialLongTokenAmount'),
    initialShortToken: getUint(data, 'initialShortTokenAmount'),
    receivedMarketTokens: getUint(data, 'receivedMarketTokens'),

    executionFee: getUint(data, 'executionFee'),
    callbackGasLimit: getUint(data, 'callbackGasLimit'),

    key: getBytes32(data, 'key') || '',
    timestamp: timestampSeconds,
    transaction: transaction,
  })

  return { deposit, transaction }
}

/**
 * Handle withdrawal events
 */
export async function handleWithdrawalEvent(
  ctx: EventContext,
  data: DecodedEventData
): Promise<{ withdrawal: WithdrawalAction; transaction: Transaction } | null> {
  const eventName = data.eventName

  const withdrawalEvents = [
    eventKeys.WITHDRAWAL_CREATED,
    eventKeys.WITHDRAWAL_EXECUTED,
    eventKeys.WITHDRAWAL_CANCELLED,
  ]

  if (!withdrawalEvents.includes(eventName)) {
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

  const withdrawal = new WithdrawalAction({
    id: ctx.log.id,
    account: getAddress(data, 'account') || data.msgSender,
    eventName: eventName,
    marketAddress: getAddress(data, 'market') || '',

    marketTokenAmount: getUint(data, 'marketTokenAmount'),
    receivedLongTokenAmount: getUint(data, 'longTokenAmount'),
    receivedShortTokenAmount: getUint(data, 'shortTokenAmount'),

    executionFee: getUint(data, 'executionFee'),
    callbackGasLimit: getUint(data, 'callbackGasLimit'),

    key: getBytes32(data, 'key') || '',
    timestamp: timestampSeconds,
    transaction: transaction,
  })

  return { withdrawal, transaction }
}
