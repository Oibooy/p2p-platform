
const { JsonRpcProvider, Wallet } = require('ethers');
const logger = require('./logger');

if (!process.env.MTT_RPC_URL) {
  throw new Error('MTT_RPC_URL is not defined in environment variables.');
}

if (!process.env.MTT_PRIVATE_KEY) {
  throw new Error('MTT_PRIVATE_KEY is not defined in environment variables.');
}

const provider = new JsonRpcProvider(process.env.MTT_RPC_URL, {
  name: 'MTT',
  chainId: 6880
});

const wallet = new Wallet(process.env.MTT_PRIVATE_KEY, provider);

async function checkConnection() {
  try {
    const network = await provider.getNetwork();
    const blockNumber = await provider.getBlockNumber();

    // Исправленная проверка chainId
    const chainId = Number(network.chainId);
    if (chainId !== 6880) {
      throw new Error(`Неверный Chain ID: ${chainId}. Ожидается: 6880`);
    }

    logger.info(
      `Подключено к MTT Network: ${network.name}, Chain ID: ${chainId}, Block: ${blockNumber}`
    );
  } catch (error) {
    logger.error(`Ошибка подключения к MTT Network: ${error.message}`);
    throw error; // Пробрасываем оригинальную ошибку для лучшей диагностики
  }
}

checkConnection();

module.exports = { provider, wallet };
