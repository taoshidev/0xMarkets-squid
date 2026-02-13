import 'dotenv/config'
import { processor, db, EVENT_EMITTER_ADDRESS, EVENT_LOG1_TOPIC, EVENT_LOG2_TOPIC } from './processor'
import { decodeEventLog, DecodedEventData } from './decoding/eventDecoder'
import { handleOrderEvent, handlePositionEvent, EventContext } from './handlers/orders'
import { handlePriceFromPositionEvent, handlePlatformStatFromDeposit } from './handlers/analytics'
import { handleDistributionEvent } from './handlers/distributions'
import { TradeAction, Transaction, Price, PlatformStat, Distribution } from './model'
import { generateLogId } from './utils/ids'

processor.run(db, async (ctx) => {
  // Collect entities to batch insert
  const transactions: Map<string, Transaction> = new Map()
  const tradeActions: TradeAction[] = []
  const prices: Map<string, Price> = new Map()
  const platformStats: Map<string, PlatformStat> = new Map()
  const distributions: Distribution[] = []

  // Track unique depositors across this batch.
  // On first batch, load existing count from DB to seed the set size.
  const seenDepositors = new Set<string>()
  const existingStat = await ctx.store.findOneBy(PlatformStat, { id: 'total' })
  if (existingStat) {
    // Seed the set with placeholder entries so .size reflects prior count.
    // Actual dedup within this batch still works since real addresses are added.
    for (let i = 0; i < existingStat.depositedUsers; i++) {
      seenDepositors.add(`__existing_${i}`)
    }
  }

  for (const block of ctx.blocks) {
    for (let i = 0; i < block.logs.length; i++) {
      const log = block.logs[i]

      // Only process EventEmitter logs
      if (log.address.toLowerCase() !== EVENT_EMITTER_ADDRESS) {
        continue
      }

      // Determine if EventLog1 or EventLog2
      const isEventLog2 = log.topics[0] === EVENT_LOG2_TOPIC

      try {
        // Decode the generic event
        const decoded = decodeEventLog(log.topics, log.data, isEventLog2)

        // Create event context
        const eventCtx: EventContext = {
          store: ctx.store,
          block: {
            height: block.header.height,
            timestamp: block.header.timestamp,
          },
          log: {
            id: generateLogId(block.header.height, i),
            transactionHash: log.transactionHash,
          },
        }

        // Route to appropriate handler based on event name
        await processEvent(eventCtx, decoded, {
          transactions,
          tradeActions,
          prices,
          platformStats,
          distributions,
          seenDepositors,
        })
      } catch (err) {
        ctx.log.error({ err, blockHeight: block.header.height, logIndex: i }, 'Failed to decode event')
      }
    }
  }

  // Batch insert all entities - transactions first due to foreign key
  if (transactions.size > 0) {
    await ctx.store.upsert([...transactions.values()])
    ctx.log.info(`Upserted ${transactions.size} transactions`)
  }

  if (tradeActions.length > 0) {
    await ctx.store.insert(tradeActions)
    ctx.log.info(`Inserted ${tradeActions.length} trade actions`)
  }

  if (prices.size > 0) {
    await ctx.store.upsert([...prices.values()])
    ctx.log.info(`Upserted ${prices.size} price snapshots`)
  }

  if (platformStats.size > 0) {
    await ctx.store.upsert([...platformStats.values()])
    ctx.log.info(`Upserted ${platformStats.size} platform stats`)
  }

  if (distributions.length > 0) {
    await ctx.store.insert(distributions)
    ctx.log.info(`Inserted ${distributions.length} distributions`)
  }
})

interface EntityCollectors {
  transactions: Map<string, Transaction>
  tradeActions: TradeAction[]
  prices: Map<string, Price>
  platformStats: Map<string, PlatformStat>
  distributions: Distribution[]
  seenDepositors: Set<string>
}

async function processEvent(
  ctx: EventContext,
  data: DecodedEventData,
  collectors: EntityCollectors
): Promise<void> {
  // Try order events
  const orderResult = await handleOrderEvent(ctx, data)
  if (orderResult) {
    collectors.transactions.set(orderResult.transaction.id, orderResult.transaction)
    collectors.tradeActions.push(orderResult.tradeAction)
    return
  }

  // Try position events (also extracts price snapshots)
  const positionResult = await handlePositionEvent(ctx, data)
  if (positionResult) {
    collectors.transactions.set(positionResult.transaction.id, positionResult.transaction)
    collectors.tradeActions.push(positionResult.tradeAction)

    // Extract price snapshot from position event
    const price = handlePriceFromPositionEvent(ctx, data)
    if (price) {
      collectors.prices.set(price.id, price)
    }
    return
  }

  // Try deposit events for platform stats
  const platformStatResult = handlePlatformStatFromDeposit(ctx, data, collectors.seenDepositors)
  if (platformStatResult) {
    collectors.transactions.set(platformStatResult.transaction.id, platformStatResult.transaction)
    collectors.platformStats.set(platformStatResult.platformStat.id, platformStatResult.platformStat)
    return
  }

  // Try distribution events
  const distributionResult = handleDistributionEvent(ctx, data)
  if (distributionResult) {
    collectors.transactions.set(distributionResult.transaction.id, distributionResult.transaction)
    collectors.distributions.push(distributionResult.distribution)
    return
  }

  // Event not handled - this is fine, we don't need to index everything
}
