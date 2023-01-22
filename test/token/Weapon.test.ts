import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { Contract } from "ethers";
import { ethers, upgrades } from "hardhat";
import { fail } from "assert";
import { expect } from "chai";

const ROLE_OPERATOR = '0xaa3edb77f7c8cc9e38e8afe78954f703aeeda7fffe014eeb6e56ea84e62f6da7';

describe('Weapon', () => {
    let cut: Contract;
    
    let admin: SignerWithAddress;
    let operator: SignerWithAddress;
    let tokenOwner: SignerWithAddress;

    beforeEach(async () => {
        cut = await ethers.getContractFactory("Weapon")
            .then(factory => upgrades.deployProxy(factory, [], {initializer: "initialize"}));
        
        [ admin, operator, tokenOwner ] = await ethers.getSigners();

        await Promise.all(
            [
                cut.connect(admin).grantRole(ROLE_OPERATOR, operator.address), 
                cut.safeMint(tokenOwner.address)
            ]
        )
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
        const MAX_LEVEL = 40;

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

        xit('should revert if trying to exceed the weapon max level', async () => {
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

        const MAX_LEVEL = 40;

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

        xit('should revert if new level exceeds the max level', async () => {
            fail('Not implemented yet');
        });

        it('should revert if trying to update non-existent token', async () => {
            await expect(cut.connect(operator).update(2, {level: NEW_LEVEL, enemiesHit: NEW_ENEMIES_HIT}))
                .to.revertedWith("Weapon: token with given ID does not exist");
        });
    });
});
