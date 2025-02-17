const TronWeb = require('tronweb');
const { ethers, BigNumber } = require('ethers');
const config = require('../../config');
const UserRepository = require('../../db/repositories/UserRepository');
const logger = require('../services/loggingService');
const delay = (ms) => new Promise((res) => setTimeout(res, ms));

// Инициализация TronWeb для USDT
const tronWeb = new TronWeb({
    fullHost: process.env.TRON_API_URL,
    privateKey: process.env.HOT_WALLET_PRIVATE_KEY
});

// Инициализация Ethers.js для MTT
const provider = new ethers.JsonRpcProvider(config.MTT_NETWORK_RPC);
const wallet = new ethers.Wallet(process.env.HOT_WALLET_PRIVATE_KEY, provider);

/**
 * 📌 Отправка USDT (TRC-20) с ретраями
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
                logger.info(`✅ USDT отправлено: ${amount} USDT → ${recipient}, Tx: ${txHash}`);
                await UserRepository.updateUserBalance(userId, 'USDT', -amount);
                return { success: true, txHash };
            } catch (error) {
                logger.warn(`🚨 Ошибка отправки USDT (попытка ${i + 1}): ${error.message}`);
                if (i < retries - 1) await delay(3000); // Задержка перед повтором
            }
        }
        throw new Error('Ошибка отправки USDT после всех попыток');
    } catch (error) {
        logger.error(`❌ Ошибка вывода USDT: ${error.message}`);
        throw error;
    }
};

/**
 * 📌 Отправка MTT (EVM) с ретраями
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
                logger.info(`✅ MTT отправлено: ${amount} MTT → ${recipient}, Tx: ${tx.hash}`);
                await UserRepository.updateUserBalance(userId, 'MTT', -amount);
                return { success: true, txHash: tx.hash };
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
const { ethers, BigNumber } = require('ethers');
const logger = require('../services/loggingService');
const config = require('../../config');
const delay = (ms) => new Promise((res) => setTimeout(res, ms));

const tronWeb = new TronWeb({ fullHost: config.tron_api_url, privateKey: config.tron_private_key });
const provider = new ethers.JsonRpcProvider(config.mtt_rpc_url);
const wallet = new ethers.Wallet(config.mtt_private_key, provider);

/**
 * 📌 Получение баланса горячего кошелька
 */
const getHotWalletBalance = async (network = 'tron') => {
    try {
        if (network === 'tron') {
            const walletAddress = tronWeb.address.fromPrivateKey(config.tron_private_key);
            const balance = await tronWeb.trx.getBalance(walletAddress);
            return BigNumber.from(balance).div(1e6).toString();
        } else {
            const balance = await wallet.getBalance();
            return ethers.utils.formatEther(balance);
        }
    } catch (error) {
        logger.error(`❌ Ошибка получения баланса (${network}): ${error.message}`);
        throw error;
    }
};

/**
 * 📌 Отправка USDT (TRC-20) с подтверждением
 */
const sendUSDT = async (recipient, amount, retries = 3) => {
    try {
        const contract = await tronWeb.contract().at(config.usdt_token_address);
        let txHash;

        for (let i = 0; i < retries; i++) {
            try {
                txHash = await contract.transfer(recipient, TronWeb.toSun(amount)).send();
                logger.info(`✅ USDT отправлено: Tx: ${txHash}`);
                return txHash;
            } catch (error) {
                logger.warn(`🚨 Ошибка отправки USDT (попытка ${i + 1}): ${error.message}`);
                if (i < retries - 1) await delay(5000);
            }
        }
        throw new Error('Ошибка отправки USDT после всех попыток');
    } catch (error) {
        logger.error(`❌ Ошибка отправки USDT: ${error.message}`);
        throw error;
    }
};

module.exports = { getHotWalletBalance, sendUSDT };
