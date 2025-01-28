
const { ethers } = require('ethers');
const TronWeb = require('tronweb');
const logger = require('../infrastructure/logger');
const MTTEscrow = require('../../artifacts/contracts/MTTEscrow.sol/MTTEscrow.json');
const TronEscrow = require('../../artifacts/contracts/TronEscrow.sol/TronEscrow.json');

class ContractManager {
  constructor(networkConfig) {
    this.config = networkConfig;
    this.contracts = {};
  }

  async initializeTron() {
    try {
      const tronWeb = new TronWeb({
        fullHost: this.config.tron.nodeUrl,
        privateKey: this.config.tron.privateKey
      });
      this.contracts.tronEscrow = await tronWeb.contract().at(this.config.tron.escrowAddress);
      logger.info('Tron contract initialized');
    } catch (error) {
      logger.error('Tron contract initialization failed:', error);
      throw error;
    }
  }

  async initializeMTT() {
    try {
      const provider = new ethers.providers.JsonRpcProvider(this.config.mtt.nodeUrl);
      const wallet = new ethers.Wallet(this.config.mtt.privateKey, provider);
      this.contracts.mttEscrow = new ethers.Contract(
        this.config.mtt.escrowAddress,
        MTTEscrow.abi,
        wallet
      );
      logger.info('MTT contract initialized');
    } catch (error) {
      logger.error('MTT contract initialization failed:', error);
      throw error;
    }
  }
}

module.exports = ContractManager;
