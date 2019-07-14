const { Blockchain } = require('./Blockchain'),
      { Transaction } = require('./Transaction'),
      EC = require('elliptic').ec,
      ec = new EC('secp256k1');

const key1 = ec.keyFromPrivate('3236f563f41037771bc70d0cdd13b8f823c371cea08dd55ab6f8ace221d33718');
const key2 = ec.keyFromPrivate('be3c0c3143be5594b47a09ba12c805aaaecc1ee003143376dbb7017d231316ac');
const key3 = ec.keyFromPrivate('abe26910fb34a71150100aede4fd1707c01e0abdefec83f242a95ed61004173d');

const walletAddr1 = key1.getPublic('hex');
const walletAddr2 = key2.getPublic('hex');
const walletAddr3 = key3.getPublic('hex');

const verbose = true;
const difficulty = 3;

// Instanciate a new Blockchain
let Coin = new Blockchain({ verbose: verbose, difficulty: difficulty });

// Add our wallets as a registered address
Coin.addWalletAddress(walletAddr1);
Coin.addWalletAddress(walletAddr2);
Coin.addWalletAddress(walletAddr3);

const startTime = new Date();

// Create and sign a transaction
let tx1 = new Transaction(Date.now(), walletAddr1, walletAddr2, 1);
tx1.signTx(key1);
console.log(`Transaction successfully signed!`);
console.log(`Block reward: ${Coin.blockReward}`)

let memoryUsageMiningStarted = process.memoryUsage()

// Mine the 2nd and 3rd block
Coin.mineCurrentBlock(walletAddr1);
Coin.mineCurrentBlock(walletAddr1);

// Add the transaction to the pending transactions
Coin.addTransaction(tx1);

while (Coin.getBlockHeight() < 2500) { // mine 2.5k blocks
    Coin.mineCurrentBlock(walletAddr1);
}

let memoryUsageMiningFinished = process.memoryUsage()

const validateStartTime = new Date();
let memoryUsageValidationStarted = process.memoryUsage()

console.log(`\nIs blockchain valid? ${Coin.isChainValid()}`);

const validateFinishedTime = new Date();
let memoryUsageValidationFinished = process.memoryUsage()

console.log('\nCopy paste me\n------------------------------------')
console.log(`\nDifficulty ${difficulty}`)
console.log(`Mining took ${validateStartTime - startTime} milliseconds`)
console.log(`Mining time per block is ${(validateStartTime - startTime) / Coin.getBlockHeight()} milliseconds`)
console.log(`Validating took ${validateFinishedTime - validateStartTime} milliseconds`)
console.log(`Validation time per block is ${(validateFinishedTime - validateStartTime) / Coin.getBlockHeight()} milliseconds`)
console.log(`Memory usage before mining: ${memoryUsageMiningStarted.rss / 1024 / 1024} MB`);
console.log(`Memory usage after mining: ${memoryUsageMiningFinished.rss / 1024 / 1024} MB`);
console.log(`Memory usage before validating: ${memoryUsageValidationStarted.rss / 1024 / 1024} MB`);
console.log(`Memory usage after validating: ${memoryUsageValidationFinished.rss / 1024 / 1024} MB`);
