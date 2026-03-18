import { EvmBatchProcessor } from '@subsquid/evm-processor'
import { TypeormDatabase } from '@subsquid/typeorm-store'

// Base Sepolia
const CHAIN_ID = 84532

// EventEmitter contract addresses on Base Sepolia
// Both old and new are indexed to preserve historical leaderboard data
const OLD_EVENT_EMITTER = '0xd5aAfa71f745645Db84cB4877873701ddAf2514c'.toLowerCase()
export const EVENT_EMITTER_ADDRESS = '0x68001935Ec7C2e3980f99435db3CabC89dea602B'.toLowerCase()
export const EVENT_EMITTER_ADDRESSES = new Set([OLD_EVENT_EMITTER, EVENT_EMITTER_ADDRESS])

// EventLog1 and EventLog2 topic hashes
// EventLog1(address,string,string,tuple)
export const EVENT_LOG1_TOPIC = '0x137a44067c8961cd7e1d876f4754a5a3a75989b4552f1843fc69c3b372def160'
// EventLog2(address,string,string,string,tuple)
export const EVENT_LOG2_TOPIC = '0x468a25a7ba624ceea6e540ad6f49171b52495b648417ae91bca21676d8a24dc5'

export const processor = new EvmBatchProcessor()
  .setGateway('https://v2.archive.subsquid.io/network/base-sepolia')
  .setRpcEndpoint({
    url: process.env.RPC_URL || 'https://sepolia.base.org',
    rateLimit: 10
  })
  .setFinalityConfirmation(10)
  .setBlockRange({
    from: 37_742_000 // Just before EventEmitter deployment at block 37,742,351
  })
  .addLog({
    address: [OLD_EVENT_EMITTER, EVENT_EMITTER_ADDRESS],
    topic0: [EVENT_LOG1_TOPIC, EVENT_LOG2_TOPIC],
    transaction: true
  })
  .setFields({
    log: {
      topics: true,
      data: true,
      transactionHash: true
    },
    block: {
      timestamp: true
    },
    transaction: {
      hash: true,
      from: true
    }
  })

// Database connection uses environment variables:
// DB_HOST, DB_PORT, DB_NAME, DB_USER, DB_PASS
export const db = new TypeormDatabase({ supportHotBlocks: true })
