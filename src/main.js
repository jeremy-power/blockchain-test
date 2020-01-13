const EC = require('elliptic').ec;
const ec = new EC('secp256k1');

const myKey = ec.keyFromPrivate('0c685010d82cb4acf9e7832acea25143475a81e59611beb5d9186ad0d362e157');
const myWalletAddress = myKey.getPublic('hex');

const {Blockchain, Transaction} = require('./blockchain');

let powerCoin = new Blockchain();

const tx1 = new Transaction(myWalletAddress, 'public key goes here', 10);
tx1.signTransaction(myKey);
powerCoin.addTransaction(tx1);

// powerCoin.createTransaction(new Transaction('address1', 'address2', 100));
// powerCoin.createTransaction(new Transaction('address2', 'address1', 50));

console.log('\nStarting the miner...');
powerCoin.minePendingTransactions(myWalletAddress);

console.log('\nBalance of jeremy is', powerCoin.getBalanceOfAddress(myWalletAddress));

console.log('\nStarting the miner...');
powerCoin.minePendingTransactions(myWalletAddress);

console.log('\nBalance of jeremy is', powerCoin.getBalanceOfAddress(myWalletAddress));

console.log('Is chain valid?', powerCoin.isChainValid());
// console.log(JSON.stringify(powerCoin, null, 4));