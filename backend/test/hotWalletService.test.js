// src/tests/hotWalletService.test.js
const { generateUserWallet, sendUSDT, sendMTT, monitorIncomingTransactions } = require('../core/services/hotWalletService');
const UserRepository = require('../db/repositories/UserRepository');
const tronWeb = require('tronweb');
const { ethers } = require('ethers');
const jest = require('jest-mock');

jest.mock('../db/repositories/UserRepository');

/**
 * Тест генерации кошельков для пользователей
 */
test('should generate user wallets successfully', async () => {
    UserRepository.updateUserWallets.mockResolvedValue(true);
    const result = await generateUserWallet('12345');
    expect(result).toHaveProperty('MTT');
    expect(result).toHaveProperty('USDT');
});

/**
 * Тест отправки USDT
 */
test('should send USDT successfully', async () => {
    UserRepository.findById.mockResolvedValue({ balance: { USDT: 100 } });
    UserRepository.updateUserBalance.mockResolvedValue(true);
    tronWeb.contract = jest.fn().mockReturnValue({
        at: jest.fn().mockReturnValue({
            transfer: jest.fn().mockReturnValue({
                send: jest.fn().mockResolvedValue(true)
            })
        })
    });
    await expect(sendUSDT('12345', 'TRecipientAddress', 10)).resolves.toBeTruthy();
});

/**
 * Тест отправки MTT
 */
test('should send MTT successfully', async () => {
    UserRepository.findById.mockResolvedValue({ balance: { MTT: 100 } });
    UserRepository.updateUserBalance.mockResolvedValue(true);
    const mockWallet = {
        sendTransaction: jest.fn().mockResolvedValue({ hash: '0x1234abcd' })
    };
    ethers.Wallet = jest.fn().mockReturnValue(mockWallet);
    await expect(sendMTT('12345', '0xRecipientAddress', 10)).resolves.toBe('0x1234abcd');
});

/**
 * Тест мониторинга входящих транзакций
 */
test('should monitor transactions successfully', async () => {
    UserRepository.getAllUsers.mockResolvedValue([
        { _id: '12345', wallets: { USDT: 'TUserUSDTAddress', MTT: '0xUserMTTAddress' } }
    ]);
    tronWeb.trx = { getBalance: jest.fn().mockResolvedValue(20000000) };
    ethers.JsonRpcProvider.prototype.getBalance = jest.fn().mockResolvedValue(ethers.parseEther('5'));
    await expect(monitorIncomingTransactions()).resolves.toBeUndefined();
});
