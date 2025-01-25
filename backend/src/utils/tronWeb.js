
const TronWeb = require('tronweb');
const dotenv = require('dotenv');
const logger = require('./logger');

dotenv.config();

// Validate required environment variables
if (!process.env.TRON_API_URL) {
  throw new Error('TRON_API_URL is not defined in .env');
}

if (!process.env.TRON_PRIVATE_KEY) {
  logger.warn('TRON_PRIVATE_KEY is not defined. Transactions requiring private key may fail.');
}

// TronWeb configuration
const fullNode = process.env.TRON_API_URL;
const solidityNode = process.env.TRON_API_URL;
const eventServer = process.env.TRON_API_URL;
const privateKey = process.env.TRON_PRIVATE_KEY || '';

const tronWeb = new TronWeb(
    fullNode,
    solidityNode,
    eventServer,
    privateKey
);

// Test connection
async function testConnection() {
    try {
        const block = await tronWeb.trx.getCurrentBlock();
        logger.info(`Connected to Tron Network. Current block: ${block.block_header.raw_data.number}`);
        return true;
    } catch (error) {
        logger.error(`Failed to connect to Tron Network: ${error.message}`);
        return false;
    }
}

// Helper function to validate Tron address
function isValidTronAddress(address) {
    try {
        return tronWeb.isAddress(address);
    } catch {
        return false;
    }
}

// Retry mechanism for transactions
async function sendTransactionWithRetry(transaction, options = {}, maxRetries = 3) {
    let lastError;
    for (let i = 0; i < maxRetries; i++) {
        try {
            const result = await transaction.send(options);
            return result;
        } catch (error) {
            lastError = error;
            logger.warn(`Transaction attempt ${i + 1} failed: ${error.message}`);
            await new Promise(resolve => setTimeout(resolve, 2000 * (i + 1))); // Exponential backoff
        }
    }
    throw new Error(`Transaction failed after ${maxRetries} attempts: ${lastError.message}`);
}

// Initialize connection
testConnection().catch(error => {
    logger.error(`Initial connection test failed: ${error.message}`);
});

// Export enhanced TronWeb instance with additional utilities
module.exports = {
    tronWeb,
    testConnection,
    isValidTronAddress,
    sendTransactionWithRetry
};
