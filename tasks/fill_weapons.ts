import { task } from "hardhat/config";
import { HardhatRuntimeEnvironment } from "hardhat/types";

task("fillWeapon", "Generates weapon types and sets base URI")
  .addParam("weapon", "Weapon contract address")
  .addParam("baseuri", "Token base URI")
  .setAction(async (taskArgs: any, hre: HardhatRuntimeEnvironment) => {
    console.log(taskArgs)

  const weaponContractAddress = taskArgs.weapon;
  const baseURI = taskArgs.baseuri;
  
  const contract = await hre.ethers.getContractAt("Weapon", weaponContractAddress);

  const mintingEpoch = 0;

  const weaponImmutableCharacteristics = [
    {rarity: 0, name: "Old revolver", maxLevel: 10, mintingEpoch, improvementSlots: 0},
    {rarity: 1, name: "Serial Ocelot", maxLevel: 20, mintingEpoch, improvementSlots: 1},
    {rarity: 2, name: "Ocelot Mk. 1", maxLevel: 30, mintingEpoch, improvementSlots: 2},
    {rarity: 3, name: "Trophy Ocelot", maxLevel: 35, mintingEpoch, improvementSlots: 3},
    {rarity: 4, name: "Ocelot Mk. 2", maxLevel: 40, mintingEpoch, improvementSlots: 4},

    {rarity: 0, name: "Old Assault Rifle", maxLevel: 10, mintingEpoch, improvementSlots: 0},
    {rarity: 1, name: "Serial Betrayal", maxLevel: 20, mintingEpoch, improvementSlots: 1},
    {rarity: 2, name: "Betrayal Mk. 1", maxLevel: 30, mintingEpoch, improvementSlots: 2},
    {rarity: 3, name: "Trophy Betrayal", maxLevel: 35, mintingEpoch, improvementSlots: 3},
    {rarity: 4, name: "Betrayal Mk. 2", maxLevel: 40, mintingEpoch, improvementSlots: 4},

    {rarity: 0, name: "Old Machine Gun", maxLevel: 10, mintingEpoch, improvementSlots: 0},
    {rarity: 1, name: "Serial Thunderstorm", maxLevel: 20, mintingEpoch, improvementSlots: 1},
    {rarity: 2, name: "Thunderstorm Mk. 1", maxLevel: 30, mintingEpoch, improvementSlots: 2},
    {rarity: 3, name: "Trophy Thunderstorm", maxLevel: 35, mintingEpoch, improvementSlots: 3},
    {rarity: 4, name: "Thunderstorm Mk. 2", maxLevel: 40, mintingEpoch, improvementSlots: 4},

    {rarity: 0, name: "Old Submachine gun", maxLevel: 10, mintingEpoch, improvementSlots: 0},
    {rarity: 1, name: "Serial Whistle", maxLevel: 20, mintingEpoch, improvementSlots: 1},
    {rarity: 2, name: "Whistle", maxLevel: 30, mintingEpoch, improvementSlots: 2},
    {rarity: 3, name: "Whistle Type-Jotun", maxLevel: 35, mintingEpoch, improvementSlots: 3},
    {rarity: 4, name: "Whistle Type-Thor", maxLevel: 40, mintingEpoch, improvementSlots: 4},

    {rarity: 0, name: "Old Automatic Shotgun", maxLevel: 10, mintingEpoch, improvementSlots: 0},
    {rarity: 1, name: "Serial Viper", maxLevel: 20, mintingEpoch, improvementSlots: 1},
    {rarity: 2, name: "Officer Viper", maxLevel: 30, mintingEpoch, improvementSlots: 2},
    {rarity: 3, name: "Viper Type-Phantom", maxLevel: 35, mintingEpoch, improvementSlots: 3},
    {rarity: 4, name: "Viper Queen", maxLevel: 40, mintingEpoch, improvementSlots: 4},

    {rarity: 0, name: "Old Shotgun", maxLevel: 10, mintingEpoch, improvementSlots: 0},
    {rarity: 1, name: "Serial Doombringer", maxLevel: 20, mintingEpoch, improvementSlots: 1},
    {rarity: 2, name: "Custom Doombringer", maxLevel: 30, mintingEpoch, improvementSlots: 2},
    {rarity: 3, name: "Triple Doombringer", maxLevel: 35, mintingEpoch, improvementSlots: 3},
    {rarity: 4, name: "Royale Triple Doombringer", maxLevel: 40, mintingEpoch, improvementSlots: 4},

    {rarity: 0, name: "Old Rifle", maxLevel: 10, mintingEpoch, improvementSlots: 0},
    {rarity: 1, name: "Patriot", maxLevel: 20, mintingEpoch, improvementSlots: 1},
    {rarity: 2, name: "Steel Patriot", maxLevel: 30, mintingEpoch, improvementSlots: 2},
    {rarity: 3, name: "Power Patriot", maxLevel: 35, mintingEpoch, improvementSlots: 3},
    {rarity: 4, name: "Gauss Rifle Patriot", maxLevel: 40, mintingEpoch, improvementSlots: 4},

    {rarity: 0, name: "Old Homeland", maxLevel: 10, mintingEpoch, improvementSlots: 0},
    {rarity: 1, name: "Homeland", maxLevel: 20, mintingEpoch, improvementSlots: 1},
    {rarity: 2, name: "Custom Homeland", maxLevel: 30, mintingEpoch, improvementSlots: 2},
    {rarity: 3, name: "Heavy Homeland", maxLevel: 35, mintingEpoch, improvementSlots: 3},
    {rarity: 4, name: "Royal Homeland", maxLevel: 40, mintingEpoch, improvementSlots: 4},

    {rarity: 0, name: "Old Grenade Launcher", maxLevel: 10, mintingEpoch, improvementSlots: 0},
    {rarity: 1, name: "Veles", maxLevel: 20, mintingEpoch, improvementSlots: 1},
    {rarity: 2, name: "Trench Veles", maxLevel: 30, mintingEpoch, improvementSlots: 2},
    {rarity: 3, name: "Heavy Veles", maxLevel: 35, mintingEpoch, improvementSlots: 3},
    {rarity: 4, name: "Royal Veles", maxLevel: 40, mintingEpoch, improvementSlots: 4},

    {rarity: 0, name: "Old Rocket Launcher", maxLevel: 10, mintingEpoch, improvementSlots: 0},
    {rarity: 1, name: "Prototype M-1 Falange", maxLevel: 20, mintingEpoch, improvementSlots: 1},
    {rarity: 2, name: "Prototype M-2 Falange", maxLevel: 30, mintingEpoch, improvementSlots: 2},
    {rarity: 3, name: "M-3 Falange", maxLevel: 35, mintingEpoch, improvementSlots: 3},
    {rarity: 4, name: "Falange Type-Tornado", maxLevel: 40, mintingEpoch, improvementSlots: 4},
  ];

  for(var i = 1; i <= weaponImmutableCharacteristics.length; i++) {
    await contract.addNewTokenType(i, weaponImmutableCharacteristics[i - 1]);
  }

  await contract.setBaseURI(baseURI);
});
