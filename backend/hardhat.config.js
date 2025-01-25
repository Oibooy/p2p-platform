
require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config();

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: {
    version: "0.8.20",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200
      }
    }
  },
  paths: {
    sources: "./contracts",
    tests: "./test",
    cache: "./cache",
    artifacts: "./artifacts"
  },
  networks: {
    mtt: {
      url: process.env.MTT_RPC_URL,
      accounts: [process.env.MTT_PRIVATE_KEY]
    },
    tron: {
      url: process.env.TRON_API_URL || "https://nile.trongrid.io",
      network_id: "3",
      privateKey: process.env.TRON_PRIVATE_KEY,
      userFeePercentage: 100,
      feeLimit: 1000000000,
      originEnergyLimit: 1000000
    }
  }
};
