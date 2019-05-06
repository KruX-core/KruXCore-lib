# NodeCoin-lib

This "cryptocurrency" programmed entirely in JavaScript provides a Blockchain with a P2P and RPC connection to other nodes.

## TODO

- [x] Implement a basic blockchain
- [ ] Implement P2P
- [ ] Implement RPC

This is the library for NodeCoin, a coin built on top of NodeJS and CryptoJS.

## API

<!-- Generated by documentation.js. Update this documentation by updating the source code. -->

### Table of Contents

-   [Block](#block)
    -   [Parameters](#parameters)
    -   [calcHash](#calchash)
    -   [mineBlock](#mineblock)
        -   [Parameters](#parameters-1)
        -   [Examples](#examples)
-   [Blockchain](#blockchain)
    -   [airdropCoins](#airdropcoins)
    -   [createGenesisBlock](#creategenesisblock)
    -   [getLatestBlock](#getlatestblock)
        -   [Examples](#examples-1)
    -   [mineCurrentBlock](#minecurrentblock)
        -   [Parameters](#parameters-2)
        -   [Examples](#examples-2)
    -   [validateTx](#validatetx)
        -   [Parameters](#parameters-3)
    -   [addTransaction](#addtransaction)
        -   [Parameters](#parameters-4)
    -   [addWalletAddress](#addwalletaddress)
        -   [Parameters](#parameters-5)
    -   [getBalanceForAddress](#getbalanceforaddress)
        -   [Parameters](#parameters-6)
    -   [getBlockHeight](#getblockheight)
    -   [getBlockAtHeight](#getblockatheight)
        -   [Parameters](#parameters-7)
    -   [getPendingTxns](#getpendingtxns)
    -   [isChainValid](#ischainvalid)
        -   [Examples](#examples-3)
-   [Transaction](#transaction)
    -   [Parameters](#parameters-8)
    -   [calcHash](#calchash-1)
    -   [signTx](#signtx)
        -   [Parameters](#parameters-9)
    -   [isValid](#isvalid)

### Block

Declares a new class for the blocks that are inside the blockchain.
This class contains the timestamp, the transactions and the hash of the previous block.

#### Parameters

-   `timestamp` **[Date](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Date)** 
-   `txns` **[Array](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Array)** 
-   `previousHash` **Hash** 

#### calcHash

This function hashes the block.

Returns **Hash** This is the SHA512 hash of the block.

#### mineBlock

This function hashes the block until the hash begins with n zeroes.

##### Parameters

-   `difficulty` **[number](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Number)** This is the difficulty this block is mined at

##### Examples

```javascript
block.mineBlock(4);
```

### Blockchain

Declares the blockchain class which stores the blocks and validates them and the transactions contained inside the block.
This class contains the blockchain itself, the pending transactions and a whole lot more.

#### airdropCoins

This function gives every registered address a cut of the block reward.

#### createGenesisBlock

This function creates the genesis block and pushes it onto the blockchain.

#### getLatestBlock

This function returns the last block on the blockchain.

##### Examples

```javascript
blockchain.getLastestBlock();
```

Returns **[Block](#block)** This is the latest block.

#### mineCurrentBlock

This function creates a airdrop every 25 block, validates all pending Transactions, mines the block.

##### Parameters

-   `minerAddress` **[string](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/String)** This is the wallet address where the block reward is payed to.
-   `minedByAirdrop` **[boolean](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Boolean)** Indicates if the block is being mined by a airdrop. (optional, default `false`)

##### Examples

```javascript
blockchain.mineCurrentBlock('your public address');
```

#### validateTx

This function will validate and check the transaction to prevent overspending and stealing another users coins.

##### Parameters

-   `txn` **[Transaction](#transaction)** The transaction that will be checked

#### addTransaction

This function checks the transaction passed in and adds it onto the pending transactions array.

##### Parameters

-   `txn` **[Transaction](#transaction)** The transaction the will be checked and added

#### addWalletAddress

This function adds a wallet address to the registered addresses.

##### Parameters

-   `address` **[string](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/String)** The wallet address that should be added

#### getBalanceForAddress

This function returns the balance of a address.

##### Parameters

-   `address` **[string](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/String)** 

Returns **[number](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Number)** 

#### getBlockHeight

This function returns the block height of the chain

Returns **[number](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Number)** 

#### getBlockAtHeight

This function returns the block at the given height from the blockchain.

##### Parameters

-   `height` **[number](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Number)** The block height of the block

Returns **[Block](#block)** 

#### getPendingTxns

This function returns the pending transaction that haven't been put in a block.

Returns **[Array](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Array)** 

#### isChainValid

This function checks if the blockchain is valid.

##### Examples

```javascript
if(blockchain.isChainValid()) {
     console.log('Everything is fine! The blockchain is valid!');
} else {
     console.log('Blockchain is corrupt or damaged!');
}
```

Returns **[boolean](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Boolean)** 

### Transaction

Declares the transaction class.
This class contains the timestamp, the sender, the recipient and the amount that was sent.

#### Parameters

-   `timestamp` **[Date](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Date)** 
-   `sender` **[String](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/String)** 
-   `recipient` **[String](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/String)** 
-   `amount` **[Number](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Number)** 

#### calcHash

The calcHash function calculates the SHA512 hash of this transaction.

Returns **Hash** 

#### signTx

This function signs the transaction with the sender's key.

##### Parameters

-   `key` **Key** This is the sender's key

#### isValid

This function checks if this transaction was signed
and verifies that the hash of this transaction was signed with the sender's address.

Returns **[boolean](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Boolean)** 
