const SHA512 = require('crypto-js/sha512'),
      EC = require('elliptic').ec,
      ec = new EC('secp256k1');

/**
 * Declares a new class with name Transaction.
 * This class contains the timestamp, the sender, the recipient and the amount that was sent.
 */
class Transaction {
    constructor(timestamp, sender, recipient, amount) {
        this.timestamp = timestamp
        this.sender = sender;
        this.recipient = recipient;
        this.amount = amount;
    }

    calcHash() {
        return SHA512(this.timestamp + this.sender + this.recipient + this.amount).toString();
    }

    /**
     * The signTransaction function signs the transaction with the sender's key.
     */
    signTx(key) {
        if (key.getPublic('hex') !== this.sender) {
            throw new Error('You cannot sign transactions for another wallet!');
        }

        let hash = this.calcHash();
        let sig = key.sign(hash, 'base64');
        this.signature = sig.toDER('hex');
    }

    /**
     * The isValid function checks if this transaction was signed
     * and verifies that the hash of this transaction was signed with the sender's address.
     */
    isValid() {
        if (this.sender === "BlockMinting" || this.sender === "Airdrop") {
            return true;
        }
        
        if (!this.signature || this.signature.length === 0)
            throw new Error('No signature found in this transaction!');

        let publicKey = ec.keyFromPublic(this.sender, 'hex');
        return publicKey.verify(this.calcHash(), this.signature);
    }
}

class Block {
    constructor(timestamp, txns, previousHash) {
        this.timestamp = timestamp;
        this.txns = txns;
        this.previousHash = previousHash;
        this.nonce = 0;
        this.hash = this.calcHash();
    }
    
    calcHash() {
        return SHA512(this.previousHash + this.timestamp + JSON.stringify(this.txns) + this.nonce).toString();
    }
    
    mineBlock(difficulty) {
        let count = 0;
        while (this.hash.substring(0, difficulty) !== Array(difficulty + 1).join("0")) {
            this.nonce++;
            count++;
            this.hash = this.calcHash();
        }
        
        console.log("Block mined! (" + count + " iters) Hash: " + this.hash);
    }
}

class Blockchain {
    constructor() {
        this.chain = [];
        this.difficulty = 1;
        this.pendingTxns = [];
        this.blockReward = 75;
        this.registeredAddresses = [];
        this.createGenesisBlock();
    }
    
    airdropCoins() {
        let coinsPerWallet = this.blockReward / this.registeredAddresses.length;

        for (const address  of this.registeredAddresses) {
            this.pendingTxns.push(new Transaction(Date.now(), "Airdrop", address, coinsPerWallet));
        }
        
        let i = Math.floor(Math.random() * (Math.floor(this.registeredAddresses.length - 1) - Math.ceil(0) + 1)) + Math.ceil(0);
        console.log("Mining airdrop for " + this.registeredAddresses[ i ] + "...");
        this.mineCurrentBlock(this.registeredAddresses[ i ], true);
    }
    
    createGenesisBlock() {
        let txn = new Transaction(Date.now(), "BlockMinting", "Genesis", 0);
        let genesisBlock = new Block("1556735351", [ txn ], "0");
        this.chain.push(genesisBlock);
    }
    
    getLatestBlock() {
        return this.chain[ this.chain.length - 1 ];
    }
    
    mineCurrentBlock(minerAddress, minedByAirdrop = false) {
        let validatedTxns = [];
        
        if (((this.getBlockHeight() + 1) % 25 === 0) && this.registeredAddresses !== [] && minedByAirdrop === false) {
            this.airdropCoins();
        }
        
        for (const txn of this.pendingTxns) {
            switch (txn.sender) {
                case "BlockMinting": 
                case "Airdrop":
                    console.log("Transaction validated: " + txn.sender + " sent " + txn.amount + " coins to " + txn.recipient);
                    validatedTxns.push(txn);
                    break;
                default:
                    if (this.validateTx(txn)) {
                        console.log("Transaction validated: " + txn.sender + " sent " + txn.amount + " coins to " + txn.recipient);
                        validatedTxns.push(txn);
                    } else {
                        console.log("Invalid transaction: " + txn.sender + " tried to send " + txn.amount + " coins to " + txn.recipient);
                    }
                    break;
            }
        }
        
        let block = new Block(Date.now(), validatedTxns, this.getLatestBlock().hash);
        block.mineBlock(this.difficulty);
        this.chain.push(block);
        
        console.log("Block " + this.getBlockHeight() + " successfully mined!");
        
        this.pendingTxns = [
            new Transaction(Date.now(), "BlockMinting", minerAddress, this.blockReward)
        ];
    }
    
    validateTx(txn) {
        let sender = txn.sender;
        let balance = this.getBalanceForAddress(sender);

        if (balance >= txn.amount) {
            if (txn.isValid()) {
		return true;
	    } else {
		console.log("Transaction is not valid! :(");
		return false;
	    }
        } else {
	    console.log("Not enough money :(");
            return false;
        }
    }
    
    addTransaction(txn) {
        if (!txn.sender || !txn.recipient)
            console.log('Transaction must include the sender\'s and the recipient\'s addresses!');

        if (!this.validateTx(txn))
            console.log('Cannot add invalid transaction! :(');

        this.pendingTxns.push(txn);
    }
    
    addWalletAddress(address) {
        this.registeredAddresses.push(address);
        console.log(address + " successfully registered!");
    }

    getBalanceForAddress(address) {
        let balance = 0;
        
        for ( const block of this.chain) {
            for ( const txn of block.txns) {
                if (address === txn.sender) {
                    balance -= txn.amount;
                }
                
                if (address === txn.recipient) {
                    balance += txn.amount;
                }
            }
        }
        
        return balance;
    }
    
    getBlockHeight() {
        return this.chain.length;
    }
    
    getBlockAtHeight(height) {
        return this.chain[ height ];
    }
    
    isChainValid() {
        for (let i = 1; i < this.getBlockHeight(); i++) {
            const currBlock = this.getBlockAtHeight(i);
            const prevBlock = this.getBlockAtHeight(i - 1);
            
            // Hash block against itself
            if (currBlock.calcHash() !== currBlock.hash) {
                return false;
            }
            
            // Check current block's previousHash against previous block's hash
            if (currBlock.previousHash !== prevBlock.hash) {
                return false;
            }
        }
        
        // Blockchain is valid! :)
        return true;
    }
}

module.exports.Blockchain = Blockchain;
module.exports.Block = Block;
module.exports.Transaction = Transaction;
