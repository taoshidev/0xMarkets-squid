import {Entity as Entity_, Column as Column_, PrimaryColumn as PrimaryColumn_, StringColumn as StringColumn_, Index as Index_, BigIntColumn as BigIntColumn_, IntColumn as IntColumn_} from "@subsquid/typeorm-store"

@Entity_()
export class PositionsVolume {
    constructor(props?: Partial<PositionsVolume>) {
        Object.assign(this, props)
    }

    @PrimaryColumn_()
    id!: string

    @Index_()
    @StringColumn_({nullable: false})
    market!: string

    @BigIntColumn_({nullable: false})
    volume!: bigint

    @Index_()
    @IntColumn_({nullable: false})
    timestamp!: number
}
