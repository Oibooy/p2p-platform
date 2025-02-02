// src/services/hotWalletService.js
const TronWeb = require('tronweb');
const logger = require('../services/loggingService');
const config = require('../../config');

const tronWeb = new TronWeb({
    fullHost: process.env.TRON_API_URL
    privateKey: process.env.TRON_PRIVATE_KEY
});

/**
 * 📌 Получение баланса горячего кошелька
 */
const getHotWalletBalance = async () => {
    try {
        const walletAddress = tronWeb.address.fromPrivateKey(process.env.TRON_PRIVATE_KEY);
        const balance = await tronWeb.trx.getBalance(walletAddress);
        return balance / 1e6; // Конвертация в TRX
    } catch (error) {
        logger.logError(`Ошибка получения баланса: ${error.message}`);
        throw error;
    }
};

/**
 * 📌 Отправка USDT (TRC-20) с горячего кошелька
 */
const sendUSDT = async (recipient, amount) => {
    try {
        const contract = await tronWeb.contract().at(config.USDT_TOKEN_ADDRESS);
        const sender = tronWeb.address.fromPrivateKey(process.env.TRON_PRIVATE_KEY);

        logger.info(`🚀 Отправка ${amount} USDT на адрес ${recipient} с кошелька ${sender}`);

        const transaction = await contract.transfer(recipient, amount * 1e6).send();
        return transaction;
    } catch (error) {
        logger.logError(`❌ Ошибка при отправке USDT: ${error.message}`);
        throw error;
    }
};

/**
 * 📌 Мониторинг входящих транзакций на горячий кошелек
 */
const monitorIncomingTransactions = async () => {
    try {
        const walletAddress = tronWeb.address.fromPrivateKey(process.env.TRON_PRIVATE_KEY);

        setInterval(async () => {
            const transactions = await tronWeb.getEventResult(config.USDT_TOKEN_ADDRESS, 'Transfer', {
                filters: { to: walletAddress },
                onlyConfirmed: true
            });

            transactions.forEach(tx => {
                logger.info(`💰 Получено ${tx.value / 1e6} USDT на кошелек ${walletAddress} от ${tx.from}`);
                // Дальнейшая обработка в EscrowService
            });
        }, 15000); // Проверка каждые 15 секунд
    } catch (error) {
        logger.logError(`❌ Ошибка мониторинга транзакций: ${error.message}`);
    }
};

module.exports = { getHotWalletBalance, sendUSDT, monitorIncomingTransactions };
