
require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config();

module.exports = {
  solidity: "0.8.19",
  networks: {
    mtt: {
      url: process.env.MTT_RPC_URL,
      accounts: [process.env.MTT_PRIVATE_KEY]
    }
  }
};
