const { JsonRpcProvider, Wallet } = require('ethers');
const logger = require('./logger');

// Проверяем переменные окружения
if (!process.env.MTT_RPC_URL) {
  throw new Error('MTT_RPC_URL is not defined in environment variables.');
}

if (!process.env.MTT_PRIVATE_KEY) {
  throw new Error('MTT_PRIVATE_KEY is not defined in environment variables.');
}

// Создаем провайдер и кошелек
const provider = new JsonRpcProvider(process.env.MTT_RPC_URL, {
  name: 'MTT',
  chainId: 6880, // Укажите chainId для MTT сети
});
const wallet = new Wallet(process.env.MTT_PRIVATE_KEY, provider);

// Проверяем соединение
async function checkConnection() {
  try {
    const network = await provider.getNetwork();
    const blockNumber = await provider.getBlockNumber();

    if (network.chainId !== 6880) {
      throw new Error(`Unexpected Chain ID: ${network.chainId}. Expected: 6880`);
    }

    logger.info(
      `Connected to MTT Network: ${network.name}, Chain ID: ${network.chainId}, Block: ${blockNumber}`
    );
  } catch (error) {
    logger.error(`Failed to connect to MTT Network: ${error.message}`);
    throw new Error('MTT Network connection failed');
  }
}

checkConnection();

module.exports = { provider, wallet };

