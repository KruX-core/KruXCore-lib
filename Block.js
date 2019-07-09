const SHA512 = require('crypto-js/sha512'),
      xa = require('xa');

String.prototype.trunc = String.prototype.trunc || function(n) {
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
     */
    constructor(timestamp, txns, previousHash) {
        this.timestamp = timestamp;
        this.txns = txns;
        this.previousHash = previousHash;
        this.nonce = 0;
        this.hash = this.calcHash();
    }
    
    /**
     * This function hashes the block.
     * @returns {Hash} This is the SHA512 hash of the block.
     */
    calcHash() {
        return SHA512(this.previousHash + this.timestamp + JSON.stringify(this.txns) + this.nonce).toString();
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
            this.hash = this.calcHash();
        }
        
        xa.custom('Block', `Block mined! Hash: ${this.hash.trunc(56)} (${count} iterations)`, {titleColor: '#17D63D', backgroundColor: '#474747'});
    }
}

module.exports.Block = Block;