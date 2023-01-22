import { HardhatUserConfig } from "hardhat/config";
import { config as dotenvConfig } from "dotenv";
import "@nomicfoundation/hardhat-toolbox";
import "@nomiclabs/hardhat-ethers";
import "@nomiclabs/hardhat-solhint";

import "@openzeppelin/hardhat-upgrades";
import { resolve } from "path";

dotenvConfig({ path: resolve(__dirname, "./.env") });

const config: HardhatUserConfig = {
  solidity: {
    version: "0.8.17",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200
      }
    }
  },
  gasReporter: {
    coinmarketcap: process.env.COINMARKETCAP,
    token: 'MATIC',
    gasPriceApi: 'https://api.polygonscan.com/api?module=proxy&action=eth_gasPrice'
  }
};

export default config;
