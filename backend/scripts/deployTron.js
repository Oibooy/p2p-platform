
const tronWeb = require('../src/utils/tronWeb');

async function main() {
  const usdtAddress = process.env.USDT_TOKEN_ADDRESS;
  const commissionWalletAddress = process.env.TRON_COMMISSION_WALLET_ADDRESS;

  if (!usdtAddress || !commissionWalletAddress) {
    throw new Error("USDT_TOKEN_ADDRESS and COMMISSION_WALLET_ADDRESS must be set");
  }

  try {
    const TronEscrow = await tronWeb.contract().new({
      abi: [/* ABI будет автоматически сгенерирован */],
      bytecode: '/* Байткод будет автоматически сгенерирован */',
      feeLimit: 1000000000,
      callValue: 0,
      parameters: [usdtAddress, commissionWalletAddress]
    });

    console.log('TronEscrow deployed to:', TronEscrow.address);
    console.log('USDT Token address:', usdtAddress);
    console.log('Commission wallet address:', commissionWalletAddress);
  } catch (error) {
    console.error('Deployment error:', error);
  }
}

main();