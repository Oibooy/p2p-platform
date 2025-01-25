const TronWeb = require('tronweb');
const dotenv = require('dotenv');
const logger = require('./logger');
const HttpProvider = TronWeb.providers.HttpProvider;

dotenv.config();

if (!process.env.TRON_API_URL) {
  throw new Error('TRON_API_URL is not defined in .env');
}

if (!process.env.TRON_PRIVATE_KEY) {
  logger.warn('TRON_PRIVATE_KEY is not defined. Transactions requiring private key may fail.');
}

const fullNode = new HttpProvider(process.env.TRON_API_URL);
const solidityNode = new HttpProvider(process.env.TRON_SOLIDITY_NODE || process.env.TRON_API_URL);
const eventServer = new HttpProvider(process.env.TRON_EVENT_SERVER || process.env.TRON_API_URL);

const tronWeb = new TronWeb(
    fullNode,
    solidityNode,
    eventServer,
    process.env.TRON_PRIVATE_KEY
);

// Add API key if provided
if (process.env.TRON_API_KEY) {
    tronWeb.setHeader({"TRON-PRO-API-KEY": process.env.TRON_API_KEY});
}

module.exports = tronWeb;