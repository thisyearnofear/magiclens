import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import * as dotenv from "dotenv";

dotenv.config();

const PRIVATE_KEY = process.env.XLAYER_DEPLOYER_PRIVATE_KEY || "";

const config: HardhatUserConfig = {
  solidity: {
    version: "0.8.27",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
      viaIR: true,
      evmVersion: "paris",
    },
  },
  networks: {
    hardhat: {
      chainId: 1337,
    },
    // X Layer Testnet
    xlayerTestnet: {
      url: process.env.XLAYER_TESTNET_RPC || "https://testrpc.xlayer.tech/terigon",
      chainId: 1952,
      accounts: PRIVATE_KEY ? [PRIVATE_KEY] : [],
      gasPrice: "auto",
    },
    // X Layer Mainnet
    xlayerMainnet: {
      url: process.env.XLAYER_MAINNET_RPC || "https://rpc.xlayer.tech",
      chainId: 196,
      accounts: PRIVATE_KEY ? [PRIVATE_KEY] : [],
      gasPrice: "auto",
    },
  },
  etherscan: {
    apiKey: {
      xlayerTestnet: process.env.XLAYER_EXPLORER_API_KEY || "",
      xlayerMainnet: process.env.XLAYER_EXPLORER_API_KEY || "",
    },
    customChains: [
      {
        network: "xlayerTestnet",
        chainId: 1952,
        urls: {
          apiURL: "https://www.oklink.com/api/v5/explorer/contract/verify-source-plugin/api/1952",
          browserURL: "https://www.oklink.com/xlayer-testnet",
        },
      },
      {
        network: "xlayerMainnet",
        chainId: 196,
        urls: {
          apiURL: "https://www.oklink.com/api/v5/explorer/contract/verify-source-plugin/api/196",
          browserURL: "https://www.oklink.com/xlayer",
        },
      },
    ],
  },
};

export default config;
