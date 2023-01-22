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

        await cut.connect(admin).grantRole(ROLE_OPERATOR, operator.address);
    });

    it('should create the weapon with correct parameters', async () => {
        fail('Not implemented yet');
    });

    describe('Level up', () => {
        const EXPECTED_LEVEL = 5;
        const MAX_LEVEL = 40;

        beforeEach(async () => {
            await cut.safeMint(tokenOwner.address);
        });

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
    });

    describe('Hitting enemies', () => {
        const ENEMIES_HIT = 100;

        beforeEach(async () => {
            await cut.safeMint(tokenOwner.address);
        });

        it('should update the amount of hit enemies if called by operator', async () => {
            await cut.connect(operator).upgradeEnemiesHit(1, ENEMIES_HIT);

            expect(await cut.enemiesHit(1)).to.eq(ENEMIES_HIT);
        });

        it('should emit the NewEnemiesHit event', async () => {
            await expect(cut.connect(operator).upgradeEnemiesHit(1, ENEMIES_HIT))
                .to.emit(cut, 'NewEnemiesHit')
                .withArgs(1, ENEMIES_HIT);
        });

        it('should revert if trying to call not by operator', async () => {
            await expect(cut.connect(tokenOwner).upgradeEnemiesHit(1, ENEMIES_HIT))
                .to.revertedWith(`AccessControl: account ${tokenOwner.address.toLowerCase()} is missing role ${ROLE_OPERATOR}`);
        });

        it('should revert if trying to decrease the amount of hit enemies', async () => {
            await cut.connect(operator).upgradeEnemiesHit(1, ENEMIES_HIT);

            await expect(cut.connect(operator).upgradeEnemiesHit(1, ENEMIES_HIT - 1))
                .to.revertedWith('Weapon: cannot decrease the number of enemies hit');
        });
    });
});
