const express = require("express"),
      bodyparser = require('body-parser'),
      websocket = require("ws"),
      {Blockchain, Block, Transaction} = require('./blockchain'),
      EC = require('elliptic').ec,
      ec = new EC('secp256k1');


const RPC_PORT = 63214;
const P2P_PORT = 41236;

const key = ec.keyFromPrivate('3236f563f41037771bc70d0cdd13b8f823c371cea08dd55ab6f8ace221d33718');
const walletAddr = key.getPublic('hex');

// Initialize some variables
var websockets = [];
var MessageType = {
    QUERY_LATEST: 0,
    QUERY_ALL: 1,
    RESPONSE_BLOCKCHAIN: 2
};

function mineBlock(Coin, address) {
    console.log("\nMining block at height " + (Coin.getBlockHeight() + 1) + "...");
    Coin.mineCurrentBlock(address);
}


// Instanciate a new Blockchain
let Coin = new Blockchain();

// Add our wallet as a registered address
Coin.addWalletAddress(walletAddr);

// Create and sign a transaction
let tx1 = new Transaction(Date.now(), walletAddr, 'public key goes here', 25);
tx1.signTx(key);
console.log("Transaction successfully signed!");

// Mine the 2nd and 3rd block
mineBlock(Coin, walletAddr);

// Add the transaction to the pending transactions
Coin.addTransaction(tx1);

// Get the balance again
console.log(`\nBalance for ${walletAddr}: ${Coin.getBalanceForAddress(walletAddr)}\n`);


console.log("\nBlockchain is at height " + Coin.getBlockHeight() + "!");
console.log("\nIs blockchain valid? " + Coin.isChainValid());
