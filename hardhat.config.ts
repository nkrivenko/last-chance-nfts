import { HardhatUserConfig } from "hardhat/config";
import { config as dotenvConfig } from "dotenv";
import "@nomicfoundation/hardhat-toolbox";
import "@nomiclabs/hardhat-ethers";
import "@nomiclabs/hardhat-solhint";

import "@openzeppelin/hardhat-upgrades";
import 'hardhat-storage-layout'
import { resolve } from "path";

import './tasks/grant_operator_role';
import './tasks/fill_characters';

dotenvConfig({ path: resolve(__dirname, "./.env") });

const config: HardhatUserConfig = {
  solidity: {
    version: "0.8.17",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
    }
  },
  gasReporter: {
    coinmarketcap: process.env.COINMARKETCAP,
    token: 'MATIC',
    gasPriceApi: 'https://api.polygonscan.com/api?module=proxy&action=eth_gasPrice'
  },
  networks: {
    hardhat: {
    },
    mumbai: {
      url: "https://rpc-mumbai.maticvigil.com",
      accounts: [process.env.PRIVATE_KEY ?? '']
    },
    matic: {
      url: "https://polygon-rpc.com/",
      accounts: [process.env.PRIVATE_KEY ?? ''],
      chainId: 137
    }
  },
  etherscan: {
    apiKey: process.env.POLYGONSCAN_API_KEY
  },
};

export default config;
