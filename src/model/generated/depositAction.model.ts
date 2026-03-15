import {Entity as Entity_, Column as Column_, PrimaryColumn as PrimaryColumn_, StringColumn as StringColumn_, Index as Index_, BigIntColumn as BigIntColumn_, IntColumn as IntColumn_, ManyToOne as ManyToOne_} from "@subsquid/typeorm-store"
import {Transaction} from "./transaction.model"

@Entity_()
export class DepositAction {
    constructor(props?: Partial<DepositAction>) {
        Object.assign(this, props)
    }

    @PrimaryColumn_()
    id!: string

    @Index_()
    @StringColumn_({nullable: false})
    account!: string

    @Index_()
    @StringColumn_({nullable: false})
    eventName!: string

    @Index_()
    @StringColumn_({nullable: false})
    marketAddress!: string

    @BigIntColumn_({nullable: true})
    initialLongToken!: bigint | undefined | null

    @BigIntColumn_({nullable: true})
    initialShortToken!: bigint | undefined | null

    @BigIntColumn_({nullable: true})
    receivedMarketTokens!: bigint | undefined | null

    @BigIntColumn_({nullable: true})
    executionFee!: bigint | undefined | null

    @BigIntColumn_({nullable: true})
    callbackGasLimit!: bigint | undefined | null

    @Index_()
    @StringColumn_({nullable: false})
    key!: string

    @Index_()
    @IntColumn_({nullable: false})
    timestamp!: number

    @Index_()
    @ManyToOne_(() => Transaction, {nullable: true})
    transaction!: Transaction
}
