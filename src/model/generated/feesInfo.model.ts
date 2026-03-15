import {Entity as Entity_, Column as Column_, PrimaryColumn as PrimaryColumn_, StringColumn as StringColumn_, Index as Index_, BigIntColumn as BigIntColumn_, IntColumn as IntColumn_} from "@subsquid/typeorm-store"

@Entity_()
export class FeesInfo {
    constructor(props?: Partial<FeesInfo>) {
        Object.assign(this, props)
    }

    @PrimaryColumn_()
    id!: string

    @Index_()
    @StringColumn_({nullable: false})
    period!: string

    @BigIntColumn_({nullable: false})
    totalBorrowingFeeUsd!: bigint

    @BigIntColumn_({nullable: false})
    totalPositionFeeUsd!: bigint

    @BigIntColumn_({nullable: false})
    totalLiquidationFeeUsd!: bigint

    @BigIntColumn_({nullable: false})
    totalSwapFeeUsd!: bigint

    @Index_()
    @IntColumn_({nullable: false})
    timestamp!: number
}
