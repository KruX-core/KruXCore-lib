/* eslint-disable no-console */

const { Blockchain, Transaction } = require('..');
const EC = require('elliptic').ec;
const ec = new EC('secp256k1');

// Transaction settings
const numOfAdresses = 5;
const numOfCoinsSentPerTx = 1;

// Blockchain settings
const difficulty = 0;
const numOfBlocksToMine = 100;

const numOfTestRuns = 10;
let results = [];

for (let i = 0; i < numOfTestRuns; i++) {
    let addresses = [];

    const Coin = new Blockchain({
        genesisTimestamp: 1556735351,
        verbose: true,
        difficulty: difficulty,
        txFee: 0.1,
        premineAddress: 'Genesis',
        premineAmount: 1000
    });

    console.log(`Genesis block: ${JSON.stringify(Coin.getLatestBlock(), null, 4)}`);

    // Generate n keys with a public and private keypair, save them to the addresses array
    // and register them on the blockchain
    for (let i = 0; i < numOfAdresses; i++) {
        const key = ec.genKeyPair();
        const pubKey = key.getPublic('hex');
        const privKey = key.getPrivate('hex');

        addresses.push({ key: key, pubKey: pubKey, privKey: privKey });
        Coin.addWalletAddress(pubKey);
    }

    // console.log(`${numOfAdresses} addresses have been generated and registered!`);

    // Get the start time and memory usage
    const startTime = new Date();
    let memoryUsageMiningStarted = process.memoryUsage();

    while (Coin.getBlockHeight() < numOfBlocksToMine) {
        // Generate two random numbers to select two addresses for the transaction
        const num1 = Math.floor(Math.random() * numOfAdresses);

        for (let i = 0; i < addresses.length; i++) {
            // Generate two random numbers to select two addresses for the transaction
            const num2 = Math.floor(Math.random() * numOfAdresses);
            const num3 = Math.floor(Math.random() * numOfAdresses);

            // Check that we're not sending the transaction to ourselves
            if (num2 !== num3) {
                // Get the addresses from the corresponding numbers
                let address1 = addresses[num2].pubKey;
                let address2 = addresses[num3].pubKey;

                console.log(`Balance of ${address1}: ${Coin.getBalanceForAddress(address1)}`);
                // Check that we have enough coins on that address to send the transaction
                if (Coin.getBalanceForAddress(address1) > numOfCoinsSentPerTx) {
                    // Create the transaction itself
                    let tx = new Transaction(Date.now(), address1, address2, numOfCoinsSentPerTx, 0.1);

                    // Sign the transaction with the key of the sender
                    tx.signTx(addresses[num2].key);

                    // And finally, add the transaction to the transaction pool on the blockchain
                    Coin.addTransaction(tx);
                }
            }
        }

        Coin.mineCurrentBlock(addresses[num1].pubKey);
    }

    // Get time and memory usage after mining
    const validateStartTime = new Date();
    let memoryUsageValidationStarted = process.memoryUsage();

    // Check the blockchain for fuckery
    console.log(`\nIs blockchain valid? ${Coin.isChainValid()}`);

    // Get time and memory usage after validating

    const validateFinishedTime = new Date();
    let memoryUsageValidationFinished = process.memoryUsage();

    results.push({
        timeSpentMining: validateStartTime - startTime,
        timeSpentMiningPerBlock: (validateStartTime - startTime) / Coin.getBlockHeight(),
        timeSpentValidating: validateFinishedTime - validateStartTime,
        timeSpentValidatingPerBlock: (validateFinishedTime - validateStartTime) / Coin.getBlockHeight(),
        memoryBeforeMining: memoryUsageMiningStarted.rss / 1024 / 1024,
        memoryBeforeValidating: memoryUsageValidationStarted.rss / 1024 / 1024,
        memoryAfterValidating: memoryUsageValidationFinished.rss / 1024 / 1024
    });
}

const result = (()=> {
    let _tmp = {
        timeSpentMining: 0,
        timeSpentMiningPerBlock: 0,
        timeSpentValidating: 0,
        timeSpentValidatingPerBlock: 0,

        memoryBeforeMining: 0,
        memoryBeforeValidating: 0,
        memoryAfterValidating: 0
    };

    results.forEach(result => {
        _tmp.timeSpentMining += result.timeSpentMining;
        _tmp.timeSpentMiningPerBlock += result.timeSpentMiningPerBlock;
        _tmp.timeSpentValidating += result.timeSpentValidating;
        _tmp.timeSpentValidatingPerBlock += result.timeSpentValidatingPerBlock;

        _tmp.memoryBeforeMining += result.memoryBeforeMining;
        _tmp.memoryBeforeValidating += result.memoryBeforeValidating;
        _tmp.memoryAfterValidating += result.memoryAfterValidating;
    });

    _tmp = {
        timeSpentMining: _tmp.timeSpentMining / numOfTestRuns,
        timeSpentMiningPerBlock: _tmp.timeSpentMiningPerBlock / numOfTestRuns,
        timeSpentValidating: _tmp.timeSpentValidating / numOfTestRuns,
        timeSpentValidatingPerBlock: _tmp.timeSpentValidatingPerBlock / numOfTestRuns,

        memoryBeforeMining: _tmp.memoryBeforeMining / numOfTestRuns,
        memoryBeforeValidating: _tmp.memoryBeforeValidating / numOfTestRuns,
        memoryAfterValidating: _tmp.memoryAfterValidating / numOfTestRuns
    };

    return _tmp;
})();

console.log('\nCopy paste me\n------------------------------------');
console.log(`\n- difficulty: ${difficulty}`);
console.log(`- time_spent_mining: ${result.timeSpentMining.toFixed(4)}`);
console.log(`  time_spent_mining_per_block: ${result.timeSpentMiningPerBlock.toFixed(4)}`);
console.log(`  time_spent_validating: ${result.timeSpentValidating.toFixed(4)}`);
console.log(`  time_spent_validating_per_block: ${result.timeSpentValidatingPerBlock.toFixed(4)}`);
console.log(`  memory_before_mining: ${result.memoryBeforeMining.toFixed(4)}`);
console.log(`  memory_before_validating: ${result.memoryBeforeValidating.toFixed(4)}`);
console.log(`  memory_after_validating: ${result.memoryAfterValidating.toFixed(4)}`);
