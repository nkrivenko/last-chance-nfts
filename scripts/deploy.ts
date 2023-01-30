import { ethers, upgrades } from "hardhat";

async function deploy(contractName: string, tokenName: string, tokenSymbol: string) {
  return ethers.getContractFactory(contractName)
    .then(factory => upgrades.deployProxy(factory, [tokenName, tokenSymbol]))
}

async function main() {
  const [ weaponContract, characterContract ] = await Promise.all(
    [deploy("Weapon", "Weapon Gaming collection", "PGTW"), deploy("Character", "Character Gaming collection", "PGTC")]
  )

  console.log(`Weapon contract address: ${weaponContract.address}`)
  console.log(`Character contract address: ${characterContract.address}`)
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
