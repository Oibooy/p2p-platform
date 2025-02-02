// src/services/hotWalletService.js
const TronWeb = require('tronweb');
const logger = require('../services/loggingService');
const { ethers } = require('ethers');
const config = require('../../config');
const UserRepository = require('../../db/repositories/UserRepository');

// Настройки Tron (USDT TRC-20)
const tronWeb = new TronWeb({
    fullHost: process.env.TRON_API_URL,
    privateKey: process.env.HOT_WALLET_PRIVATE_KEY
});

// Настройки MTT (EVM, Cosmos SDK)
const provider = new ethers.JsonRpcProvider(config.MTT_NETWORK_RPC);
const wallet = new ethers.Wallet(process.env.HOT_WALLET_PRIVATE_KEY, provider);

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

/**
 * Генерирует горячий кошелек для нового пользователя
 */
const generateUserWallet = async (userId) => {
    try {
        // Генерация адресов для MTT и USDT
        const mttWallet = ethers.Wallet.createRandom();
        const usdtWallet = tronWeb.createAccount();

        await UserRepository.updateUserWallets(userId, {
            MTT: mttWallet.address,
            USDT: usdtWallet.address
        });

        return { MTT: mttWallet.address, USDT: usdtWallet.address };
    } catch (error) {
        logger.logError(`Ошибка генерации кошелька: ${error.message}`);
        throw error;
    }
};

/**
 * Отправляет USDT (TRC-20) с горячего кошелька
 */
const sendUSDT = async (userId, recipient, amount) => {
    try {
        const user = await UserRepository.findById(userId);
        if (!user || user.balance.USDT < amount) {
            throw new Error('Недостаточно средств');
        }

        const contract = await tronWeb.contract().at(config.USDT_CONTRACT_ADDRESS);
        await contract.transfer(recipient, amount * 1e6).send();

        await UserRepository.updateUserBalance(userId, 'USDT', -amount);
        logger.info(`Вывод: ${amount} USDT отправлено на ${recipient}`);
    } catch (error) {
        logger.logError(`Ошибка вывода USDT: ${error.message}`);
        throw error;
    }
};


/**
 * Отправляет MTT с горячего кошелька
 */
const sendMTT = async (userId, recipient, amount) => {
    try {
        const user = await UserRepository.findById(userId);
        if (!user || user.balance.MTT < amount) {
            throw new Error('Недостаточно средств');
        }

        const tx = await wallet.sendTransaction({
            to: recipient,
            value: ethers.parseEther(amount.toString())
        });

        await UserRepository.updateUserBalance(userId, 'MTT', -amount);
        logger.info(`Вывод: ${amount} MTT отправлено на ${recipient}`);
        return tx.hash;
    } catch (error) {
        logger.logError(`Ошибка вывода MTT: ${error.message}`);
        throw error;
    }
};

/**
 * Мониторинг входящих транзакций MTT и USDT TRC-20
 */
const monitorIncomingTransactions = async () => {
    try {
        setInterval(async () => {
            const users = await UserRepository.getAllUsers();
            for (const user of users) {
                // Проверяем входящие транзакции USDT (TRC-20)
                const usdtBalance = await tronWeb.trx.getBalance(user.wallets.USDT);
                if (usdtBalance > 0) {
                    await UserRepository.updateUserBalance(user._id, 'USDT', usdtBalance / 1e6);
                    logger.info(`Пополнение: ${usdtBalance / 1e6} USDT для ${user.wallets.USDT}`);
                }

                // Проверяем входящие транзакции MTT
                const mttBalance = await provider.getBalance(user.wallets.MTT);
                if (mttBalance > 0) {
                    await UserRepository.updateUserBalance(user._id, 'MTT', ethers.formatEther(mttBalance));
                    logger.info(`Пополнение: ${ethers.formatEther(mttBalance)} MTT для ${user.wallets.MTT}`);
                }
            }
        }, 15000); // Проверка каждые 15 секунд
    } catch (error) {
        logger.logError(`Ошибка мониторинга входящих транзакций: ${error.message}`);
    }
};

// Запускаем мониторинг транзакций при старте сервера
monitorIncomingTransactions();

module.exports = { getHotWalletBalance, sendUSDT, monitorIncomingTransactions, generateUserWallet, sendMTT, monitorIncomingTransactions };