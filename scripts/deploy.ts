import { ethers, upgrades } from "hardhat";

async function deploy(contractName: string, tokenName: string, tokenSymbol: string, baseURI: string) {
  return ethers.getContractFactory(contractName)
    .then(factory => upgrades.deployProxy(factory, [tokenName, tokenSymbol, baseURI]))
}

async function main() {
  const [ weaponContract, characterContract ] = await Promise.all(
    [
      deploy("Weapon", "Weapon Gaming collection", "PGTW", "https://gateway.pinata.cloud/ipfs/QmQGuMfZRooKxnpHCLm4bwgkeMUNsvof5uSoHA1KoG3tg6/"),
      deploy("Character", "Character Gaming collection", "PGTC", "https://gateway.pinata.cloud/ipfs/QmQGuMfZRooKxnpHCLm4bwgkeMUNsvof5uSoHA1KoG3tg6/")
    ]
  )

  console.log(`Weapon contract address: ${weaponContract.address}`)
  console.log(`Character contract address: ${characterContract.address}`)
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
