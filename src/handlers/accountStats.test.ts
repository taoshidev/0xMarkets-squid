import { describe, it, expect, beforeEach } from 'vitest'
import { AccountStat, PeriodAccountStat } from '../model'
import { DecodedEventData } from '../decoding/eventDecoder'
import { EventContext } from './orders'
import { handleDepositAccountStats, getOrCreateAccountStat, getOrCreatePeriodAccountStat } from './accountStats'

// --- Helpers ---

const WALLET_A = '0xaAaAaAaaAaAaAaaAaAAAAAAAAaaaAaAaAaaAaaAa'
const WALLET_B = '0xbBbBBBBbbBBBbbbBbbBbbbbBBbBbbbbBbBbbBBbB'

function makeCtx(timestampMs: number = 1_700_000_000_000): EventContext {
  return {
    store: {} as any,
    block: { height: 100, timestamp: timestampMs },
    log: { id: '100-0', transactionHash: '0xdeadbeef' },
  }
}

function makeDepositExecutedData(
  account: string,
  initialLong: bigint,
  initialShort: bigint,
): DecodedEventData {
  const addressItems = new Map<string, string>([['account', account]])
  const uintItems = new Map<string, bigint>([
    ['initialLongTokenAmount', initialLong],
    ['initialShortTokenAmount', initialShort],
  ])
  return {
    eventName: 'DepositExecuted',
    msgSender: account,
    addressItems,
    addressArrayItems: new Map(),
    uintItems,
    uintArrayItems: new Map(),
    intItems: new Map(),
    intArrayItems: new Map(),
    boolItems: new Map(),
    boolArrayItems: new Map(),
    bytes32Items: new Map(),
    bytes32ArrayItems: new Map(),
    bytesItems: new Map(),
    bytesArrayItems: new Map(),
    stringItems: new Map(),
    stringArrayItems: new Map(),
  }
}

function makeNonDepositData(eventName: string): DecodedEventData {
  return {
    eventName,
    msgSender: WALLET_A,
    addressItems: new Map(),
    addressArrayItems: new Map(),
    uintItems: new Map(),
    uintArrayItems: new Map(),
    intItems: new Map(),
    intArrayItems: new Map(),
    boolItems: new Map(),
    boolArrayItems: new Map(),
    bytes32Items: new Map(),
    bytes32ArrayItems: new Map(),
    bytesItems: new Map(),
    bytesArrayItems: new Map(),
    stringItems: new Map(),
    stringArrayItems: new Map(),
  }
}

// --- Tests ---

describe('handleDepositAccountStats', () => {
  let accountStats: Map<string, AccountStat>
  let periodStats: Map<string, PeriodAccountStat>
  let ctx: EventContext

  beforeEach(() => {
    accountStats = new Map()
    periodStats = new Map()
    ctx = makeCtx()
  })

  it('ignores non-DepositExecuted events', () => {
    const data = makeNonDepositData('DepositCreated')
    const result = handleDepositAccountStats(ctx, data, accountStats, periodStats)
    expect(result).toBe(false)
    expect(accountStats.size).toBe(0)
  })

  it('ignores DepositExecuted with zero amounts', () => {
    const data = makeDepositExecutedData(WALLET_A, 0n, 0n)
    const result = handleDepositAccountStats(ctx, data, accountStats, periodStats)
    expect(result).toBe(false)
  })

  it('increments totalDepositedUsd0 on a single deposit (long token only)', () => {
    const amount = 500_000n * 10n ** 18n // 500K USD0
    const data = makeDepositExecutedData(WALLET_A, amount, 0n)

    const result = handleDepositAccountStats(ctx, data, accountStats, periodStats)

    expect(result).toBe(true)
    const acct = accountStats.get(WALLET_A.toLowerCase())!
    expect(acct.totalDepositedUsd0).toBe(amount)

    const period = periodStats.get(WALLET_A.toLowerCase())!
    expect(period.totalDepositedUsd0).toBe(amount)
  })

  it('increments totalDepositedUsd0 on a single deposit (short token only)', () => {
    const amount = 500_000n * 10n ** 18n
    const data = makeDepositExecutedData(WALLET_A, 0n, amount)

    handleDepositAccountStats(ctx, data, accountStats, periodStats)

    const acct = accountStats.get(WALLET_A.toLowerCase())!
    expect(acct.totalDepositedUsd0).toBe(amount)
  })

  it('sums long + short token amounts', () => {
    const long = 200_000n * 10n ** 18n
    const short = 300_000n * 10n ** 18n
    const data = makeDepositExecutedData(WALLET_A, long, short)

    handleDepositAccountStats(ctx, data, accountStats, periodStats)

    const acct = accountStats.get(WALLET_A.toLowerCase())!
    expect(acct.totalDepositedUsd0).toBe(long + short)
  })

  it('accumulates across multiple deposits for the same wallet', () => {
    const deposit1 = 500_000n * 10n ** 18n
    const deposit2 = 100_000n * 10n ** 18n

    handleDepositAccountStats(ctx, makeDepositExecutedData(WALLET_A, deposit1, 0n), accountStats, periodStats)
    handleDepositAccountStats(ctx, makeDepositExecutedData(WALLET_A, deposit2, 0n), accountStats, periodStats)

    const acct = accountStats.get(WALLET_A.toLowerCase())!
    expect(acct.totalDepositedUsd0).toBe(deposit1 + deposit2)

    const period = periodStats.get(WALLET_A.toLowerCase())!
    expect(period.totalDepositedUsd0).toBe(deposit1 + deposit2)
  })

  it('tracks deposits independently per wallet', () => {
    const amountA = 500_000n * 10n ** 18n
    const amountB = 250_000n * 10n ** 18n

    handleDepositAccountStats(ctx, makeDepositExecutedData(WALLET_A, amountA, 0n), accountStats, periodStats)
    handleDepositAccountStats(ctx, makeDepositExecutedData(WALLET_B, amountB, 0n), accountStats, periodStats)

    expect(accountStats.get(WALLET_A.toLowerCase())!.totalDepositedUsd0).toBe(amountA)
    expect(accountStats.get(WALLET_B.toLowerCase())!.totalDepositedUsd0).toBe(amountB)
  })

  it('never decreases — withdrawal events are ignored', () => {
    const amount = 500_000n * 10n ** 18n
    handleDepositAccountStats(ctx, makeDepositExecutedData(WALLET_A, amount, 0n), accountStats, periodStats)

    // Simulate a WithdrawalExecuted event — should return false
    const withdrawalData = makeNonDepositData('WithdrawalExecuted')
    const result = handleDepositAccountStats(ctx, withdrawalData, accountStats, periodStats)

    expect(result).toBe(false)
    expect(accountStats.get(WALLET_A.toLowerCase())!.totalDepositedUsd0).toBe(amount)
  })

  it('whitelist path: free 500K USD0 deposit increments correctly', () => {
    const freeDeposit = 500_000n * 10n ** 18n
    handleDepositAccountStats(ctx, makeDepositExecutedData(WALLET_A, freeDeposit, 0n), accountStats, periodStats)

    expect(accountStats.get(WALLET_A.toLowerCase())!.totalDepositedUsd0).toBe(freeDeposit)
  })

  it('paid path: 100 USDC → 500K USD0 deposit increments correctly', () => {
    const paidDeposit = 500_000n * 10n ** 18n
    handleDepositAccountStats(ctx, makeDepositExecutedData(WALLET_A, paidDeposit, 0n), accountStats, periodStats)

    expect(accountStats.get(WALLET_A.toLowerCase())!.totalDepositedUsd0).toBe(paidDeposit)
  })

  it('social earn path deposits accumulate on top of existing', () => {
    const initial = 500_000n * 10n ** 18n
    const socialEarn = 50_000n * 10n ** 18n

    handleDepositAccountStats(ctx, makeDepositExecutedData(WALLET_A, initial, 0n), accountStats, periodStats)
    handleDepositAccountStats(ctx, makeDepositExecutedData(WALLET_A, socialEarn, 0n), accountStats, periodStats)

    expect(accountStats.get(WALLET_A.toLowerCase())!.totalDepositedUsd0).toBe(initial + socialEarn)
  })

  it('falls back to msgSender when account address is missing', () => {
    const data = makeDepositExecutedData(WALLET_A, 100n, 0n)
    data.addressItems.delete('account')
    // msgSender is already set to WALLET_A

    const result = handleDepositAccountStats(ctx, data, accountStats, periodStats)
    expect(result).toBe(true)
    expect(accountStats.get(WALLET_A.toLowerCase())!.totalDepositedUsd0).toBe(100n)
  })

  it('updates updatedAt timestamp on AccountStat', () => {
    const ts = 1_800_000_000_000
    const ctxLater = makeCtx(ts)
    handleDepositAccountStats(ctxLater, makeDepositExecutedData(WALLET_A, 100n, 0n), accountStats, periodStats)

    expect(accountStats.get(WALLET_A.toLowerCase())!.updatedAt).toBe(Math.floor(ts / 1000))
  })
})

describe('getOrCreateAccountStat', () => {
  it('initializes totalDepositedUsd0 to 0', () => {
    const map = new Map<string, AccountStat>()
    const stat = getOrCreateAccountStat(map, WALLET_A, 1000)
    expect(stat.totalDepositedUsd0).toBe(0n)
  })

  it('returns existing stat on second call', () => {
    const map = new Map<string, AccountStat>()
    const stat1 = getOrCreateAccountStat(map, WALLET_A, 1000)
    stat1.totalDepositedUsd0 = 999n
    const stat2 = getOrCreateAccountStat(map, WALLET_A, 2000)
    expect(stat2.totalDepositedUsd0).toBe(999n)
    expect(stat1).toBe(stat2)
  })
})

describe('getOrCreatePeriodAccountStat', () => {
  it('initializes totalDepositedUsd0 to 0', () => {
    const map = new Map<string, PeriodAccountStat>()
    const stat = getOrCreatePeriodAccountStat(map, WALLET_A)
    expect(stat.totalDepositedUsd0).toBe(0n)
  })
})
