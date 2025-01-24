
const { ethers } = require('ethers');
const logger = require('./logger');

if (!process.env.MTT_RPC_URL) {
  throw new Error('MTT_RPC_URL is not defined in .env');
}

const provider = new ethers.providers.JsonRpcProvider(process.env.MTT_RPC_URL);
const wallet = new ethers.Wallet(process.env.MTT_PRIVATE_KEY, provider);

async function checkConnection() {
  try {
    const network = await provider.getNetwork();
    logger.info(`Connected to MTT Network: ${network.name}`);
  } catch (error) {
    logger.error(`Failed to connect to MTT Network: ${error.message}`);
    throw new Error('MTT Network connection failed');
  }
}

checkConnection();

module.exports = { provider, wallet };
