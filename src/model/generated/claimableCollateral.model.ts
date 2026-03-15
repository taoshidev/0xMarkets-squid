import {Entity as Entity_, Column as Column_, PrimaryColumn as PrimaryColumn_, StringColumn as StringColumn_, Index as Index_, BigIntColumn as BigIntColumn_, BooleanColumn as BooleanColumn_, IntColumn as IntColumn_} from "@subsquid/typeorm-store"

@Entity_()
export class ClaimableCollateral {
    constructor(props?: Partial<ClaimableCollateral>) {
        Object.assign(this, props)
    }

    @PrimaryColumn_()
    id!: string

    @Index_()
    @StringColumn_({nullable: false})
    account!: string

    @StringColumn_({nullable: false})
    marketAddress!: string

    @StringColumn_({nullable: false})
    tokenAddress!: string

    @StringColumn_({nullable: false})
    timeKey!: string

    @BigIntColumn_({nullable: false})
    value!: bigint

    @BigIntColumn_({nullable: false})
    factor!: bigint

    @BigIntColumn_({nullable: false})
    reductionFactor!: bigint

    @BigIntColumn_({nullable: false})
    factorByTime!: bigint

    @BooleanColumn_({nullable: false})
    claimed!: boolean

    @IntColumn_({nullable: false})
    updatedAt!: number
}
