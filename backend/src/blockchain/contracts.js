const { ethers } = require('ethers');
const TronWeb = require('tronweb');
const logger = require('../infrastructure/logger');
const MTTEscrow = require('../../artifacts/contracts/MTTEscrow.sol/MTTEscrow.json');
const TronEscrow = require('../../artifacts/contracts/TronEscrow.sol/TronEscrow.json');
const config = require('../config');
const delay = (ms) => new Promise((res) => setTimeout(res, ms));

class ContractManager {
  constructor() {
    this.contracts = {};
  }

  async initializeTron(retries = 3) {
    for (let i = 0; i < retries; i++) {
      try {
        const tronWeb = new TronWeb({
          fullHost: config.tron_api_url,
          privateKey: config.tron_private_key,
        });
        this.contracts.tronEscrow = await tronWeb.contract().at(config.tron_escrow_address);
        logger.info('✅ Tron контракт инициализирован');
        return;
      } catch (error) {
        logger.error(`❌ Ошибка инициализации Tron (попытка ${i + 1}): ${error.message}`);
        if (i < retries - 1) await delay(5000);
      }
    }
    throw new Error('❌ Не удалось инициализировать Tron после всех попыток');
  }

  async initializeMTT(retries = 3) {
    for (let i = 0; i < retries; i++) {
      try {
        const provider = new ethers.providers.JsonRpcProvider(config.mtt_rpc_url);
        const wallet = new ethers.Wallet(config.mtt_private_key, provider);
        this.contracts.mttEscrow = new ethers.Contract(config.mtt_escrow_address, MTTEscrow.abi, wallet);
        logger.info('✅ MTT контракт инициализирован');
        return;
      } catch (error) {
        logger.error(`❌ Ошибка инициализации MTT (попытка ${i + 1}): ${error.message}`);
        if (i < retries - 1) await delay(5000);
      }
    }
    throw new Error('❌ Не удалось инициализировать MTT после всех попыток');
  }

  async getBalance(address, network = 'tron') {
    try {
      if (network === 'tron' && this.contracts.tronEscrow) {
        return await this.contracts.tronEscrow.balanceOf(address).call();
      } else if (network === 'mtt' && this.contracts.mttEscrow) {
        return await this.contracts.mttEscrow.balanceOf(address);
      }
      throw new Error('❌ Контракт не инициализирован');
    } catch (error) {
      logger.error(`❌ Ошибка получения баланса (${network}): ${error.message}`);
      return null;
    }
  }
}

module.exports = new ContractManager();
