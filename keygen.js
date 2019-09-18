/* eslint-disable no-console */

const EC = require('elliptic').ec;
const ec = new EC('ed25519');

const key = ec.genKeyPair();
const pubKey = key.getPublic('hex');
const privKey = key.getPrivate('hex');

console.log('Private key is\n' + privKey);
console.log('Public key is\n' + pubKey);
