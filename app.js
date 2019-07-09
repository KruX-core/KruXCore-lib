const { Blockchain } = require('./Blockchain'),
      { Transaction } = require('./Transaction'),
      EC = require('elliptic').ec,
      ec = new EC('secp256k1');


const key = ec.keyFromPrivate('3236f563f41037771bc70d0cdd13b8f823c371cea08dd55ab6f8ace221d33718');
const walletAddr = key.getPublic('hex');

function mineBlock(Coin, address) {
    Coin.mineCurrentBlock(address);
}


// Instanciate a new Blockchain
let Coin = new Blockchain();

// Add our wallet as a registered address
Coin.addWalletAddress(walletAddr);

// Create and sign a transaction
let tx1 = new Transaction(Date.now(), walletAddr, 'public key goes here', 25);
tx1.signTx(key);
console.log(`Transaction successfully signed!`);

// Mine the 2nd and 3rd block
mineBlock(Coin, walletAddr);
mineBlock(Coin, walletAddr);

// Add the transaction to the pending transactions
Coin.addTransaction(tx1);

// Get the balance again
console.log(`\nBalance for ${walletAddr}: ${Coin.getBalanceForAddress(walletAddr)}\n`);

while (Coin.getBlockHeight() <= 5000) {
    mineBlock(Coin, walletAddr);
}

console.log(`\nBlockchain is at height ${Coin.getBlockHeight()}!`);
console.log(`\nIs blockchain valid? ${Coin.isChainValid()}`);
