
const hre = require("hardhat");

async function main() {
  // Получаем адрес кошелька для комиссии
  const commissionWalletAddress = process.env.COMMISSION_WALLET_ADDRESS;

  if (!commissionWalletAddress) {
    throw new Error("COMMISSION_WALLET_ADDRESS must be set in environment variables");
  }

  const MTTEscrow = await hre.ethers.getContractFactory("MTTEscrow");
  const mttEscrow = await MTTEscrow.deploy(commissionWalletAddress);
  await mttEscrow.deployed();
  
  console.log("MTTEscrow deployed to:", mttEscrow.address);
  console.log("MTT Token address:", mttTokenAddress);
  console.log("Commission wallet address:", commissionWalletAddress);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
