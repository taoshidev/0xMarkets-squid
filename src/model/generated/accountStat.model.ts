import {Entity as Entity_, Column as Column_, PrimaryColumn as PrimaryColumn_, IntColumn as IntColumn_, BigIntColumn as BigIntColumn_} from "@subsquid/typeorm-store"

@Entity_()
export class AccountStat {
    constructor(props?: Partial<AccountStat>) {
        Object.assign(this, props)
    }

    @PrimaryColumn_()
    id!: string

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
    deposits!: bigint

    @BigIntColumn_({nullable: false})
    totalDepositedUsd0!: bigint

    @BigIntColumn_({nullable: false})
    realizedPnl!: bigint

    @BigIntColumn_({nullable: false})
    realizedFees!: bigint

    @BigIntColumn_({nullable: false})
    realizedPriceImpact!: bigint

    @BigIntColumn_({nullable: false})
    realizedSwapImpact!: bigint

    @IntColumn_({nullable: false})
    updatedAt!: number
}
