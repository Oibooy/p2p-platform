
const { tronWeb } = require('../src/utils/tronWeb');
const TronEscrowArtifact = require('../artifacts/contracts/TronEscrow.sol/TronEscrow.json');

async function main() {
  const usdtAddress = process.env.USDT_TOKEN_ADDRESS;
  const commissionWalletAddress = process.env.TRON_COMMISSION_WALLET_ADDRESS;

  if (!usdtAddress || !commissionWalletAddress) {
    throw new Error("USDT_TOKEN_ADDRESS and COMMISSION_WALLET_ADDRESS must be set");
  }

  try {
    // Deploy contract
    const contract = await tronWeb.contract(TronEscrowArtifact.abi);
    const deployed = await contract.deploy({
      bytecode: TronEscrowArtifact.bytecode,
      feeLimit: 1000000000,
      callValue: 0,
      parameters: [usdtAddress, commissionWalletAddress]
    });

    console.log('TronEscrow deployed to:', deployed.address);
    console.log('USDT Token address:', usdtAddress);
    console.log('Commission wallet address:', commissionWalletAddress);
  } catch (error) {
    console.error('Deployment error:', error);
  }
}

main();
