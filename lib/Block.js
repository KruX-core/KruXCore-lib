const SHA256 = require('crypto-js/sha256');
const xa = require('xa');

String.prototype.trunc = function(n) {
    return (this.length > n) ? this.substr(0, n-1) + '...' : this;
};

/**
 * Declares a new class for the blocks that are inside the blockchain.
 * This class contains the timestamp, the transactions and the hash of the previous block.
 */
class Block {
    /**
     * @param {Date} timestamp
     * @param {Array} txns
     * @param {Hash} previousHash
     * @param {Boolean} verbose
     */
    constructor(timestamp, txns, previousHash, verbose = false) {
        this.timestamp = timestamp;
        this.txns = txns;
        this.previousHash = previousHash;
        this.nonce = 0;
        this.hash = this.calcHash();
        this.verbose = verbose;
    }

    /**
     * This function hashes the block.
     * @returns {Hash} This is the SHA256 hash of the block.
     */
    calcHash() {
        return SHA256(this.previousHash + this.timestamp + JSON.stringify(this.txns) + this.nonce).toString();
    }

    /**
     * This function hashes the block until the hash begins with n zeroes.
     * @param {number} difficulty This is the difficulty this block is mined at
     * @example
     * block.mineBlock(4);
     */
    mineBlock(difficulty) {
        let count = 0;
        while (this.hash.substring(0, difficulty) !== Array(difficulty + 1).join('0')) {
            this.nonce++;
            count++;
            let hash = this.calcHash();
            //if (this.verbose) xa.custom('Block', `Trying block hash ${hash}`, {titleColor: '#17D63D', backgroundColor: '#474747'});
            this.hash = hash;
        }

        if (this.verbose) xa.custom('Block', `Block mined! Timestamp: ${new Date(this.timestamp).toLocaleString()} | Hash: ${this.hash.trunc(56)} (${count} iterations)`, {titleColor: '#17D63D', backgroundColor: '#474747'});
    }
}

module.exports.Block = Block;
