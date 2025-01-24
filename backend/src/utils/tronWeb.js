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

const tronWeb = new TronWeb({
    fullHost: process.env.TRON_API_URL,
    privateKey: process.env.TRON_PRIVATE_KEY || '',
    headers: { "TRON-PRO-API-KEY": process.env.TRON_API_KEY },
    timeout: 30000,
    eventServer: process.env.TRON_EVENT_SERVER || process.env.TRON_API_URL
});

// Включаем кэширование для снижения нагрузки
tronWeb.setHeader({"Content-Type": "application/json"});

(async () => {
  try {
    const nodeInfo = await tronWeb.trx.getNodeInfo();
    console.log('Full Node Info:', JSON.stringify(nodeInfo, null, 2)); 
    const nodeName = nodeInfo?.nodeName || 'Unknown Node';
    logger.info(`Connected to Tron node: ${nodeName}`);
  } catch (error) {
    logger.error(`Failed to connect to Tron node: ${error.message}`);
    throw new Error('Tron node connection failed');
  }
})();

module.exports = tronWeb;