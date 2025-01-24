
const hre = require("hardhat");

async function main() {
  const MTTEscrow = await hre.ethers.getContractFactory("MTTEscrow");
  const mttEscrow = await MTTEscrow.deploy(process.env.MTT_TOKEN_ADDRESS);
  await mttEscrow.deployed();
  
  console.log("MTTEscrow deployed to:", mttEscrow.address);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
