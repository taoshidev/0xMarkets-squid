import { ethers } from 'ethers'

/**
 * Decoded event data from EventEmitter
 */
export interface DecodedEventData {
  eventName: string
  msgSender: string
  topic1?: string  // Only for EventLog2
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

// ABI for decoding EventLog1 and EventLog2
const EVENT_LOG1_ABI = [
  'event EventLog1(address msgSender, string eventName, string indexed eventNameHash, tuple(tuple(tuple(string key, address value)[] items, tuple(string key, address[] value)[] arrayItems) addressItems, tuple(tuple(string key, uint256 value)[] items, tuple(string key, uint256[] value)[] arrayItems) uintItems, tuple(tuple(string key, int256 value)[] items, tuple(string key, int256[] value)[] arrayItems) intItems, tuple(tuple(string key, bool value)[] items, tuple(string key, bool[] value)[] arrayItems) boolItems, tuple(tuple(string key, bytes32 value)[] items, tuple(string key, bytes32[] value)[] arrayItems) bytes32Items, tuple(tuple(string key, bytes value)[] items, tuple(string key, bytes[] value)[] arrayItems) bytesItems, tuple(tuple(string key, string value)[] items, tuple(string key, string[] value)[] arrayItems) stringItems) eventData)'
]

const EVENT_LOG2_ABI = [
  'event EventLog2(address msgSender, string eventName, string indexed eventNameHash, bytes32 indexed topic1, tuple(tuple(tuple(string key, address value)[] items, tuple(string key, address[] value)[] arrayItems) addressItems, tuple(tuple(string key, uint256 value)[] items, tuple(string key, uint256[] value)[] arrayItems) uintItems, tuple(tuple(string key, int256 value)[] items, tuple(string key, int256[] value)[] arrayItems) intItems, tuple(tuple(string key, bool value)[] items, tuple(string key, bool[] value)[] arrayItems) boolItems, tuple(tuple(string key, bytes32 value)[] items, tuple(string key, bytes32[] value)[] arrayItems) bytes32Items, tuple(tuple(string key, bytes value)[] items, tuple(string key, bytes[] value)[] arrayItems) bytesItems, tuple(tuple(string key, string value)[] items, tuple(string key, string[] value)[] arrayItems) stringItems) eventData)'
]

const iface1 = new ethers.Interface(EVENT_LOG1_ABI)
const iface2 = new ethers.Interface(EVENT_LOG2_ABI)

/**
 * Decode EventLog1 or EventLog2 from raw log data
 */
export function decodeEventLog(
  topics: string[],
  data: string,
  isEventLog2: boolean
): DecodedEventData {
  const iface = isEventLog2 ? iface2 : iface1
  const eventFragment = isEventLog2 ? 'EventLog2' : 'EventLog1'

  const decoded = iface.decodeEventLog(eventFragment, data, topics)

  const eventData = isEventLog2 ? decoded[4] : decoded[3]

  return {
    eventName: decoded[1] as string,
    msgSender: decoded[0] as string,
    topic1: isEventLog2 ? decoded[3] as string : undefined,

    // Address items
    addressItems: extractItems(eventData.addressItems.items),
    addressArrayItems: extractArrayItems(eventData.addressItems.arrayItems),

    // Uint items
    uintItems: extractItems(eventData.uintItems.items, toBigInt),
    uintArrayItems: extractArrayItems(eventData.uintItems.arrayItems, toBigInt),

    // Int items
    intItems: extractItems(eventData.intItems.items, toBigInt),
    intArrayItems: extractArrayItems(eventData.intItems.arrayItems, toBigInt),

    // Bool items
    boolItems: extractItems(eventData.boolItems.items),
    boolArrayItems: extractArrayItems(eventData.boolItems.arrayItems),

    // Bytes32 items
    bytes32Items: extractItems(eventData.bytes32Items.items),
    bytes32ArrayItems: extractArrayItems(eventData.bytes32Items.arrayItems),

    // Bytes items
    bytesItems: extractItems(eventData.bytesItems.items),
    bytesArrayItems: extractArrayItems(eventData.bytesItems.arrayItems),

    // String items
    stringItems: extractItems(eventData.stringItems.items),
    stringArrayItems: extractArrayItems(eventData.stringItems.arrayItems),
  }
}

function extractItems<T>(
  items: Array<{ key: string; value: T }>,
  transform?: (v: T) => T
): Map<string, T> {
  const map = new Map<string, T>()
  for (const item of items) {
    const value = transform ? transform(item.value) : item.value
    map.set(item.key, value)
  }
  return map
}

function extractArrayItems<T>(
  items: Array<{ key: string; value: T[] }>,
  transform?: (v: T) => T
): Map<string, T[]> {
  const map = new Map<string, T[]>()
  for (const item of items) {
    const values = transform ? item.value.map(transform) : item.value
    map.set(item.key, values as T[])
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
