const TronWeb = require('tronweb');
const { ethers, BigNumber } = require('ethers');
const logger = require('../services/loggingService');
const config = require('../../config');
const delay = (ms) => new Promise((res) => setTimeout(res, ms));

// Инициализация Tron
const tronWeb = new TronWeb({
    fullHost: process.env.TRON_API_URL,
    privateKey: process.env.HOT_WALLET_PRIVATE_KEY
});

// Инициализация EVM
const provider = new ethers.JsonRpcProvider(config.MTT_NETWORK_RPC);
const wallet = new ethers.Wallet(process.env.HOT_WALLET_PRIVATE_KEY, provider);

/**
 * 📌 Получение баланса горячего кошелька
 */
const getHotWalletBalance = async () => {
    try {
        const walletAddress = tronWeb.address.fromPrivateKey(process.env.TRON_PRIVATE_KEY);
        const balance = await tronWeb.trx.getBalance(walletAddress);
        return BigNumber.from(balance).div(BigNumber.from(1e6)).toString();
    } catch (error) {
        logger.error(`Ошибка получения баланса: ${error.message}`);
        throw error;
    }
};

/**
 * 📌 Отправка USDT (TRC-20) с ретраями
 */
const sendUSDT = async (recipient, amount, retries = 3) => {
    try {
        const contract = await tronWeb.contract().at(config.USDT_TOKEN_ADDRESS);
        const sender = tronWeb.address.fromPrivateKey(process.env.TRON_PRIVATE_KEY);

        logger.info(`🚀 Отправка ${amount} USDT на ${recipient} с ${sender}`);

        let txHash;
        for (let i = 0; i < retries; i++) {
            try {
                txHash = await contract.transfer(recipient, TronWeb.toSun(amount)).send();
                logger.info(`✅ USDT отправлено: Tx: ${txHash}`);
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

module.exports = { getHotWalletBalance, sendUSDT };
