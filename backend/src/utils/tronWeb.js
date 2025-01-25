
const TronWeb = require('tronweb');
const dotenv = require('dotenv');
const logger = require('./logger');

dotenv.config();

if (!process.env.TRON_API_URL) {
  throw new Error('TRON_API_URL is not defined in .env');
}

if (!process.env.TRON_PRIVATE_KEY) {
  logger.warn('TRON_PRIVATE_KEY is not defined. Transactions requiring private key may fail.');
}

const fullNode = process.env.TRON_API_URL;
const solidityNode = process.env.TRON_SOLIDITY_NODE || process.env.TRON_API_URL;
const eventServer = process.env.TRON_EVENT_SERVER || process.env.TRON_API_URL;
const privateKey = process.env.TRON_PRIVATE_KEY;

const tronWeb = new TronWeb(
    fullNode,
    solidityNode,
    eventServer,
    privateKey
);

if (process.env.TRON_API_KEY) {
    tronWeb.setHeader({"TRON-PRO-API-KEY": process.env.TRON_API_KEY});
}

module.exports = tronWeb;
