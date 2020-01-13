const SHA256 = require("crypto-js/sha256");
const EC = require('elliptic').ec;
const ec = new EC('secp256k1');

class Transaction{
    constructor(fromAddress, toAddress, amount){
        this.fromAddress = fromAddress;
        this.toAddress = toAddress;
        this.amount = amount;
    }

    calculateHash(){
        return SHA256(this.fromAddress + this.toAddress + this.amount).toString();
    }

    signTransaction(signingKey){
        if(signingKey.getPublic('hex') !== this.fromAddress){
            throw new Error('You cannot sign transactions from other wallets.');
        }
        const hashTx = this.calculateHash();
        const sig = signingKey.sign(hashTx, 'base64');
        this.signature = sig.toDER('hex');
    }

    isValid(){
        //If mining reward, automatically valid
        if(this.fromAddress === null) return true;

        //if no signature, automatically invalid
        if(!this.signature || this.signature.length === 0){
            throw new Error('No signature in this transaction');
        }

        //if there is a signature, verify its integrity to the public key
        const publicKey = ec.keyFromPublic(this.fromAddress, 'hex');
        return publicKey.verify(this.calculateHash(), this.signature);
    }
}

class Block{
    /**
     * Class for each block in the chain
     * @param {Date} timestamp time this block was created
     * @param {Array} transactions array of transactions saved in this block (the data)
     * @param {string} previousHash stores the hash of the previous block, maintaining integrity
     * hash is the unique value of this block based on its elements
     * nonce is a random number to alter hash until it fits proof of work
     */
    constructor(timestamp, transactions, previousHash = ''){
        this.timestamp = timestamp;
        this.transactions = transactions;
        this.previousHash = previousHash;
        this.hash = this.calculateHash();
        this.nonce = 0;
    }

    /**
     * Creates a SHA256 hash based on the block's contents
     */
    calculateHash(){
        return SHA256(this.previousHash + this.timestamp + JSON.stringify(this.data) + this.nonce).toString();
    }

    /**
     * Attempts to create a block until the proof of work has been met
     * @param {number} difficulty the required number of zeroes the hash must begin with
     */
    mineBlock(difficulty){
        while(this.hash.substring(0, difficulty) !== Array(difficulty + 1).join("0")){
            this.nonce++;
            this.hash = this.calculateHash();
        }

        console.log("Block mined: " + this.hash);
    }

    hasValidTransactions(){
        for(const tx of this.transactions){
            if(!tx.isValid()){
                return false;
            }
        }
        return true;
    }
}

class Blockchain{
    /**
     * Creates the primary Blockchain
     * Chain is an array, with the first index as a predefined genesis block.
     * Difficulty is the required number of zeroes for hashes to begin with.
     * Mining reward is the number of coins given for mining a new block.
     */
    constructor(){
        this.chain = [this.createGenesisBlock()];
        this.difficulty = 2;
        this.pendingTransactions = [];
        this.miningReward = 100;
    }

    /**
     * Creates a predefined block, with previous hash of 0
     */
    createGenesisBlock(){
        return new Block(Date.now(), "Genesis Block", "0");
    }

    getLatestBlock(){
        return this.chain[this.chain.length - 1];
    }

    /**
     * 
     * @param {string} miningRewardAddress wallet address to send reward to
     */
    minePendingTransactions(miningRewardAddress){
        // creates a new block with an array of pending transactions
        let block = new Block(Date.now(), this.pendingTransactions, this.getLatestBlock().hash);
        //attempts to mine it
        block.mineBlock(this.difficulty);
        //adds the mining reward to pending transactions
        
        this.pendingTransactions.push(new Transaction(null, miningRewardAddress, this.miningReward));
        console.log('Block successfully mined!');
        this.chain.push(block);

        // clears pending transactions

        this.pendingTransactions = [];
    }

    // OUTDATED, commented for learning purposes
    // addBlock(newBlock){
    //     newBlock.previousHash = this.getLatestBlock().hash;
    //     newBlock.mineBlock(this.difficulty);
    //     this.chain.push(newBlock);
    // }

    addTransaction(transaction){
        if(!transaction.fromAddress || !transaction.toAddress){
            throw new Error('Transaction must include from and to address.');
        }

        if(!transaction.isValid()){
            throw new Error('Cannot add invalid transaction to chain.');
        }

        this.pendingTransactions.push(transaction);
    }

    getBalanceOfAddress(address){
        let balance = 0;
        for(const block of this.chain){
            for(const transaction of block.transactions){
                if(transaction.fromAddress === address){
                    balance -= transaction.amount;
                }
                if(transaction.toAddress === address){
                    balance += transaction.amount;
                }
            }
        }
        return balance;
    }

    /**
     * Tests each block in the chain for integrity with its own hash and previous hash.
     */
    isChainValid(){
        for(let i = 1; i < this.chain.length; i++){
            const currentBlock = this.chain[i];
            const previousBlock = this.chain[i - 1];

            if(!currentBlock.hasValidTransactions()){
                return false;
            }

            if(currentBlock.hash !== currentBlock.calculateHash()){
                return false;
            }

            if(currentBlock.previousHash !== previousBlock.hash){
                return false;
            }
        }

        return true;
    }
}

module.exports.Blockchain = Blockchain;
module.exports.Transaction = Transaction;