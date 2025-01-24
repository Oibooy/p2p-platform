const tronWeb = require('../utils/tronWeb');
const { wallet: mttWallet } = require('../utils/mttWeb');
const logger = require('../utils/logger');
const ethers = require('ethers'); // Added ethers.js import

const USDT_CONTRACT_ADDRESS = process.env.USDT_CONTRACT_ADDRESS;
const MTT_CONTRACT_ADDRESS = process.env.MTT_CONTRACT_ADDRESS;
const ESCROW_CONTRACT_ADDRESS = process.env.ESCROW_CONTRACT_ADDRESS;

async function depositFunds(dealId, token, amount, from, to) {
  try {
    if (token === 'USDT') {
      const contract = await tronWeb.contract().at(ESCROW_CONTRACT_ADDRESS);
      const tx = await contract.deposit(dealId, to, amount).send({
        feeLimit: 100000000,
      });
      logger.info('USDT deposit successful:', tx);
      return { success: true, tx };
    } else if (token === 'MTT') {
      const contract = new ethers.Contract(
        MTT_CONTRACT_ADDRESS,
        ['function approve(address spender, uint256 amount)', 'function transferFrom(address from, address to, uint256 amount)'],
        mttWallet
      );

      // Approve escrow contract
      const approveTx = await contract.approve(ESCROW_CONTRACT_ADDRESS, amount);
      await approveTx.wait();

      // Deposit to escrow
      const escrowContract = new ethers.Contract(
        ESCROW_CONTRACT_ADDRESS,
        ['function depositMTT(uint256 dealId, address to, uint256 amount)'],
        mttWallet
      );
      const tx = await escrowContract.depositMTT(dealId, to, amount);
      const receipt = await tx.wait();

      logger.info('MTT deposit successful:', receipt);
      return { success: true, tx: receipt };
    }

    throw new Error('Unsupported token type');
  } catch (error) {
    logger.error(`Error in depositFunds: ${error.message}`);
    return { success: false, error: error.message };
  }
}

async function releaseFunds(dealId, token, amount, to) {
  try {
    if (token === 'USDT') {
      const contract = await tronWeb.contract().at(ESCROW_CONTRACT_ADDRESS);
      const tx = await contract.release(dealId, to, amount).send({
        feeLimit: 100000000,
      });
      logger.info('USDT release successful:', tx);
      return { success: true, tx };
    } else if (token === 'MTT') {
      const contract = new ethers.Contract(
        ESCROW_CONTRACT_ADDRESS,
        ['function releaseMTT(uint256 dealId, address to, uint256 amount)'],
        mttWallet
      );
      const tx = await contract.releaseMTT(dealId, to, amount);
      const receipt = await tx.wait();

      logger.info('MTT release successful:', receipt);
      return { success: true, tx: receipt };
    }

    throw new Error('Unsupported token type');
  } catch (error) {
    logger.error(`Error in releaseFunds: ${error.message}`);
    return { success: false, error: error.message };
  }
}

module.exports = { depositFunds, releaseFunds };