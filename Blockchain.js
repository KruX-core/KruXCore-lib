const { Transaction } = require('./Transaction'),
      { Block } = require('./Block'),
      progressbars = require('cli-progress'),
      xa = require('xa');

String.prototype.trunc = String.prototype.trunc || function(n) {
    return (this.length > n) ? this.substr(0, n-1) + '...' : this;
};

/**
 * Declares the blockchain class which stores the blocks and validates them and the transactions contained inside the block.
 * This class contains the blockchain itself, the pending transactions and a whole lot more.
 */
class Blockchain {
    constructor() {
        this.chain = [];
        this.difficulty = 1;
        this.pendingTxns = [];
        this.blockReward = 75;
        this.registeredAddresses = [];
        this.createGenesisBlock();
    }
    
    /**
     * This function gives every registered address a cut of the block reward.
     */
    airdropCoins() {
        if (this.registeredAddresses === undefined || this.registeredAddresses.length == 0) {
            xa.custom('Blockchain', 'No wallets registered! No coins will be airdropped.', { titleColor: '#49FA49', backgroundColor: '#453232' });
            return;
        }

        let coinsPerWallet = this.blockReward / this.registeredAddresses.length;

        for (const address  of this.registeredAddresses) {
            this.pendingTxns.push(new Transaction(Date.now(), 'Airdrop', address, coinsPerWallet));
        }
        
        let i = Math.floor(Math.random() * (Math.floor(this.registeredAddresses.length - 1) - Math.ceil(0) + 1)) + Math.ceil(0);
        xa.custom('Blockchain', `Mining airdrop for ${this.registeredAddresses[ i ].trunc(32)}...`, { titleColor: '#45D339', backgroundColor: '#453232' });
        this.mineCurrentBlock(this.registeredAddresses[ i ], true);
    }
    
    /**
     * This function creates the genesis block and pushes it onto the blockchain.
     */
    createGenesisBlock() {
        let txn = new Transaction(Date.now(), 'BlockMinting', 'Genesis', 0);
        let genesisBlock = new Block('1556735351', [ txn ], '0');
        this.chain.push(genesisBlock);
    }
    
    /**
     * This function creates a airdrop every 25 block, validates all pending Transactions, mines the block.
     * @param {string} minerAddress This is the wallet address where the block reward is payed to.
     * @param {boolean} [minedByAirdrop=false] Indicates if the block is being mined by a airdrop.
     * @example
     * blockchain.mineCurrentBlock('your public address');
     */
    mineCurrentBlock(minerAddress, minedByAirdrop = false) {
        let validatedTxns = [];
        
        if (((this.getBlockHeight() + 1) % 25 === 0) && minedByAirdrop === false) {
            this.airdropCoins();
        }
        
        for (const txn of this.pendingTxns) {
            switch (txn.sender) {
                case 'BlockMinting':
                    xa.custom('Blockchain', `Transaction validated: ${txn.recipient.trunc(32)} recieved ${txn.amount} coins for mining block ${this.getBlockHeight()}`, { titleColor: '#45D339', backgroundColor: '#453232' });
                    validatedTxns.push(txn);
                    break;
                case 'Airdrop':
                    xa.custom('Blockchain', `Transaction validated: Airdrop (${txn.amount} coins) for ${txn.recipient.trunc(32)}`, { titleColor: '#45D339', backgroundColor: '#453232' });
                    validatedTxns.push(txn);
                    break;
                default:
                    if (this.validateTx(txn)) {
                        xa.custom('Blockchain', `Transaction validated: ${txn.sender.trunc(32)} sent ${txn.amount} coins to ${txn.recipient.trunc(32)}`, { titleColor: '#45D339', backgroundColor: '#453232' });
                        validatedTxns.push(txn);
                    } else {
                        xa.custom('Blockchain', `Invalid transaction found: ${txn.sender.trunc(32)} tried to send ${txn.amount} coins to ${txn.recipient.trunc(32)}`, { titleColor: '#F53B3B', backgroundColor: '#453232' });
                    }
                    break;
            }
        }
        
        let block = new Block(Date.now(), validatedTxns, this.getLatestBlock().hash);
        block.mineBlock(this.difficulty);
        this.chain.push(block);
                
        this.pendingTxns = [
            new Transaction(Date.now(), 'BlockMinting', minerAddress, this.blockReward)
        ];
    }

    /**
     * This function will validate and check the transaction to prevent overspending and stealing another users coins.
     * @param {Transaction} txn The transaction that will be checked
     */
    validateTx(txn) {
        let sender = txn.sender;
        let balance = this.getBalanceForAddress(sender);

        if (balance >= txn.amount) {
            if (txn.isValid()) {
		        return true;
	        } else {
		        xa.custom('Transaction', 'Transaction is not valid', { titleColor: '#E42626', backgroundColor: '#322222' });
		        return false;
            }
        } else {
            xa.custom('Transaction', 'Not enough money to confirm transaction', { titleColor: '#E42626', backgroundColor: '#322222' });
            return false;
        }
    }
    
    /**
     * This function checks the transaction passed in and adds it onto the pending transactions array.
     * @param {Transaction} txn The transaction the will be checked and added
     */
    addTransaction(txn) {
        if (!txn.sender || !txn.recipient) {
            xa.custom('Transaction', 'Transaction must include the sender\'s and the recipient\'s addresses', { titleColor: '#E42626', backgroundColor: '#322222' });
            return;
	    }

        if (!this.validateTx(txn)) {
            xa.custom('Transaction', 'Cannot add invalid transaction', { titleColor: '#E42626', backgroundColor: '#322222' });
	        return;
	    }

        xa.custom('Transaction', 'Transaction added', { titleColor: '#69E45E', backgroundColor: '#322222' });
        this.pendingTxns.push(txn);
    }
    
    /**
     * This function adds a wallet address to the registered addresses.
     * @param {string} address The wallet address that should be added
     */
    addWalletAddress(address) {
        this.registeredAddresses.push(address);
        xa.custom('Blockchain', `${address.trunc(32)} successfully registered!`, { titleColor: '#69E45E', backgroundColor: '#322222' });
    }

    /**
     * This function returns the last block on the blockchain.
     * @example
     * blockchain.getLastestBlock();
     * @returns {Block} This is the latest block.
     */
    getLatestBlock() {
        return this.chain[ this.chain.length - 1 ];
    }

    /**
     * This function returns the balance of a address.
     * @param {string} address
     * @returns {number}
     */
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
    
    /**
     * This function returns the block height of the chain
     * @returns {number}
     */
    getBlockHeight() {
        return this.chain.length - 1;
    }
    
    /**
     * This function returns the block at the given height from the blockchain.
     * @param {number} height The block height of the block
     * @returns {Block}
     */
    getBlockAtHeight(height) {
        return this.chain[ height ];
    }

    /**
     * This function returns the pending transaction that haven't been put in a block.
     * @returns {Array}
     */
    getPendingTxns() {
        return this.pendingTxns;
    }
    
    /**
     * This function checks if the blockchain is valid.
     * @example
     * if(blockchain.isChainValid()) {
     *      console.log('Everything is fine! The blockchain is valid!');
     * } else {
     *      console.log('Blockchain is corrupt or damaged!');
     * }
     * @returns {boolean}
     */
    isChainValid() {
        let progress = new progressbars.Bar({
            format: 'Checking blocks: [{bar}] {percentage}% | {value}/{total} blocks checked',
            stopOnComplete: true
        }, progressbars.Presets.rect);
        progress.start(this.getBlockHeight(), 1);

        for (let i = 1; i < this.getBlockHeight() + 1; i++) {
            progress.update(i);

            const currBlock = this.getBlockAtHeight(i);
            const prevBlock = this.getBlockAtHeight(i - 1);
            
            // Hash block against itself
            if (currBlock.calcHash() !== currBlock.hash) {
                progress.stop();
                return false;
            }
            
            // Check current block's previousHash against previous block's hash
            if (currBlock.previousHash !== prevBlock.hash) {
                progress.stop();
                return false;
            }
        }
        progress.stop();

        // Blockchain is valid! :)
        return true;
    }
}

module.exports.Blockchain = Blockchain;