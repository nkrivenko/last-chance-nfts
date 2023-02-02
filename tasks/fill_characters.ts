import { task } from "hardhat/config";
import { HardhatRuntimeEnvironment } from "hardhat/types";

task("fillCharacter", "Generates character types and sets base URI")
  .addParam("character", "Character contract address")
  .addParam("baseuri", "Token base URI")
  .setAction(async (taskArgs: any, hre: HardhatRuntimeEnvironment) => {
    console.log(taskArgs)

  const characterContractAddress = taskArgs.character;
  const baseURI = taskArgs.baseuri;
  
  const contract = await hre.ethers.getContractAt("Character", characterContractAddress);
  const characterImmutableCharacteristics = [
    {rarity: 0, name: "Agent Becker", maxLevel: 40, issueDate: +new Date(), activeSkill1: "K-56 grenade", activeSkill2: "Medpack"},
    {rarity: 1, name: "Agent Karter", maxLevel: 50, issueDate: +new Date(), activeSkill1: "Cluster Grenade", activeSkill2: "Stimpack"},
    {rarity: 2, name: "Desert Wolf", maxLevel: 60, issueDate: +new Date(), activeSkill1: "Tungsten Eye", activeSkill2: "Tungsten Artifact"},
    {rarity: 3, name: "Royal Sektor", maxLevel: 70, issueDate: +new Date(), activeSkill1: "Royal Armor", activeSkill2: "Royal Weapon"},
    {rarity: 4, name: "Dullahan", maxLevel: 80, issueDate: +new Date(), activeSkill1: "Spectral Explode", activeSkill2: "Phantom Sword"},
    {rarity: 4, name: "Agent Gray", maxLevel: 80, issueDate: +new Date(), activeSkill1: "Tungsten Glove", activeSkill2: "Tungsten Wave"}
  ];

  for(var i = 1; i <= 6; i++) {
    await contract.addNewTokenType(i, characterImmutableCharacteristics[i - 1]);
  }

  await contract.setBaseURI(baseURI);
});
