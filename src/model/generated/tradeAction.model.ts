import {Entity as Entity_, Column as Column_, PrimaryColumn as PrimaryColumn_, StringColumn as StringColumn_, Index as Index_, IntColumn as IntColumn_, BooleanColumn as BooleanColumn_, BigIntColumn as BigIntColumn_, ManyToOne as ManyToOne_} from "@subsquid/typeorm-store"
import {Transaction} from "./transaction.model"

@Entity_()
export class TradeAction {
    constructor(props?: Partial<TradeAction>) {
        Object.assign(this, props)
    }

    @PrimaryColumn_()
    id!: string

    @Index_()
    @StringColumn_({nullable: false})
    account!: string

    @Index_()
    @StringColumn_({nullable: false})
    eventName!: string

    @Index_()
    @StringColumn_({nullable: true})
    marketAddress!: string | undefined | null

    @IntColumn_({nullable: false})
    orderType!: number

    @Index_()
    @StringColumn_({nullable: false})
    orderKey!: string

    @BooleanColumn_({nullable: true})
    isLong!: boolean | undefined | null

    @StringColumn_({array: true, nullable: false})
    swapPath!: (string)[]

    @StringColumn_({nullable: false})
    initialCollateralTokenAddress!: string

    @BigIntColumn_({nullable: false})
    initialCollateralDeltaAmount!: bigint

    @BigIntColumn_({nullable: true})
    sizeDeltaUsd!: bigint | undefined | null

    @BigIntColumn_({nullable: true})
    sizeDeltaInTokens!: bigint | undefined | null

    @BigIntColumn_({nullable: true})
    acceptablePrice!: bigint | undefined | null

    @BigIntColumn_({nullable: true})
    executionPrice!: bigint | undefined | null

    @BigIntColumn_({nullable: true})
    triggerPrice!: bigint | undefined | null

    @BigIntColumn_({nullable: true})
    contractTriggerPrice!: bigint | undefined | null

    @BigIntColumn_({nullable: true})
    indexTokenPriceMin!: bigint | undefined | null

    @BigIntColumn_({nullable: true})
    indexTokenPriceMax!: bigint | undefined | null

    @BigIntColumn_({nullable: true})
    collateralTokenPriceMin!: bigint | undefined | null

    @BigIntColumn_({nullable: true})
    collateralTokenPriceMax!: bigint | undefined | null

    @BigIntColumn_({nullable: true})
    minOutputAmount!: bigint | undefined | null

    @BigIntColumn_({nullable: true})
    executionAmountOut!: bigint | undefined | null

    @BigIntColumn_({nullable: true})
    positionFeeAmount!: bigint | undefined | null

    @BigIntColumn_({nullable: true})
    borrowingFeeAmount!: bigint | undefined | null

    @BigIntColumn_({nullable: true})
    fundingFeeAmount!: bigint | undefined | null

    @BigIntColumn_({nullable: true})
    liquidationFeeAmount!: bigint | undefined | null

    @BigIntColumn_({nullable: true})
    collateralTotalCostAmount!: bigint | undefined | null

    @BigIntColumn_({nullable: true})
    pnlUsd!: bigint | undefined | null

    @BigIntColumn_({nullable: true})
    basePnlUsd!: bigint | undefined | null

    @BigIntColumn_({nullable: true})
    priceImpactUsd!: bigint | undefined | null

    @BigIntColumn_({nullable: true})
    priceImpactDiffUsd!: bigint | undefined | null

    @BigIntColumn_({nullable: true})
    priceImpactAmount!: bigint | undefined | null

    @BigIntColumn_({nullable: true})
    swapImpactUsd!: bigint | undefined | null

    @StringColumn_({nullable: true})
    twapGroupId!: string | undefined | null

    @IntColumn_({nullable: true})
    numberOfParts!: number | undefined | null

    @BigIntColumn_({nullable: true})
    totalImpactUsd!: bigint | undefined | null

    @BigIntColumn_({nullable: true})
    proportionalPendingImpactUsd!: bigint | undefined | null

    @StringColumn_({nullable: true})
    reason!: string | undefined | null

    @StringColumn_({nullable: true})
    reasonBytes!: string | undefined | null

    @BooleanColumn_({nullable: true})
    shouldUnwrapNativeToken!: boolean | undefined | null

    @IntColumn_({nullable: true})
    decreasePositionSwapType!: number | undefined | null

    @StringColumn_({nullable: false})
    uiFeeReceiver!: string

    @BigIntColumn_({nullable: true})
    srcChainId!: bigint | undefined | null

    @Index_()
    @ManyToOne_(() => Transaction, {nullable: true})
    transaction!: Transaction

    @Index_()
    @IntColumn_({nullable: false})
    timestamp!: number
}
