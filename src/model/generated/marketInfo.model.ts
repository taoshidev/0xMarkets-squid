import {Entity as Entity_, Column as Column_, PrimaryColumn as PrimaryColumn_, StringColumn as StringColumn_, Index as Index_, BooleanColumn as BooleanColumn_, BigIntColumn as BigIntColumn_, IntColumn as IntColumn_} from "@subsquid/typeorm-store"

@Entity_()
export class MarketInfo {
    constructor(props?: Partial<MarketInfo>) {
        Object.assign(this, props)
    }

    @PrimaryColumn_()
    id!: string

    @Index_()
    @StringColumn_({nullable: false})
    marketTokenAddress!: string

    @StringColumn_({nullable: false})
    indexTokenAddress!: string

    @StringColumn_({nullable: false})
    longTokenAddress!: string

    @StringColumn_({nullable: false})
    shortTokenAddress!: string

    @BooleanColumn_({nullable: false})
    isDisabled!: boolean

    @BigIntColumn_({nullable: false})
    longPoolAmount!: bigint

    @BigIntColumn_({nullable: false})
    shortPoolAmount!: bigint

    @BigIntColumn_({nullable: false})
    maxLongPoolAmount!: bigint

    @BigIntColumn_({nullable: false})
    maxShortPoolAmount!: bigint

    @BigIntColumn_({nullable: false})
    maxLongPoolUsdForDeposit!: bigint

    @BigIntColumn_({nullable: false})
    maxShortPoolUsdForDeposit!: bigint

    @BigIntColumn_({nullable: false})
    poolValueMax!: bigint

    @BigIntColumn_({nullable: false})
    poolValueMin!: bigint

    @BigIntColumn_({nullable: false})
    reserveFactorLong!: bigint

    @BigIntColumn_({nullable: false})
    reserveFactorShort!: bigint

    @BigIntColumn_({nullable: false})
    openInterestReserveFactorLong!: bigint

    @BigIntColumn_({nullable: false})
    openInterestReserveFactorShort!: bigint

    @BigIntColumn_({nullable: false})
    longOpenInterestUsd!: bigint

    @BigIntColumn_({nullable: false})
    shortOpenInterestUsd!: bigint

    @BigIntColumn_({nullable: false})
    longOpenInterestInTokens!: bigint

    @BigIntColumn_({nullable: false})
    shortOpenInterestInTokens!: bigint

    @BigIntColumn_({nullable: false})
    maxOpenInterestLong!: bigint

    @BigIntColumn_({nullable: false})
    maxOpenInterestShort!: bigint

    @BigIntColumn_({nullable: false})
    minCollateralFactor!: bigint

    @BigIntColumn_({nullable: false})
    minCollateralFactorForOpenInterestLong!: bigint

    @BigIntColumn_({nullable: false})
    minCollateralFactorForOpenInterestShort!: bigint

    @BigIntColumn_({nullable: false})
    fundingFactor!: bigint

    @BigIntColumn_({nullable: false})
    fundingExponentFactor!: bigint

    @BigIntColumn_({nullable: false})
    fundingIncreaseFactorPerSecond!: bigint

    @BigIntColumn_({nullable: false})
    fundingDecreaseFactorPerSecond!: bigint

    @BigIntColumn_({nullable: false})
    thresholdForStableFunding!: bigint

    @BigIntColumn_({nullable: false})
    thresholdForDecreaseFunding!: bigint

    @BigIntColumn_({nullable: false})
    minFundingFactorPerSecond!: bigint

    @BigIntColumn_({nullable: false})
    maxFundingFactorPerSecond!: bigint

    @BigIntColumn_({nullable: false})
    totalBorrowingFees!: bigint

    @BigIntColumn_({nullable: false})
    borrowingFactorPerSecondForLongs!: bigint

    @BigIntColumn_({nullable: false})
    borrowingFactorPerSecondForShorts!: bigint

    @BigIntColumn_({nullable: false})
    positionImpactPoolAmount!: bigint

    @BigIntColumn_({nullable: false})
    minPositionImpactPoolAmount!: bigint

    @BigIntColumn_({nullable: false})
    positionImpactPoolDistributionRate!: bigint

    @BigIntColumn_({nullable: false})
    swapImpactPoolAmountLong!: bigint

    @BigIntColumn_({nullable: false})
    swapImpactPoolAmountShort!: bigint

    @BigIntColumn_({nullable: true})
    lentPositionImpactPoolAmount!: bigint | undefined | null

    @BigIntColumn_({nullable: true})
    positionImpactFactorPositive!: bigint | undefined | null

    @BigIntColumn_({nullable: true})
    positionImpactFactorNegative!: bigint | undefined | null

    @BigIntColumn_({nullable: true})
    maxPositionImpactFactorPositive!: bigint | undefined | null

    @BigIntColumn_({nullable: true})
    maxPositionImpactFactorNegative!: bigint | undefined | null

    @BigIntColumn_({nullable: true})
    maxPositionImpactFactorForLiquidations!: bigint | undefined | null

    @BigIntColumn_({nullable: true})
    positionImpactExponentFactor!: bigint | undefined | null

    @BigIntColumn_({nullable: true})
    swapImpactFactorPositive!: bigint | undefined | null

    @BigIntColumn_({nullable: true})
    swapImpactFactorNegative!: bigint | undefined | null

    @BigIntColumn_({nullable: true})
    swapImpactExponentFactor!: bigint | undefined | null

    @BigIntColumn_({nullable: true})
    maxLendableImpactFactor!: bigint | undefined | null

    @BigIntColumn_({nullable: true})
    maxLendableImpactFactorForWithdrawals!: bigint | undefined | null

    @BigIntColumn_({nullable: true})
    maxLendableImpactUsd!: bigint | undefined | null

    @BigIntColumn_({nullable: false})
    positionFeeFactorForPositiveImpact!: bigint

    @BigIntColumn_({nullable: false})
    positionFeeFactorForNegativeImpact!: bigint

    @BigIntColumn_({nullable: false})
    swapFeeFactorForPositiveImpact!: bigint

    @BigIntColumn_({nullable: false})
    swapFeeFactorForNegativeImpact!: bigint

    @BigIntColumn_({nullable: false})
    atomicSwapFeeFactor!: bigint

    @BigIntColumn_({nullable: false})
    maxPnlFactorForTradersLong!: bigint

    @BigIntColumn_({nullable: false})
    maxPnlFactorForTradersShort!: bigint

    @BigIntColumn_({nullable: true})
    fundingFactorPerSecond!: bigint | undefined | null

    @BooleanColumn_({nullable: true})
    longsPayShorts!: boolean | undefined | null

    @BigIntColumn_({nullable: true})
    virtualPoolAmountForLongToken!: bigint | undefined | null

    @BigIntColumn_({nullable: true})
    virtualPoolAmountForShortToken!: bigint | undefined | null

    @BigIntColumn_({nullable: true})
    virtualInventoryForPositions!: bigint | undefined | null

    @StringColumn_({nullable: true})
    virtualMarketId!: string | undefined | null

    @StringColumn_({nullable: true})
    virtualLongTokenId!: string | undefined | null

    @StringColumn_({nullable: true})
    virtualShortTokenId!: string | undefined | null

    @IntColumn_({nullable: false})
    createdAt!: number

    @IntColumn_({nullable: false})
    updatedAt!: number
}
