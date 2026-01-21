/**
 * Generate unique IDs for entities
 */

export function generateLogId(blockHeight: number, logIndex: number): string {
  return `${blockHeight}-${logIndex}`
}

export function generatePositionId(
  account: string,
  market: string,
  collateralToken: string,
  isLong: boolean
): string {
  return `${account}-${market}-${collateralToken}-${isLong ? 'long' : 'short'}`
}

export function generateAccountStatsId(account: string): string {
  return account.toLowerCase()
}

export function generatePeriodAccountStatsId(
  account: string,
  periodStart: Date
): string {
  const timestamp = Math.floor(periodStart.getTime() / 1000)
  return `${account.toLowerCase()}-${timestamp}`
}

export function generateVolumeInfoId(
  market: string,
  period: string,
  timestamp: Date
): string {
  const ts = Math.floor(timestamp.getTime() / 1000)
  return `${market}-${period}-${ts}`
}

export function generateAprSnapshotId(
  address: string,
  timestamp: Date
): string {
  const ts = Math.floor(timestamp.getTime() / 1000)
  return `${address}-${ts}`
}
