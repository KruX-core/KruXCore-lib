/* eslint-disable no-console */

const { Blockchain, Transaction } = require('..');
const EC = require('elliptic').ec;
const ec = new EC('ed25519');

const key1 = ec.keyFromPrivate('0b6f9d218d9afe11bcc60c10918b14b9402c45a282aae76e94547fa2f5909c64');
const key2 = ec.keyFromPrivate('0d7e75bb7d059c995b9469d7f8e3157dea215c152bdcd9b4e8ccfbe643cd25d2');

const walletAddr1 = key1.getPublic('hex');
const walletAddr2 = key2.getPublic('hex');

const verbose = false;
const difficulty = 1;
const blocksToMine = 15;

// Instanciate a new Blockchain
const Coin = new Blockchain({
    genesisTimestamp: 1556735351,
    verbose: verbose,
    difficulty: difficulty,
    txFee: 0.1,
    premineAddress: 'Genesis',
    premineAmount: 1000
});

// Add our wallets as a registered address
Coin.addWalletAddress(walletAddr1);
Coin.addWalletAddress(walletAddr2);
Coin.addWalletAddress(walletAddr2);

const startTime = new Date();

// Create and sign a transaction
let tx1 = new Transaction(Date.now(), walletAddr1, walletAddr2, 1);
tx1.signTx(key1);
console.log('Transaction successfully signed!');

let memoryUsageMiningStarted = process.memoryUsage();

// Mine the 2nd and 3rd block
Coin.mineCurrentBlock(walletAddr1);
Coin.mineCurrentBlock(walletAddr1);

// Add the transaction to the pending transactions
Coin.addTransaction(tx1);

while (Coin.getBlockHeight() < blocksToMine) { // mine 2.5k blocks
    Coin.mineCurrentBlock(walletAddr1);
}

let memoryUsageMiningFinished = process.memoryUsage();

const validateStartTime = new Date();

console.log(`\nIs blockchain valid? ${Coin.isChainValid()}`);

const validateFinishedTime = new Date();
let memoryUsageValidationFinished = process.memoryUsage();

console.log('\nCopy paste me\n------------------------------------');
console.log(`\n## Difficulty ${difficulty}\n`);
console.log(`${blocksToMine} blocks mined`);
console.log(`Mining took ${validateStartTime - startTime} milliseconds`);
console.log(`Mining time per block is ${(validateStartTime - startTime) / Coin.getBlockHeight()} milliseconds`);
console.log(`Validating took ${validateFinishedTime - validateStartTime} milliseconds`);
console.log(`Validation time per block is ${(validateFinishedTime - validateStartTime) / Coin.getBlockHeight()} milliseconds`);
console.log(`Memory usage before mining: ${memoryUsageMiningStarted.rss / 1024 / 1024} MB`);
console.log(`Memory usage after mining: ${memoryUsageMiningFinished.rss / 1024 / 1024} MB`);
console.log(`Memory usage after validating: ${memoryUsageValidationFinished.rss / 1024 / 1024} MB`);
