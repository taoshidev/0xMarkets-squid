import {Entity as Entity_, Column as Column_, PrimaryColumn as PrimaryColumn_, StringColumn as StringColumn_, Index as Index_, ManyToOne as ManyToOne_, IntColumn as IntColumn_} from "@subsquid/typeorm-store"
import {Transaction} from "./transaction.model"

@Entity_()
export class Distribution {
    constructor(props?: Partial<Distribution>) {
        Object.assign(this, props)
    }

    @PrimaryColumn_()
    id!: string

    @Index_()
    @StringColumn_({nullable: false})
    receiver!: string

    @StringColumn_({nullable: false})
    typeId!: string

    @StringColumn_({array: true, nullable: false})
    amounts!: (string)[]

    @StringColumn_({array: true, nullable: false})
    amountsInUsd!: (string)[]

    @StringColumn_({array: true, nullable: false})
    tokens!: (string)[]

    @Index_()
    @ManyToOne_(() => Transaction, {nullable: true})
    transaction!: Transaction

    @Index_()
    @IntColumn_({nullable: false})
    timestamp!: number
}
