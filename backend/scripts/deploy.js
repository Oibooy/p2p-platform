
const hre = require("hardhat");

async function main() {
  // Получаем адреса из переменных окружения
  const mttTokenAddress = process.env.MTT_TOKEN_ADDRESS;
  const commissionWalletAddress = process.env.COMMISSION_WALLET_ADDRESS;

  if (!mttTokenAddress || !commissionWalletAddress) {
    throw new Error("MTT_TOKEN_ADDRESS and COMMISSION_WALLET_ADDRESS must be set in environment variables");
  }

  const MTTEscrow = await hre.ethers.getContractFactory("MTTEscrow");
  const mttEscrow = await MTTEscrow.deploy(mttTokenAddress, commissionWalletAddress);
  await mttEscrow.deployed();
  
  console.log("MTTEscrow deployed to:", mttEscrow.address);
  console.log("MTT Token address:", mttTokenAddress);
  console.log("Commission wallet address:", commissionWalletAddress);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
