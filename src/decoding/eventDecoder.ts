import { ethers } from 'ethers'

/**
 * Decoded event data from EventEmitter
 */
export interface DecodedEventData {
  eventName: string
  msgSender: string
  topic1?: string  // For EventLog1 and EventLog2
  addressItems: Map<string, string>
  addressArrayItems: Map<string, string[]>
  uintItems: Map<string, bigint>
  uintArrayItems: Map<string, bigint[]>
  intItems: Map<string, bigint>
  intArrayItems: Map<string, bigint[]>
  boolItems: Map<string, boolean>
  boolArrayItems: Map<string, boolean[]>
  bytes32Items: Map<string, string>
  bytes32ArrayItems: Map<string, string[]>
  bytesItems: Map<string, string>
  bytesArrayItems: Map<string, string[]>
  stringItems: Map<string, string>
  stringArrayItems: Map<string, string[]>
}

// Use AbiCoder.decode directly instead of Interface.decodeEventLog to avoid
// topic hash mismatch between human-readable and JSON ABIs in ethers v6.
const abiCoder = ethers.AbiCoder.defaultAbiCoder()

// EventLogData tuple type — matches the on-chain EventUtils.EventLogData struct.
// Structure: (addressItems, uintItems, intItems, boolItems, bytes32Items, bytesItems, stringItems)
// Each *Items is: (items: (string key, T value)[], arrayItems: (string key, T[] value)[])
const EVENT_LOG_DATA_TYPE = [
  'tuple(',
  'tuple(tuple(string,address)[],tuple(string,address[])[])',  // addressItems
  ',tuple(tuple(string,uint256)[],tuple(string,uint256[])[])', // uintItems
  ',tuple(tuple(string,int256)[],tuple(string,int256[])[])',   // intItems
  ',tuple(tuple(string,bool)[],tuple(string,bool[])[])',       // boolItems
  ',tuple(tuple(string,bytes32)[],tuple(string,bytes32[])[])', // bytes32Items
  ',tuple(tuple(string,bytes)[],tuple(string,bytes[])[])',     // bytesItems
  ',tuple(tuple(string,string)[],tuple(string,string[])[])',   // stringItems
  ')',
].join('')

// Both EventLog1 and EventLog2 encode the same non-indexed data layout:
// (address msgSender, string eventName, EventLogData eventData)
const DATA_TYPES = ['address', 'string', EVENT_LOG_DATA_TYPE]

/**
 * Decode EventLog1 or EventLog2 from raw log data.
 *
 * Uses AbiCoder.decode on the data bytes directly, avoiding
 * Interface.decodeEventLog which validates topic hashes against
 * the ABI-computed signature (broken for complex nested tuples
 * in ethers v6 with human-readable ABI strings).
 *
 * Topic layout:
 *   EventLog1: topics[0]=sig, topics[1]=keccak256(eventName), topics[2]=topic1
 *   EventLog2: topics[0]=sig, topics[1]=keccak256(eventName), topics[2]=topic1, topics[3]=topic2
 */
export function decodeEventLog(
  topics: string[],
  data: string,
  isEventLog2: boolean
): DecodedEventData {
  const decoded = abiCoder.decode(DATA_TYPES, data)

  const msgSender = decoded[0] as string
  const eventName = decoded[1] as string
  const eventData = decoded[2]  // The EventLogData tuple (positional access)

  // topic1 is at topics[2] for both EventLog1 and EventLog2
  const topic1 = topics.length > 2 ? topics[2] : undefined

  return {
    eventName,
    msgSender,
    topic1,

    // eventData[0] = addressItems: (items[], arrayItems[])
    addressItems: extractItems(eventData[0][0]),
    addressArrayItems: extractArrayItems(eventData[0][1]),

    // eventData[1] = uintItems
    uintItems: extractItems(eventData[1][0], toBigInt),
    uintArrayItems: extractArrayItems(eventData[1][1], toBigInt),

    // eventData[2] = intItems
    intItems: extractItems(eventData[2][0], toBigInt),
    intArrayItems: extractArrayItems(eventData[2][1], toBigInt),

    // eventData[3] = boolItems
    boolItems: extractItems(eventData[3][0]),
    boolArrayItems: extractArrayItems(eventData[3][1]),

    // eventData[4] = bytes32Items
    bytes32Items: extractItems(eventData[4][0]),
    bytes32ArrayItems: extractArrayItems(eventData[4][1]),

    // eventData[5] = bytesItems
    bytesItems: extractItems(eventData[5][0]),
    bytesArrayItems: extractArrayItems(eventData[5][1]),

    // eventData[6] = stringItems
    stringItems: extractItems(eventData[6][0]),
    stringArrayItems: extractArrayItems(eventData[6][1]),
  }
}

/**
 * Extract key-value items from decoded tuple array.
 * Each item is an ethers Result: [0]=key (string), [1]=value (T)
 */
function extractItems<T>(
  items: any[],
  transform?: (v: any) => T
): Map<string, T> {
  const map = new Map<string, T>()
  for (const item of items) {
    const key = item[0] as string
    const value = transform ? transform(item[1]) : item[1] as T
    map.set(key, value)
  }
  return map
}

/**
 * Extract key-value[] items from decoded tuple array.
 * Each item is an ethers Result: [0]=key (string), [1]=value[] (T[])
 */
function extractArrayItems<T>(
  items: any[],
  transform?: (v: any) => T
): Map<string, T[]> {
  const map = new Map<string, T[]>()
  for (const item of items) {
    const key = item[0] as string
    const values = transform ? (item[1] as any[]).map(transform) : item[1] as T[]
    map.set(key, values)
  }
  return map
}

function toBigInt(value: any): bigint {
  return BigInt(value.toString())
}

/**
 * Helper to get a value from decoded event data
 */
export function getAddress(data: DecodedEventData, key: string): string | undefined {
  return data.addressItems.get(key)
}

export function getUint(data: DecodedEventData, key: string): bigint | undefined {
  return data.uintItems.get(key)
}

export function getInt(data: DecodedEventData, key: string): bigint | undefined {
  return data.intItems.get(key)
}

export function getBool(data: DecodedEventData, key: string): boolean | undefined {
  return data.boolItems.get(key)
}

export function getBytes32(data: DecodedEventData, key: string): string | undefined {
  return data.bytes32Items.get(key)
}

export function getString(data: DecodedEventData, key: string): string | undefined {
  return data.stringItems.get(key)
}

export function getAddressArray(data: DecodedEventData, key: string): string[] | undefined {
  return data.addressArrayItems.get(key)
}

export function getUintArray(data: DecodedEventData, key: string): bigint[] | undefined {
  return data.uintArrayItems.get(key)
}

export function getBoolArray(data: DecodedEventData, key: string): boolean[] | undefined {
  return data.boolArrayItems.get(key)
}
