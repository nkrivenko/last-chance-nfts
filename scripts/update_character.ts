import { ethers, upgrades } from "hardhat";

async function upgrade(contractName: string, proxyAddress: string) {
  return ethers.getContractFactory(contractName)
    .then(factory => upgrades.upgradeProxy(proxyAddress, factory))
    .catch(err => console.error(err))
}

async function main() {
  await upgrade("Character", "0xEBD9F22DA0A720681F7Fb7632f77f79204e441e6");

  console.log("Upgraded character contract")
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
