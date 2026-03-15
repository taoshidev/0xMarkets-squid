import {Entity as Entity_, Column as Column_, PrimaryColumn as PrimaryColumn_, StringColumn as StringColumn_, Index as Index_, BooleanColumn as BooleanColumn_, IntColumn as IntColumn_, ManyToOne as ManyToOne_} from "@subsquid/typeorm-store"
import {Transaction} from "./transaction.model"

@Entity_()
export class ClaimAction {
    constructor(props?: Partial<ClaimAction>) {
        Object.assign(this, props)
    }

    @PrimaryColumn_()
    id!: string

    @Index_()
    @StringColumn_({nullable: false})
    account!: string

    @StringColumn_({nullable: false})
    eventName!: string

    @StringColumn_({array: true, nullable: false})
    marketAddresses!: (string)[]

    @StringColumn_({array: true, nullable: false})
    tokenAddresses!: (string)[]

    @StringColumn_({array: true, nullable: false})
    amounts!: (string)[]

    @StringColumn_({array: true, nullable: false})
    tokenPrices!: (string)[]

    @BooleanColumn_({array: true, nullable: false})
    isLongOrders!: (boolean)[]

    @Index_()
    @IntColumn_({nullable: false})
    timestamp!: number

    @Index_()
    @ManyToOne_(() => Transaction, {nullable: true})
    transaction!: Transaction
}
