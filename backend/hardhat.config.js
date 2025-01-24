require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config();

module.exports = {
  solidity: "0.8.19",
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
    }
  }
};