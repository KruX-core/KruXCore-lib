const SHA256 = require('crypto-js/sha256');
const EC = require('elliptic').ec;
const ec = new EC('secp256k1');
const xa = require('xa');

/**
 * Declares the transaction class.
 * This class contains the timestamp, the sender, the recipient and the amount that was sent.
 */
class Transaction {
    /**
     * @param {Date} timestamp
     * @param {String} sender
     * @param {String} recipient
     * @param {Number} amount
     * @param {Number} fee
     * @param {String} [signature=""]
     */
    constructor(timestamp, sender, recipient, amount) {
        this.timestamp = timestamp;
        this.sender = sender;
        this.recipient = recipient;
        this.amount = amount;
    }

    /**
     * The calcHash function calculates the SHA256 hash of this transaction.
     * @returns {Hash}
     */
    calcHash() {
        return SHA256(this.timestamp + this.sender + this.recipient + this.amount + this.fee).toString();
    }

    /**
     * This function signs the transaction with the sender's key.
     * @param {Key} key This is the sender's key
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
     * This function checks if this transaction was signed
     * and verifies that the hash of this transaction was signed with the sender's address.
     * @returns {boolean}
     */
    isValid() {
        if (this.sender === 'BlockMinting' || this.sender === 'Airdrop') {
            return true;
        }

        if (!this.signature || this.signature.length === 0) {
            xa.custom('Transaction', 'No signature found!', {titleColor: '#E42626', backgroundColor: '#322222'});
            return false;
        }

        let publicKey = ec.keyFromPublic(this.sender, 'hex');
        return publicKey.verify(this.calcHash(), this.signature);
    }
}

module.exports.Transaction = Transaction;
