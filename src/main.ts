import {run} from '@subsquid/batch-processor'
import {augmentBlock} from '@subsquid/solana-objects'
import {DataSourceBuilder} from '@subsquid/solana-stream'
import {TypeormDatabase} from '@subsquid/typeorm-store'
import assert from 'assert'
import * as tokenProgram from './abi/token-program'
import * as whirlpool from './abi/whirlpool'
import {Exchange} from './model'

const dataSource = new DataSourceBuilder()
    .setPortal({
        url: 'https://portal.sqd.dev/datasets/solana-devnet',
        http: {
            retryAttempts: Infinity
        }
    })
    .setBlockRange({from: 414512584, to: 414512584})
    .setFields({
        block: { // block header fields
            timestamp: true
        },
        transaction: { // transaction fields
            signatures: true
        },
        instruction: { // instruction fields
            programId: true,
            accounts: true,
            data: true
        },
        tokenBalance: { // token balance record fields
            preAmount: true,
            postAmount: true,
            preOwner: true,
            postOwner: true
        }
    })
    .addInstruction({
        where: {
            programId: ['cpamdpZCGKUy5JxQXB4dcpGPiikHawvSWAd6mEn1sGG'],
//            d8: ['0xf8c69e91e17587c'],
            isCommitted: true // where successfully committed
        },
        // for each instruction selected above
        // make sure to also include:
        include: {
            innerInstructions: true, // inner instructions
            transaction: true, // transaction, that executed the given instruction
            transactionTokenBalances: true, // all token balance records of executed transaction
        }
    })
    .build()

const database = new TypeormDatabase({supportHotBlocks: true})

run(dataSource, database, async ctx => {
    let blocks = ctx.blocks.map(augmentBlock)

    for (let block of blocks) {
        for (let ins of block.instructions) {
            if ( ! ( ins.instructionAddress[0] === 5 && ins.instructionAddress.length === 1 ) ) continue
            console.log(ins.transaction?.signatures[0])
            console.log(ins)
            console.log(ins.inner)
        }
    }
})
