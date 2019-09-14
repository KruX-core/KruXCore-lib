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
     * const Chain = new Blockchain({ genesisTimestamp: 1, verbose: true, difficulty: 3, txFee: 1, premineAddress: "", premineAmount: 0 }
     * @param {Object} opts
     */
    constructor(opts) {
        this._options = {
            genesisTimestamp: opts.genesisTimestamp,
            verbose: opts.verbose,
            difficulty: opts.difficulty,
            txFee: opts.txFee,
            premineAddress: opts.premineAddress,
            premineAmount: opts.premineAmount
        };
        this._blockReward = 1;
        this._chain = [];
        this._pendingTxns = [];
        this._registeredAddresses = [];
        this.createGenesisBlock();
    }

    /**
     * This function gives every registered address a cut of the block reward.
     */
    airdropCoins() {
        if (this._registeredAddresses === undefined || this._registeredAddresses.length == 0) {
            xa.custom('Blockchain', 'No wallets registered! No coins will be airdropped.', { titleColor: '#49FA49', backgroundColor: '#453232' });
            return;
        }

        const coinsPerWallet = this._blockReward / this._registeredAddresses.length;
        xa.custom('Blockchain', `Every registered address will recieve ${coinsPerWallet} coins`, { titleColor: '#45D339', backgroundColor: '#453232' });

        for (const address  of this._registeredAddresses) {
            this._pendingTxns.push(new Transaction(Date.now(), 'Airdrop', address, coinsPerWallet, this._options.txFee));
        }

        /* let i = Math.floor(Math.random() * (Math.floor(this._registeredAddresses.length - 1) - Math.ceil(0) + 1)) + Math.ceil(0);
        xa.custom('Blockchain', `Mining airdrop for ${this._registeredAddresses[ i ].trunc(32)}...`, { titleColor: '#45D339', backgroundColor: '#453232' });
        this.mineCurrentBlock(this._registeredAddresses[ i ], true); */
    }

    /**
     * This function creates the genesis block and pushes it onto the blockchain.
     */
    createGenesisBlock() {
        let txn = new Transaction(Date.now(), 'BlockMinting', this._options.premineAddress, this._options.premineAmount, this._options.txFee);
        let genesisBlock = new Block(this._options.genesisTimestamp, [ txn ], '0', this._options.verbose);
        if (this._options.verbose) {
            xa.custom('Blockchain', 'Created genesis block', {
                titleColor: '#45D339',
                backgroundColor: '#453232'
            });
        }

        this._chain.push(genesisBlock);
    }

    /**
     * This function creates a airdrop every 25 block, validates all pending Transactions, mines the block.
     * This function validates all pending Transactions, mines the block.
     * @param {string} minerAddress This is the wallet address where the block reward is payed to.
     * @param {boolean} [minedByAirdrop=false] Indicates if the block is being mined by a airdrop.
     * @example
     * blockchain.mineCurrentBlock('your public address');
     */
    mineCurrentBlock(minerAddress, minedByAirdrop = false) {
        let validatedTxns = [];

        if (((this.getBlockHeight() + 1) % 1 === 0) && minedByAirdrop === false) {
            this.airdropCoins();
        }

        let minerReward = 0;

        for (const txn of this._pendingTxns) {
            switch (txn.sender) {
            case 'BlockMinting':
                if (this._options.verbose) {
                    xa.custom('Blockchain', `Transaction validated: ${txn.recipient.trunc(32)} recieved ${txn.amount} coins for mining block ${this.getBlockHeight()}`, {
                        titleColor: '#45D339',
                        backgroundColor: '#453232'
                    });
                }

                validatedTxns.push(txn);
                minerReward += txn.fee;

                break;
            case 'Airdrop':
                xa.custom('Blockchain', `Transaction validated: Airdrop (${txn.amount} coins) for ${txn.recipient.trunc(32)}`, {
                    titleColor: '#45D339',
                    backgroundColor: '#453232'
                });

                validatedTxns.push(txn);
                minerReward += txn.fee;

                break;
            default:
                if (this.validateTx(txn)) {
                    if (this._options.verbose) {
                        xa.custom('Blockchain', `Transaction validated: ${txn.sender.trunc(32)} sent ${txn.amount} coins to ${txn.recipient.trunc(32)}`, {
                            titleColor: '#45D339',
                            backgroundColor: '#453232'
                        });
                    }

                    minerReward += txn.fee;
                    validatedTxns.push(txn);
                } else {
                    xa.custom('Blockchain', `Invalid transaction found: ${txn.sender.trunc(32)} tried to send ${txn.amount} coins to ${txn.recipient.trunc(32)}`, {
                        titleColor: '#F53B3B',
                        backgroundColor: '#453232'
                    });
                }
                break;
            }
        }

        let block = new Block(Date.now(), validatedTxns, this.getLatestBlock().hash, this._options.verbose);
        block.mineBlock(this._options.difficulty);
        this._chain.push(block);

        xa.custom('Blockchain', `Miner will recieve ${minerReward} coins as reward`, {
            titleColor: '#45D339',
            backgroundColor: '#453232'
        });

        this._pendingTxns = [ new Transaction(Date.now(), 'BlockMinting', minerAddress, minerReward, this._options.txFee) ];
        // this._pendingTxns = [];
    }

    /**
     * This function will validate and check the transaction to prevent overspending and stealing another users coins.
     * @param {Transaction} txn The transaction that will be checked
     */
    validateTx(txn) {
        let sender = txn.sender;
        let balance = this.getBalanceForAddress(sender);

        if (balance >= (txn.amount + txn.fee) && txn.fee >= this._options.txFee) {
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
            xa.custom('Blockchain', 'Transaction must include the sender\'s and the recipient\'s addresses and the fee', {
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

        if (this._options.verbose) {
            xa.custom('Blockchain', `Transaction ${this._pendingTxns.length} added with ${txn.fee} coin fee`, {
                titleColor: '#69E45E',
                backgroundColor: '#322222'
            });
        }

        this._pendingTxns.push(txn);

        return txn;
    }

    /**
     * This function adds a wallet address to the registered addresses.
     * @param {string} address The wallet address that should be added
     */
    addWalletAddress(address) {
        if (this._registeredAddresses.indexOf(address) > -1) {
            if (this._options.verbose) {
                xa.custom('Blockchain', `${
                    address.trunc(48)
                } already registered`, {
                    titleColor: '#E42626',
                    backgroundColor: '#322222'
                });
            }
            return;
        }

        this._registeredAddresses.push(address);
        this._blockReward = this._registeredAddresses.length;

        if (this._options.verbose) {
            xa.custom('Blockchain', `${address.trunc(48)} successfully registered!`, {
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
        return this._chain[ this._chain.length - 1 ];
    }

    /**
     * This function returns the balance of a address.
     * @param {string} address
     * @returns {number}
     */
    getBalanceForAddress(address) {
        let balance = 0;

        for (const block of this._chain) {
            for (const txn of block.txns) {
                if (address === txn.sender) {
                    balance -= (txn.amount + txn.fee);
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
        return this._chain.length - 1;
    }

    /**
     * This function returns the block at the given height from the blockchain.
     * @param {number} height The block height of the block
     * @returns {Block}
     */
    getBlockAtHeight(height) {
        return this._chain[ height ];
    }

    /**
     * This function returns the pending transaction that haven't been put in a block.
     * @returns {Array}
     */
    getPendingTxns() {
        return this._pendingTxns;
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
