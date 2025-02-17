const TronWeb = require('tronweb');
const { ethers, BigNumber } = require('ethers');
const config = require('../../config');
const UserRepository = require('../../db/repositories/UserRepository');
const logger = require('../services/loggingService');
const delay = (ms) => new Promise((res) => setTimeout(res, ms));
const messageQueue = require('../../infrastructure/messageQueue');

const TronWeb = require('tronweb');
const { ethers } = require('ethers');
const config = require('../../config');
const UserRepository = require('../../db/repositories/UserRepository');
const logger = require('../services/loggingService');
const redisClient = require('../../infrastructure/redisClient');
const delay = (ms) => new Promise((res) => setTimeout(res, ms));

const tronWeb = new TronWeb({ fullHost: config.tron_api_url, privateKey: config.tron_private_key });
const provider = new ethers.JsonRpcProvider(config.mtt_rpc_url);
const wallet = new ethers.Wallet(config.mtt_private_key, provider);

/**
 * 📌 Отправка USDT (TRC-20) с ретраями и подтверждением
 */
const sendUSDT = async (userId, recipient, amount, retries = 3) => {
    try {
        const user = await UserRepository.findById(userId);
        if (!user || BigNumber.from(user.balance.USDT).lt(BigNumber.from(amount))) {
            throw new Error('Недостаточно средств');
        }

        const contract = await tronWeb.contract().at(config.USDT_CONTRACT_ADDRESS);
        let txHash;

        for (let i = 0; i < retries; i++) {
            try {
                txHash = await contract.transfer(recipient, TronWeb.toSun(amount)).send();
                logger.info(`✅ USDT отправлено: Tx: ${txHash}`);
                await messageQueue.publish('transaction_confirmations', { txHash, userId, token: 'USDT', amount });
                return txHash;
            } catch (error) {
                logger.warn(`🚨 Ошибка отправки USDT (попытка ${i + 1}): ${error.message}`);
                if (i < retries - 1) await delay(3000);
            }
        }
        throw new Error('Ошибка отправки USDT после всех попыток');
    } catch (error) {
        logger.error(`❌ Ошибка вывода USDT: ${error.message}`);
        throw error;
    }
};

/**
 * 📌 Отправка MTT (EVM) с ретраями и подтверждением
 */
const sendMTT = async (userId, recipient, amount, retries = 3) => {
    try {
        const user = await UserRepository.findById(userId);
        if (!user || BigNumber.from(user.balance.MTT).lt(BigNumber.from(amount))) {
            throw new Error('Недостаточно средств');
        }

        let tx;
        for (let i = 0; i < retries; i++) {
            try {
                tx = await wallet.sendTransaction({
                    to: recipient,
                    value: ethers.utils.parseEther(amount.toString())
                });
                await tx.wait();
                logger.info(`✅ MTT отправлено: Tx: ${tx.hash}`);
                await messageQueue.publish('transaction_confirmations', { txHash: tx.hash, userId, token: 'MTT', amount });
                return tx.hash;
            } catch (error) {
                logger.warn(`🚨 Ошибка отправки MTT (попытка ${i + 1}): ${error.message}`);
                if (i < retries - 1) await delay(3000);
            }
        }
        throw new Error('Ошибка отправки MTT после всех попыток');
    } catch (error) {
        logger.error(`❌ Ошибка вывода MTT: ${error.message}`);
        throw error;
    }
};

module.exports = { sendUSDT, sendMTT };

const TronWeb = require('tronweb');
const { ethers } = require('ethers');
const config = require('../../config');
const UserRepository = require('../../db/repositories/UserRepository');
const logger = require('../services/loggingService');
const redisClient = require('../../infrastructure/redisClient');
const delay = (ms) => new Promise((res) => setTimeout(res, ms));

const tronWeb = new TronWeb({ fullHost: config.tron_api_url, privateKey: config.tron_private_key });
const provider = new ethers.JsonRpcProvider(config.mtt_rpc_url);
const wallet = new ethers.Wallet(config.mtt_private_key, provider);

/**
 * 📌 Отправка USDT с подтверждением
 */
const sendUSDT = async (userId, recipient, amount, retries = 3) => {
    try {
        const user = await UserRepository.findById(userId);
        if (!user || user.balance.USDT < amount) {
            throw new Error('Недостаточно средств');
        }
        const contract = await tronWeb.contract().at(config.usdt_token_address);
        const txHash = await contract.transfer(recipient, TronWeb.toSun(amount)).send();
        logger.info(`✅ USDT отправлено: Tx: ${txHash}`);
        await redisClient.set(`pending_tx:${txHash}`, { userId, amount, token: 'USDT' }, 600);
        return txHash;
    } catch (error) {
        logger.error(`❌ Ошибка отправки USDT: ${error.message}`);
        throw error;
    }
};

/**
 * 📌 Подтверждение транзакции
 */
const confirmTransaction = async (txHash, network = 'tron') => {
    try {
        for (let i = 0; i < 5; i++) {
            const receipt = network === 'tron' ? await tronWeb.trx.getTransactionInfo(txHash) : await provider.getTransactionReceipt(txHash);
            if (receipt && receipt.blockNumber) {
                logger.info(`✅ Транзакция подтверждена: ${txHash}`);
                await redisClient.set(`confirmed_tx:${txHash}`, true, 86400);
                return true;
            }
            await delay(5000);
        }
        throw new Error(`Транзакция ${txHash} не подтверждена`);
    } catch (error) {
        logger.error(`❌ Ошибка подтверждения транзакции: ${error.message}`);
        throw error;
    }
};

module.exports = { sendUSDT, confirmTransaction };
