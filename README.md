# 0xMarkets Squid

Subsquid indexer for the 0xMarkets protocol on Base Sepolia.

## Quick Start

### Prerequisites

- Node.js 18+
- Docker (for local Postgres)
- Subsquid CLI: `npm i -g @subsquid/cli`

### Setup

```bash
# Install dependencies
npm install

# Copy environment file
cp .env.example .env

# Generate TypeORM models from schema
npm run codegen

# Generate ABI types
npm run typegen

# Start local Postgres
sqd up

# Apply database migrations
sqd migration:apply

# Build the project
npm run build

# Start the processor
npm run process
```

### Run GraphQL API

In a separate terminal:

```bash
npm run serve
```

GraphQL playground available at: http://localhost:4350/graphql

## Development

### Update Schema

1. Edit `schema.graphql`
2. Regenerate models: `npm run codegen`
3. Generate migration: `npm run migration:generate`
4. Apply migration: `npm run migration:apply`

### Reset Database

```bash
npm run db:reset
```

## Deployment

### Deploy to Subsquid Cloud

```bash
# Login to Subsquid Cloud
sqd auth -k YOUR_API_KEY

# Deploy
sqd deploy .
```

## Architecture

- **Processor**: Fetches events from Subsquid Archive and decodes them
- **EventEmitter**: Generic event system - all events come through one contract
- **Handlers**: Route events by name to specific processing logic

## Indexed Events

### Trading
- OrderCreated, OrderExecuted, OrderCancelled, OrderUpdated, OrderFrozen
- PositionIncrease, PositionDecrease

### Liquidity
- DepositCreated, DepositExecuted, DepositCancelled
- WithdrawalCreated, WithdrawalExecuted, WithdrawalCancelled

### Claims
- FundingFeesClaimed, CollateralClaimed
- ClaimableCollateralUpdated

## Example Queries

### Get trade history for an account

```graphql
query GetTradeHistory($account: String!) {
  tradeActions(
    where: { account_eq: $account }
    orderBy: timestamp_DESC
    limit: 50
  ) {
    id
    eventName
    marketAddress
    isLong
    sizeDeltaUsd
    executionPrice
    pnlUsd
    timestamp
    txHash
  }
}
```

### Get deposits for a market

```graphql
query GetDeposits($market: String!) {
  depositActions(
    where: { marketAddress_eq: $market, eventName_eq: "DepositExecuted" }
    orderBy: timestamp_DESC
  ) {
    account
    initialLongToken
    initialShortToken
    receivedMarketTokens
    timestamp
  }
}
```
