
const tronWeb = require('../utils/tronWeb');
const { wallet: mttWallet } = require('../utils/mttWeb');
const logger = require('../utils/logger');
const ethers = require('ethers');

const USDT_CONTRACT_ADDRESS = process.env.USDT_CONTRACT_ADDRESS;
const MTT_CONTRACT_ADDRESS = process.env.MTT_CONTRACT_ADDRESS;
const MTT_ESCROW_ADDRESS = process.env.MTT_ESCROW_ADDRESS;
const TRON_ESCROW_ADDRESS = process.env.TRON_ESCROW_ADDRESS;

async function createDeal(token, seller, amount, deadline) {
  try {
    if (token === 'USDT') {
      const contract = await tronWeb.contract().at(TRON_ESCROW_ADDRESS);
      const tx = await contract.createDeal(seller, amount, deadline).send({
        feeLimit: 100000000,
      });
      logger.info('USDT deal created:', tx);
      return { success: true, tx };
    } else if (token === 'MTT') {
      const contract = new ethers.Contract(
        MTT_ESCROW_ADDRESS,
        ['function createDeal(address seller, uint256 deadline) payable'],
        mttWallet
      );
      const tx = await contract.createDeal(seller, deadline, { value: amount });
      const receipt = await tx.wait();
      logger.info('MTT deal created:', receipt);
      return { success: true, tx: receipt };
    }
    throw new Error('Unsupported token type');
  } catch (error) {
    logger.error(`Error in createDeal: ${error.message}`);
    return { success: false, error: error.message };
  }
}

async function releaseFunds(token, dealId) {
  try {
    if (token === 'USDT') {
      const contract = await tronWeb.contract().at(TRON_ESCROW_ADDRESS);
      const tx = await contract.releaseFunds(dealId).send({
        feeLimit: 100000000,
      });
      logger.info('USDT funds released:', tx);
      return { success: true, tx };
    } else if (token === 'MTT') {
      const contract = new ethers.Contract(
        MTT_ESCROW_ADDRESS,
        ['function releaseFunds(uint256 dealId)'],
        mttWallet
      );
      const tx = await contract.releaseFunds(dealId);
      const receipt = await tx.wait();
      logger.info('MTT funds released:', receipt);
      return { success: true, tx: receipt };
    }
    throw new Error('Unsupported token type');
  } catch (error) {
    logger.error(`Error in releaseFunds: ${error.message}`);
    return { success: false, error: error.message };
  }
}

async function refundFunds(token, dealId) {
  try {
    if (token === 'USDT') {
      const contract = await tronWeb.contract().at(TRON_ESCROW_ADDRESS);
      const tx = await contract.refundFunds(dealId).send({
        feeLimit: 100000000,
      });
      logger.info('USDT funds refunded:', tx);
      return { success: true, tx };
    } else if (token === 'MTT') {
      const contract = new ethers.Contract(
        MTT_ESCROW_ADDRESS,
        ['function refundFunds(uint256 dealId)'],
        mttWallet
      );
      const tx = await contract.refundFunds(dealId);
      const receipt = await tx.wait();
      logger.info('MTT funds refunded:', receipt);
      return { success: true, tx: receipt };
    }
    throw new Error('Unsupported token type');
  } catch (error) {
    logger.error(`Error in refundFunds: ${error.message}`);
    return { success: false, error: error.message };
  }
}

async function getDeal(token, dealId) {
  try {
    if (token === 'USDT') {
      const contract = await tronWeb.contract().at(TRON_ESCROW_ADDRESS);
      const deal = await contract.deals(dealId).call();
      return { success: true, deal };
    } else if (token === 'MTT') {
      const contract = new ethers.Contract(
        MTT_ESCROW_ADDRESS,
        ['function deals(uint256) view returns (address buyer, address seller, uint256 amount, uint256 deadline, bool isReleased, bool isRefunded)'],
        mttWallet
      );
      const deal = await contract.deals(dealId);
      return { success: true, deal };
    }
    throw new Error('Unsupported token type');
  } catch (error) {
    logger.error(`Error in getDeal: ${error.message}`);
    return { success: false, error: error.message };
  }
}

module.exports = {
  createDeal,
  releaseFunds,
  refundFunds,
  getDeal
};
