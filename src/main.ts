import 'dotenv/config'
import { processor, db, EVENT_EMITTER_ADDRESS, EVENT_LOG1_TOPIC, EVENT_LOG2_TOPIC } from './processor'
import { decodeEventLog, DecodedEventData } from './decoding/eventDecoder'
import { handleOrderEvent, handlePositionEvent, EventContext } from './handlers/orders'
import { TradeAction, Transaction } from './model'
import { generateLogId } from './utils/ids'

processor.run(db, async (ctx) => {
  // Collect entities to batch insert
  const transactions: Map<string, Transaction> = new Map()
  const tradeActions: TradeAction[] = []

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
})

interface EntityCollectors {
  transactions: Map<string, Transaction>
  tradeActions: TradeAction[]
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

  // Try position events
  const positionResult = await handlePositionEvent(ctx, data)
  if (positionResult) {
    collectors.transactions.set(positionResult.transaction.id, positionResult.transaction)
    collectors.tradeActions.push(positionResult.tradeAction)
    return
  }

  // Event not handled - this is fine, we don't need to index everything
}
