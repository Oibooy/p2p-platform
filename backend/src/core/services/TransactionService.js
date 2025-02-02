// src/services/TransactionService.js
const TronWeb = require('tronweb');
const { ethers } = require('ethers');
const config = require('../../config');
const UserRepository = require('../../db/repositories/UserRepository');
const logger = require('../services/loggingService');
const express = require('express');
const WebSocket = require('ws');

// Инициализация TronWeb для работы с USDT
const tronWeb = new TronWeb({
    fullHost: process.env.TRON_API_URL,
    privateKey: process.env.HOT_WALLET_PRIVATE_KEY
});

// Инициализация Ethers.js для MTT
const provider = new ethers.JsonRpcProvider(config.MTT_NETWORK_RPC);
const wallet = new ethers.Wallet(process.env.HOT_WALLET_PRIVATE_KEY, provider);

// WebSocket-сервер для уведомлений
const wss = new WebSocket.Server({ port: config.WEBSOCKET_PORT });

/**
 * 📌 Отправка USDT (TRC-20)
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
 * 📌 Отправка MTT (EVM)
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
 * 📌 Webhook для входящих транзакций USDT (TRC-20)
 */
const app = express();
app.use(express.json());

app.post('/webhook/usdt', async (req, res) => {
    try {
        const { transaction_id, to, value } = req.body;
        const user = await UserRepository.findByWallet('USDT', to);
        if (!user) return res.status(200).send('OK');

        await UserRepository.updateUserBalance(user._id, 'USDT', value / 1e6);
        logger.info(`📥 Пополнение: ${value / 1e6} USDT для ${to}`);

        // Оповещение через WebSocket
        wss.clients.forEach(client => {
            if (client.readyState === WebSocket.OPEN) {
                client.send(JSON.stringify({ type: 'deposit', currency: 'USDT', amount: value / 1e6, userId: user._id }));
            }
        });

        res.status(200).send('OK');
    } catch (error) {
        logger.logError(`Ошибка обработки Webhook USDT: ${error.message}`);
        res.status(500).send('Ошибка');
    }
});

/**
 * 📌 Webhook для входящих транзакций MTT (EVM)
 */
app.post('/webhook/mtt', async (req, res) => {
    try {
        const { transactionHash, to, value } = req.body;
        const user = await UserRepository.findByWallet('MTT', to);
        if (!user) return res.status(200).send('OK');

        await UserRepository.updateUserBalance(user._id, 'MTT', ethers.formatEther(value));
        logger.info(`📥 Пополнение: ${ethers.formatEther(value)} MTT для ${to}`);

        // Оповещение через WebSocket
        wss.clients.forEach(client => {
            if (client.readyState === WebSocket.OPEN) {
                client.send(JSON.stringify({ type: 'deposit', currency: 'MTT', amount: ethers.formatEther(value), userId: user._id }));
            }
        });

        res.status(200).send('OK');
    } catch (error) {
        logger.logError(`Ошибка обработки Webhook MTT: ${error.message}`);
        res.status(500).send('Ошибка');
    }
});

// Запуск Webhook-сервера
const PORT = config.WEBHOOK_PORT || 4000;
app.listen(PORT, () => {
    logger.info(`🚀 Webhook-сервер слушает на порту ${PORT}`);
});

module.exports = { sendUSDT, sendMTT };

const TronWeb = require('tronweb');
const { ethers } = require('ethers');
const config = require('../../config');
const { getUserWallet, updateWalletBalance } = require('../../db/repositories/WalletRepository');
const logger = require('../services/loggingService');

const tronWeb = new TronWeb({
    fullHost: config.TRON_NODE,
    privateKey: config.HOT_WALLET_PRIVATE_KEY
});

const provider = new ethers.JsonRpcProvider(config.MTT_NETWORK_RPC);
const wallet = new ethers.Wallet(config.HOT_WALLET_PRIVATE_KEY, provider);

const MIN_REQUIRED_TRX = 10 * 1e6;
const MIN_TOP_UP_TRX = 20 * 1e6;

class TransactionService {
    static async withdraw(userId, amount) {
        const wallet = await getUserWallet(userId);
        if (!wallet) throw new Error('Wallet not found');

        try {
            let tronBalance = await tronWeb.trx.getBalance(wallet.USDT);

            if (tronBalance < MIN_REQUIRED_TRX) {
                logger.warn(`Low TRX balance for ${wallet.USDT}, topping up...`);
                await tronWeb.trx.sendTransaction(wallet.USDT, MIN_TOP_UP_TRX, config.HOT_WALLET_PRIVATE_KEY);
                tronBalance = await tronWeb.trx.getBalance(wallet.USDT);
            }

            if (tronBalance < amount) {
                throw new Error('Insufficient TRX balance for withdrawal');
            }

            logger.info(`Withdrawing ${amount} TRX from ${wallet.USDT}`);
            await tronWeb.trx.sendTransaction(wallet.USDT, amount, config.HOT_WALLET_PRIVATE_KEY);

            return { success: true, newBalance: tronBalance - amount };
        } catch (error) {
            logger.error(`Withdrawal error for ${wallet.USDT}: ${error.message}`);
            throw error;
        }
    }

    static async deposit(userId, amount) {
        const wallet = await getUserWallet(userId);
        if (!wallet) throw new Error('Wallet not found');

        wallet.balance += amount;
        await updateWalletBalance(userId, wallet.balance);
        return { success: true, newBalance: wallet.balance };
    }
}

module.exports = TransactionService;

const TronWeb = require('tronweb');
const { getUserWallet, updateWalletBalance } = require('../db/repositories/WalletRepository');
const config = require('../config');
const logger = require('../infrastructure/logger');
const metrics = require('../infrastructure/metrics');

const tronWeb = new TronWeb({
  fullHost: config.TRON_NODE,
  privateKey: config.HOT_WALLET_PRIVATE_KEY,
});

const MIN_REQUIRED_TRX = 10 * 1e6; // 10 TRX в SUN (1 TRX = 1e6 SUN)
const MIN_TOP_UP_TRX = 20 * 1e6; // 20 TRX в SUN

class WalletService {
  static async getBalance(userId) {
    const wallet = await getUserWallet(userId);
    return wallet ? wallet.balance : 0;
  }

  static async deposit(userId, amount) {
    const wallet = await getUserWallet(userId);
    if (!wallet) throw new Error('Wallet not found');

    wallet.balance += amount;
    await updateWalletBalance(userId, wallet.balance);
    return wallet.balance;
  }

  static async withdraw(userId, amount) {
    const wallet = await getUserWallet(userId);
    if (!wallet) throw new Error('Wallet not found');

    try {
      // Проверка баланса перед транзакцией
      let tronBalance = await tronWeb.trx.getBalance(wallet.address);

      // Автоматическое пополнение TRX при нехватке
      if (tronBalance < MIN_REQUIRED_TRX) {
        logger.warn(`Low TRX balance for ${wallet.address}, topping up...`);
        await tronWeb.trx.sendTransaction(wallet.address, MIN_TOP_UP_TRX, config.HOT_WALLET_PRIVATE_KEY);
        tronBalance = await tronWeb.trx.getBalance(wallet.address); // Повторная проверка
      }

      if (tronBalance < amount) {
        throw new Error('Insufficient TRX balance for withdrawal');
      }

      logger.info(`Withdrawing ${amount} TRX from ${wallet.address}`);
      wallet.balance -= amount;
      await updateWalletBalance(userId, wallet.balance);
      metrics.increment('wallet.withdraw.success');
      return wallet.balance;
    } catch (error) {
      logger.error(`Withdrawal error for ${wallet.address}: ${error.message}`);
      metrics.increment('wallet.withdraw.failure');
      throw error;
    }
  }
}

module.exports = WalletService;

