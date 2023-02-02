import { task } from "hardhat/config";
import { HardhatRuntimeEnvironment } from "hardhat/types";

const ROLE_OPERATOR = '0xaa3edb77f7c8cc9e38e8afe78954f703aeeda7fffe014eeb6e56ea84e62f6da7';

task("grantOperator", "Grants ROLE_OPERATOR on WEAPON and CHARACTER contracts to a given account")
  .addParam("weapon", "Weapon contract address")
  .addParam("character", "Character contract address")
  .addParam("grantee", "Account to which ROLE_OPERATOR will be granted")
  .setAction(async ({ character, weapon, grantee }, hre: HardhatRuntimeEnvironment) => {
  
    await hre.ethers.getContractAt("Weapon", weapon)
      .then(contract => contract.grantRole(ROLE_OPERATOR, grantee))
      .then(_ => console.log(`Weapon: Granted ROLE_OPERATOR to ${grantee}`))
    await hre.ethers.getContractAt("Character", character)
      .then(contract => contract.grantRole(ROLE_OPERATOR, grantee))
      .then(_ => console.log(`Character: Granted ROLE_OPERATOR to ${grantee}`))

});
