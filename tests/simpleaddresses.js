/* eslint-disable no-console */

const { Blockchain, Transaction } = require('..');
const EC = require('elliptic').ec;
const ec = new EC('secp256k1');

const key1 = ec.keyFromPrivate('3236f563f41037771bc70d0cdd13b8f823c371cea08dd55ab6f8ace221d33718');
const key2 = ec.keyFromPrivate('be3c0c3143be5594b47a09ba12c805aaaecc1ee003143376dbb7017d231316ac');

const walletAddr1 = key1.getPublic('hex');
const walletAddr2 = key2.getPublic('hex');

const verbose = false;
const difficulty = 1;
const blocksToMine = 15;

// Instanciate a new Blockchain
const Coin = new Blockchain({
    genesisTimestamp: 1556735351,
    verbose: true,
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
