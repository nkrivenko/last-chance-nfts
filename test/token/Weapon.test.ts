import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { Contract } from "ethers";
import { ethers, upgrades } from "hardhat";
import { expect } from "chai";

const ROLE_OPERATOR = '0xaa3edb77f7c8cc9e38e8afe78954f703aeeda7fffe014eeb6e56ea84e62f6da7';
const DEFAULT_ADMIN_ROLE = '0x0000000000000000000000000000000000000000000000000000000000000000';

describe('Weapon', () => {
    let cut: Contract;
    
    let admin: SignerWithAddress;
    let operator: SignerWithAddress;
    let tokenOwner: SignerWithAddress;

    const MAX_LEVEL = 40;
    const NAME = "Prime Games Weapon";
    const SYMBOL = "PGW"

    beforeEach(async () => {
        cut = await ethers.getContractFactory("Weapon")
            .then(factory => upgrades.deployProxy(factory, [NAME, SYMBOL], {initializer: "initialize"}));
        
        [ admin, operator, tokenOwner ] = await ethers.getSigners();

        await cut.addNewTokenType(1, {name: "First weapon", maxLevel: MAX_LEVEL, rarity: 0, improvementSlots: 1});

        await Promise.all(
            [
                cut.connect(admin).grantRole(ROLE_OPERATOR, operator.address), 
                cut.safeMint(tokenOwner.address, 1)
            ]
        )
    });

    it('should create contract with correct parameters', async () => {
        const [name, symbol] = await Promise.all(
            [
                cut.name(),
                cut.symbol()
            ]
        );

        expect(name).to.eq(NAME);
        expect(symbol).to.eq(SYMBOL);
    });

    describe('Minting process', () => {
        it('should create the weapon with correct parameters', async () => {
            const [level, enemiesHit] = await Promise.all(
                [
                    cut.level(1),
                    cut.enemiesHit(1)
                ]
            );

            expect(1).to.eq(level);
            expect(0).to.eq(enemiesHit);
        });
    });

    describe('Level up', () => {
        const EXPECTED_LEVEL = 5;

        it('should level up if called by operator', async () => {
            await cut.connect(operator).levelUp(1, EXPECTED_LEVEL);

            const newLevel = await cut.level(1);
            expect(newLevel).to.eq(EXPECTED_LEVEL);
        });

        it('should emit the LevelUp event if levelUp is called', async () => {
            await expect(cut.connect(operator).levelUp(1, EXPECTED_LEVEL))
                .to.emit(cut, 'LevelUp')
                .withArgs(1, EXPECTED_LEVEL);
        });

        it('should revert if trying to call not by operator', async () => {
            await expect(cut.connect(tokenOwner).levelUp(1, EXPECTED_LEVEL))
                .to.revertedWith(`AccessControl: account ${tokenOwner.address.toLowerCase()} is missing role ${ROLE_OPERATOR}`);
        });

        it('should revert if trying to decrease the level', async () => {
            await cut.connect(operator).levelUp(1, EXPECTED_LEVEL);

            await expect(cut.connect(operator).levelUp(1, EXPECTED_LEVEL - 1))
                .to.revertedWith("Weapon: cannot decrease level");
        });

        it('should revert if trying to exceed the weapon max level', async () => {
            await expect(cut.connect(operator).levelUp(1, MAX_LEVEL + 1))
                .to.revertedWith("Weapon: cannot exceed max level");
        });

        it('should revert if trying to level up the nonexistent token', async () => {
            await expect(cut.connect(operator).levelUp(2, EXPECTED_LEVEL))
                .to.revertedWith("Weapon: token with given ID does not exist");
        });
    });

    describe('Hitting enemies', () => {
        const ENEMIES_HIT = 100;

        it('should update the amount of hit enemies if called by operator', async () => {
            await cut.connect(operator).updateEnemiesHit(1, ENEMIES_HIT);

            expect(await cut.enemiesHit(1)).to.eq(ENEMIES_HIT);
        });

        it('should emit the NewEnemiesHit event', async () => {
            await expect(cut.connect(operator).updateEnemiesHit(1, ENEMIES_HIT))
                .to.emit(cut, 'NewEnemiesHit')
                .withArgs(1, ENEMIES_HIT);
        });

        it('should revert if trying to call not by operator', async () => {
            await expect(cut.connect(tokenOwner).updateEnemiesHit(1, ENEMIES_HIT))
                .to.revertedWith(`AccessControl: account ${tokenOwner.address.toLowerCase()} is missing role ${ROLE_OPERATOR}`);
        });

        it('should revert if trying to decrease the amount of hit enemies', async () => {
            await cut.connect(operator).updateEnemiesHit(1, ENEMIES_HIT);

            await expect(cut.connect(operator).updateEnemiesHit(1, ENEMIES_HIT - 1))
                .to.revertedWith('Weapon: cannot decrease the number of enemies hit');
        });

        it('should revert if trying to level up the nonexistent token', async () => {
            await expect(cut.connect(operator).levelUp(2, ENEMIES_HIT))
                .to.revertedWith("Weapon: token with given ID does not exist");
        });
    });

    describe('Updating the whole weapon', async () => {
        const NEW_LEVEL = 10;
        const NEW_ENEMIES_HIT = 100;

        it('should update all weapon mutable characteristics', async () => {
            await cut.connect(operator).update(1, {level: NEW_LEVEL, enemiesHit: NEW_ENEMIES_HIT});
            
            const [level, enemiesHit] = await Promise.all(
                [
                    cut.level(1),
                    cut.enemiesHit(1)
                ]
            );

            expect(level).to.eq(NEW_LEVEL);
            expect(enemiesHit).to.eq(NEW_ENEMIES_HIT);
        });

        it('should revert if caller has no "ROLE_OPERATOR" role', async () => {
            await expect(cut.connect(tokenOwner).update(1, {level: NEW_LEVEL, enemiesHit: NEW_ENEMIES_HIT}))
                .to.revertedWith(`AccessControl: account ${tokenOwner.address.toLowerCase()} is missing role ${ROLE_OPERATOR}`);
        });

        it('should revert if trying to decrease the enemies hit count', async () => {
            await cut.connect(operator).updateEnemiesHit(1, NEW_ENEMIES_HIT);

            await expect(cut.connect(operator).update(1, {level: NEW_LEVEL, enemiesHit: NEW_ENEMIES_HIT - 1}))
                .to.revertedWith("Weapon: cannot decrease the number of enemies hit");
        });

        it('should revert if trying to decrease the level', async () => {
            await cut.connect(operator).levelUp(1, NEW_LEVEL);

            await expect(cut.connect(operator).update(1, {level: NEW_LEVEL - 1, enemiesHit: NEW_ENEMIES_HIT}))
                .to.revertedWith("Weapon: cannot decrease level");
        });

        it('should revert if new level exceeds the max level', async () => {
            await expect(cut.connect(operator).update(1, {level: MAX_LEVEL + 1, enemiesHit: NEW_ENEMIES_HIT}))
                .to.revertedWith("Weapon: cannot exceed max level");
        });

        it('should revert if trying to update non-existent token', async () => {
            await expect(cut.connect(operator).update(2, {level: NEW_LEVEL, enemiesHit: NEW_ENEMIES_HIT}))
                .to.revertedWith("Weapon: token with given ID does not exist");
        });
    });

    describe('Immutable characteristics management', () => {
        const NEW_WEAPON_CLASS_NAME = "Second weapon";
        const NEW_MAX_LEVEL = MAX_LEVEL - 2;
        const NEW_RARITY = 3;
        const NEW_IMPROVEMENT_SLOTS = 2;

        const SECOND_WEAPON_CHARS = {name: NEW_WEAPON_CLASS_NAME, maxLevel: NEW_MAX_LEVEL, rarity: NEW_RARITY, improvementSlots: NEW_IMPROVEMENT_SLOTS};

        it('should allow to add type immutable characteristics to admin', async () => {
            await cut.addNewTokenType(2, SECOND_WEAPON_CHARS);

            const tokenTypeCharacteristics = await cut.tokenTypeImmutableCharacteristics(2);

            expect(tokenTypeCharacteristics["name"]).to.eq(NEW_WEAPON_CLASS_NAME);
            expect(tokenTypeCharacteristics["maxLevel"]).to.eq(NEW_MAX_LEVEL);
            expect(tokenTypeCharacteristics["rarity"]).to.eq(NEW_RARITY);
            expect(tokenTypeCharacteristics["improvementSlots"]).to.eq(NEW_IMPROVEMENT_SLOTS);
        });

        it('should revert if adding the characteristics to existent type', async () => {
            await expect(cut.addNewTokenType(1, SECOND_WEAPON_CHARS))
                .to.revertedWith("Weapon: token type is already initialized");
        });

        it('should revert if caller has no DEFAULT_ADMIN_ROLE role', async () => {
            await expect(cut.connect(operator).addNewTokenType(2, SECOND_WEAPON_CHARS))
                .to.revertedWith(`AccessControl: account ${operator.address.toLowerCase()} is missing role ${DEFAULT_ADMIN_ROLE}`);
        });
    })
});
