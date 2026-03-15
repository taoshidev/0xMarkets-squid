import {Entity as Entity_, Column as Column_, PrimaryColumn as PrimaryColumn_, StringColumn as StringColumn_, Index as Index_, BooleanColumn as BooleanColumn_, ManyToOne as ManyToOne_, BigIntColumn as BigIntColumn_, IntColumn as IntColumn_} from "@subsquid/typeorm-store"
import {AccountStat} from "./accountStat.model"

@Entity_()
export class Position {
    constructor(props?: Partial<Position>) {
        Object.assign(this, props)
    }

    @PrimaryColumn_()
    id!: string

    @Index_()
    @StringColumn_({nullable: false})
    account!: string

    @Index_()
    @StringColumn_({nullable: false})
    market!: string

    @StringColumn_({nullable: false})
    collateralToken!: string

    @BooleanColumn_({nullable: false})
    isLong!: boolean

    @Index_()
    @ManyToOne_(() => AccountStat, {nullable: true})
    accountStat!: AccountStat

    @BigIntColumn_({nullable: false})
    sizeInUsd!: bigint

    @BigIntColumn_({nullable: false})
    sizeInTokens!: bigint

    @BigIntColumn_({nullable: false})
    collateralAmount!: bigint

    @BigIntColumn_({nullable: false})
    entryPrice!: bigint

    @BigIntColumn_({nullable: false})
    maxSize!: bigint

    @BigIntColumn_({nullable: false})
    realizedFees!: bigint

    @BigIntColumn_({nullable: false})
    unrealizedFees!: bigint

    @BigIntColumn_({nullable: false})
    realizedPriceImpact!: bigint

    @BigIntColumn_({nullable: false})
    unrealizedPriceImpact!: bigint

    @BigIntColumn_({nullable: false})
    realizedPnl!: bigint

    @BigIntColumn_({nullable: false})
    unrealizedPnl!: bigint

    @IntColumn_({nullable: true})
    snapshotTimestamp!: number | undefined | null

    @BooleanColumn_({nullable: false})
    isSnapshot!: boolean

    @IntColumn_({nullable: false})
    createdAt!: number

    @IntColumn_({nullable: false})
    updatedAt!: number
}
