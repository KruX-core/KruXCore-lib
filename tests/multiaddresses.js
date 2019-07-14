/* eslint-disable no-console */

const { Blockchain } = require('../Blockchain');
const { Transaction } = require('../Transaction');
const EC = require('elliptic').ec;
const ec = new EC('secp256k1');

// Transaction settings
const numOfAdresses = 100;
const numOfCoinsSentPerTx = 1;

// Blockchain settings
const difficulty = 1;
const numOfBlocksToMine = 1000;

let addresses = [];

const Coin = new Blockchain({ verbose: true, difficulty: difficulty });

// Generate n keys with a public and private keypair, save them to the addresses array
// and register them on the blockchain
for (let i = 0; i < numOfAdresses; i++) {
    const key = ec.genKeyPair();
    const pubKey = key.getPublic('hex');
    const privKey = key.getPrivate('hex');

    addresses.push({ key: key, pubKey: pubKey, privKey: privKey });
    Coin.addWalletAddress(pubKey);
}

console.log(`${numOfAdresses} addresses have been generated and registered!`);

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

            // Check that we have enough coins on that address to send the transaction
            if (Coin.getBalanceForAddress(address1) > numOfCoinsSentPerTx) {
                // Create the transaction itself
                let tx = new Transaction(Date.now(), address1, address2, numOfCoinsSentPerTx);

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

// Print out some debug info
console.log('\nCopy paste me\n------------------------------------');
console.log(`\nDifficulty ${difficulty}`);
console.log(`Mining took ${validateStartTime - startTime} milliseconds`);
console.log(`Mining time per block is ${(validateStartTime - startTime) / Coin.getBlockHeight()} milliseconds`);
console.log(`Validating took ${validateFinishedTime - validateStartTime} milliseconds`);
console.log(`Validation time per block is ${(validateFinishedTime - validateStartTime) / Coin.getBlockHeight()} milliseconds`);
console.log(`Memory usage before mining: ${memoryUsageMiningStarted.rss / 1024 / 1024} MB`);
console.log(`Memory usage before validating: ${memoryUsageValidationStarted.rss / 1024 / 1024} MB`);
console.log(`Memory usage after validating: ${memoryUsageValidationFinished.rss / 1024 / 1024} MB`);
