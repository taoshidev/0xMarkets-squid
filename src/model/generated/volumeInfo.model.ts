import {Entity as Entity_, Column as Column_, PrimaryColumn as PrimaryColumn_, StringColumn as StringColumn_, Index as Index_, BigIntColumn as BigIntColumn_, IntColumn as IntColumn_} from "@subsquid/typeorm-store"

@Entity_()
export class VolumeInfo {
    constructor(props?: Partial<VolumeInfo>) {
        Object.assign(this, props)
    }

    @PrimaryColumn_()
    id!: string

    @Index_()
    @StringColumn_({nullable: false})
    market!: string

    @StringColumn_({nullable: false})
    period!: string

    @BigIntColumn_({nullable: false})
    volumeUsd!: bigint

    @Index_()
    @IntColumn_({nullable: false})
    timestamp!: number
}
