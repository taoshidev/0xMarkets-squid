import {Entity as Entity_, Column as Column_, PrimaryColumn as PrimaryColumn_, StringColumn as StringColumn_, Index as Index_, BigIntColumn as BigIntColumn_, IntColumn as IntColumn_, ManyToOne as ManyToOne_} from "@subsquid/typeorm-store"
import {Transaction} from "./transaction.model"

@Entity_()
export class GlvWithdrawalAction {
    constructor(props?: Partial<GlvWithdrawalAction>) {
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
    glvAddress!: string

    @StringColumn_({nullable: true})
    marketAddress!: string | undefined | null

    @BigIntColumn_({nullable: true})
    glvTokenAmount!: bigint | undefined | null

    @BigIntColumn_({nullable: true})
    receivedLongTokenAmount!: bigint | undefined | null

    @BigIntColumn_({nullable: true})
    receivedShortTokenAmount!: bigint | undefined | null

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
