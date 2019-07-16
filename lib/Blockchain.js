const {Transaction} = require('./Transaction');
const {Block} = require('./Block');
const progressbars = require('cli-progress');
const xa = require('xa');

String.prototype.trunc = function (n) {
    return(this.length > n) ? this.substr(0, n - 1) + '...' : this;
};

/**
 * Declares the blockchain class which stores the blocks and validates them and the transactions contained inside the block.
 * This class contains the blockchain itself, the pending transactions and a whole lot more.
 */
class Blockchain { /**
     * Constructor of the Blockchain class
     * Use the opts argument to set the difficulty and to make it verbose af
     * @example
     * const Chain = new Blockchain({ verbose: true, difficulty: 3 }
     * @param {Object} opts
     */
    constructor(opts) {
        this.options = {
            verbose: opts.verbose,
            difficulty: opts.difficulty
        };
        this.blockReward = 1;
        this.chain = [];
        this.pendingTxns = [];
        this.registeredAddresses = [];
        this.createGenesisBlock();
    }

    /**
     * This function creates the genesis block and pushes it onto the blockchain.
     */
    createGenesisBlock() {
        let txn = new Transaction(Date.now(), 'BlockMinting', 'Genesis', 0);
        let genesisBlock = new Block('1556735351', [txn], '0', this.options.verbose);
        if (this.options.verbose) {
            xa.custom('Blockchain', 'Created genesis block', {
                titleColor: '#45D339',
                backgroundColor: '#453232'
            });
        }

        this.chain.push(genesisBlock);
    }

    /**
     * This function validates all pending Transactions, mines the block.
     * @param {string} minerAddress This is the wallet address where the block reward is payed to.
     * @example
     * blockchain.mineCurrentBlock('your public address');
     */
    mineCurrentBlock(minerAddress) {
        let validatedTxns = [];

        for (const txn of this.pendingTxns) {
            switch (txn.sender) {
            case 'BlockMinting':
                if (this.options.verbose) {
                    xa.custom('Blockchain', `Transaction validated: ${
                        txn.recipient.trunc(32)
                    } recieved ${
                        txn.amount
                    } coins for mining block ${
                        this.getBlockHeight()
                    }`, {
                        titleColor: '#45D339',
                        backgroundColor: '#453232'
                    });
                }

                validatedTxns.push(txn);
                break;
            default:
                if (this.validateTx(txn)) {
                    if (this.options.verbose) {
                        xa.custom('Blockchain', `Transaction validated: ${
                            txn.sender.trunc(32)
                        } sent ${
                            txn.amount
                        } coins to ${
                            txn.recipient.trunc(32)
                        }`, {
                            titleColor: '#45D339',
                            backgroundColor: '#453232'
                        });
                    }

                    validatedTxns.push(txn);
                } else {
                    xa.custom('Blockchain', `Invalid transaction found: ${
                        txn.sender.trunc(32)
                    } tried to send ${
                        txn.amount
                    } coins to ${
                        txn.recipient.trunc(32)
                    }`, {
                        titleColor: '#F53B3B',
                        backgroundColor: '#453232'
                    });
                }
                break;
            }
        }

        let block = new Block(Date.now(), validatedTxns, this.getLatestBlock().hash, this.options.verbose);
        block.mineBlock(this.options.difficulty);
        this.chain.push(block);

        this.pendingTxns = [new Transaction(Date.now(), 'BlockMinting', minerAddress, this.options.blockReward)];
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
                xa.custom('Blockchain', 'Transaction is not valid', {
                    titleColor: '#E42626',
                    backgroundColor: '#322222'
                });
                return false;
            }
        } else {
            xa.custom('Blockchain', 'Not enough money to confirm transaction', {
                titleColor: '#E42626',
                backgroundColor: '#322222'
            });
            return false;
        }
    }

    /**
     * This function checks the transaction passed in and adds it onto the pending transactions array.
     * @param {Transaction} txn The transaction the will be checked and added
     */
    addTransaction(txn) {
        if (!txn.sender || !txn.recipient) {
            xa.custom('Blockchain', 'Transaction must include the sender\'s and the recipient\'s addresses', {
                titleColor: '#E42626',
                backgroundColor: '#322222'
            });
            return;
        }

        if (!this.validateTx(txn)) {
            xa.custom('Blockchain', 'Cannot add invalid transaction', {
                titleColor: '#E42626',
                backgroundColor: '#322222'
            });
            return;
        }

        if (this.options.verbose) {
            xa.custom('Blockchain', 'Transaction added', {
                titleColor: '#69E45E',
                backgroundColor: '#322222'
            });
        }

        this.pendingTxns.push(txn);
    }

    /**
     * This function adds a wallet address to the registered addresses.
     * @param {string} address The wallet address that should be added
     */
    addWalletAddress(address) {
        this.registeredAddresses.push(address);
        this.options.blockReward = this.registeredAddresses.length;
        if (this.options.verbose) {
            xa.custom('Blockchain', `${
                address.trunc(48)
            } successfully registered!`, {
                titleColor: '#69E45E',
                backgroundColor: '#322222'
            });
        }
    }

    /**
     * This function returns the last block on the blockchain.
     * @example
     * blockchain.getLastestBlock();
     * @returns {Block} This is the latest block.
     */
    getLatestBlock() {
        return this.chain[this.chain.length - 1];
    }

    /**
     * This function returns the balance of a address.
     * @param {string} address
     * @returns {number}
     */
    getBalanceForAddress(address) {
        let balance = 0;

        for (const block of this.chain) {
            for (const txn of block.txns) {
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
        return this.chain[height];
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
     * if (blockchain.isChainValid()) {
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

