import {Entity as Entity_, Column as Column_, PrimaryColumn as PrimaryColumn_, StringColumn as StringColumn_, Index as Index_, BigIntColumn as BigIntColumn_, IntColumn as IntColumn_, BooleanColumn as BooleanColumn_} from "@subsquid/typeorm-store"

@Entity_()
export class Price {
    constructor(props?: Partial<Price>) {
        Object.assign(this, props)
    }

    @PrimaryColumn_()
    id!: string

    @Index_()
    @StringColumn_({nullable: false})
    token!: string

    @BigIntColumn_({nullable: false})
    minPrice!: bigint

    @BigIntColumn_({nullable: false})
    maxPrice!: bigint

    @Index_()
    @IntColumn_({nullable: false})
    snapshotTimestamp!: number

    @BooleanColumn_({nullable: false})
    isSnapshot!: boolean

    @StringColumn_({nullable: false})
    type!: string
}
