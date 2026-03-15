import {Entity as Entity_, Column as Column_, PrimaryColumn as PrimaryColumn_, StringColumn as StringColumn_, Index as Index_, IntColumn as IntColumn_, BigIntColumn as BigIntColumn_, BooleanColumn as BooleanColumn_} from "@subsquid/typeorm-store"

@Entity_()
export class PeriodAccountStat {
    constructor(props?: Partial<PeriodAccountStat>) {
        Object.assign(this, props)
    }

    @PrimaryColumn_()
    id!: string

    @Index_()
    @StringColumn_({nullable: false})
    account!: string

    @Index_()
    @IntColumn_({nullable: false})
    periodStart!: number

    @IntColumn_({nullable: false})
    periodEnd!: number

    @IntColumn_({nullable: false})
    closedCount!: number

    @IntColumn_({nullable: false})
    wins!: number

    @IntColumn_({nullable: false})
    losses!: number

    @BigIntColumn_({nullable: false})
    volume!: bigint

    @BigIntColumn_({nullable: false})
    cumsumSize!: bigint

    @BigIntColumn_({nullable: false})
    cumsumCollateral!: bigint

    @BigIntColumn_({nullable: false})
    sumMaxSize!: bigint

    @BigIntColumn_({nullable: false})
    maxCapital!: bigint

    @BigIntColumn_({nullable: false})
    netCapital!: bigint

    @BigIntColumn_({nullable: false})
    totalDepositedUsd0!: bigint

    @BigIntColumn_({nullable: false})
    realizedPnl!: bigint

    @BigIntColumn_({nullable: false})
    realizedFees!: bigint

    @BigIntColumn_({nullable: false})
    realizedPriceImpact!: bigint

    @BigIntColumn_({nullable: false})
    startUnrealizedPnl!: bigint

    @BigIntColumn_({nullable: false})
    startUnrealizedFees!: bigint

    @BigIntColumn_({nullable: false})
    startUnrealizedPriceImpact!: bigint

    @BooleanColumn_({nullable: false})
    hasRank!: boolean
}
