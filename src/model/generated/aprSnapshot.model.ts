import {Entity as Entity_, Column as Column_, PrimaryColumn as PrimaryColumn_, StringColumn as StringColumn_, Index as Index_, BigIntColumn as BigIntColumn_, IntColumn as IntColumn_} from "@subsquid/typeorm-store"

@Entity_()
export class AprSnapshot {
    constructor(props?: Partial<AprSnapshot>) {
        Object.assign(this, props)
    }

    @PrimaryColumn_()
    id!: string

    @Index_()
    @StringColumn_({nullable: false})
    address!: string

    @BigIntColumn_({nullable: false})
    aprByFee!: bigint

    @BigIntColumn_({nullable: false})
    aprByBorrowingFee!: bigint

    @Index_()
    @IntColumn_({nullable: false})
    snapshotTimestamp!: number
}
