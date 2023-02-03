import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { Contract } from "ethers";
import { ethers, upgrades } from "hardhat";
import { expect } from "chai";

const ROLE_OPERATOR = '0xaa3edb77f7c8cc9e38e8afe78954f703aeeda7fffe014eeb6e56ea84e62f6da7';
const ROLE_MINTER = '0xaeaef46186eb59f884e36929b6d682a6ae35e1e43d8f05f058dcefb92b601461';
const DEFAULT_ADMIN_ROLE = '0x0000000000000000000000000000000000000000000000000000000000000000';

describe('Weapon', () => {
    let cut: Contract;
    
    let admin: SignerWithAddress;
    let operator: SignerWithAddress;
    let tokenOwner: SignerWithAddress;
    let minter: SignerWithAddress;

    const MAX_LEVEL = 40;
    const NAME = "Prime Games Weapon";
    const SYMBOL = "PGW";
    const METADATA_URI = "ipfs://123/";

    const TOKEN_TYPE_ID = 100;

    beforeEach(async () => {
        cut = await ethers.getContractFactory("Weapon")
            .then(factory => upgrades.deployProxy(factory, [NAME, SYMBOL, METADATA_URI], {initializer: "initialize"}));
        
        [ admin, operator, tokenOwner, minter ] = await ethers.getSigners();

        await cut.addNewTokenType(TOKEN_TYPE_ID, {name: "First weapon", maxLevel: MAX_LEVEL, rarity: 0, improvementSlots: 1, issueDate: +new Date()});
        await cut.grantRole(ROLE_MINTER, minter.address);

        await Promise.all(
            [
                cut.connect(admin).grantRole(ROLE_OPERATOR, operator.address), 
                cut.connect(minter).safeMint(tokenOwner.address, TOKEN_TYPE_ID)
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
        expect(`${METADATA_URI}${TOKEN_TYPE_ID}.json`).to.eq(await cut.tokenURI(1));
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
                .to.revertedWith("ERC721: invalid token ID");
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
                .to.revertedWith("ERC721: invalid token ID");
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
                .to.revertedWith("ERC721: invalid token ID");
        });
    });

    describe('Immutable characteristics management', () => {
        const NEW_WEAPON_CLASS_NAME = "Second weapon";
        const NEW_MAX_LEVEL = MAX_LEVEL - 2;
        const NEW_RARITY = 3;
        const NEW_IMPROVEMENT_SLOTS = 2;
        const ISSUE_DATE = +new Date();

        const SECOND_WEAPON_CHARS = {name: NEW_WEAPON_CLASS_NAME, maxLevel: NEW_MAX_LEVEL, rarity: NEW_RARITY,
            improvementSlots: NEW_IMPROVEMENT_SLOTS, issueDate: ISSUE_DATE};

        it('should allow to add type immutable characteristics to admin', async () => {
            await cut.addNewTokenType(2, SECOND_WEAPON_CHARS);

            const tokenTypeCharacteristics = await cut.tokenTypeImmutableCharacteristics(2);

            expect(tokenTypeCharacteristics["name"]).to.eq(NEW_WEAPON_CLASS_NAME);
            expect(tokenTypeCharacteristics["maxLevel"]).to.eq(NEW_MAX_LEVEL);
            expect(tokenTypeCharacteristics["rarity"]).to.eq(NEW_RARITY);
            expect(tokenTypeCharacteristics["improvementSlots"]).to.eq(NEW_IMPROVEMENT_SLOTS);
        });

        it('should revert if adding the characteristics to existent type', async () => {
            await expect(cut.addNewTokenType(100, SECOND_WEAPON_CHARS))
                .to.revertedWith("Weapon: token type is already initialized");
        });

        it('should revert if caller has no DEFAULT_ADMIN_ROLE role', async () => {
            await expect(cut.connect(operator).addNewTokenType(2, SECOND_WEAPON_CHARS))
                .to.revertedWith(`AccessControl: account ${operator.address.toLowerCase()} is missing role ${DEFAULT_ADMIN_ROLE}`);
        });
    });

    describe('Metadata URI changing', () => {
        const NEW_BASE_URI = "ipfs://1234567/";

        it('should change base URI if called by admin', async () => {
            await cut.setBaseURI(NEW_BASE_URI);

            expect(`${NEW_BASE_URI}${TOKEN_TYPE_ID}.json`).to.eq(await cut.tokenURI(1));
        });

        it('should revert if called not by admin', async () => {
            await expect(cut.connect(tokenOwner).setBaseURI(NEW_BASE_URI)).to
                .revertedWith(`AccessControl: account ${tokenOwner.address.toLowerCase()} is missing role ${DEFAULT_ADMIN_ROLE}`)
        });
    });

    describe('Minting', () => {
        it('should mint if caller has ROLE_MINTER', async () => {
            const oldBalance = await cut.balanceOf(tokenOwner.getAddress());

            await cut.connect(minter).safeMint(tokenOwner.address, 3);

            const balanceDiff = (await cut.balanceOf(tokenOwner.getAddress())).sub(oldBalance);
            expect(balanceDiff).to.be.equal(1);
        });

        it('should revert if caller does not have ROLE_MINTER', async () => {
            await expect(cut.safeMint(tokenOwner.address, 3))
                .to.be.revertedWith(`AccessControl: account ${admin.address.toLowerCase()} is missing role ${ROLE_MINTER}`);
        });
    });

    describe('Multicall', () => {
        const ABI = [ "function levelUp(uint256,uint8)", "function updateEnemiesHit(uint256,uint248)", "function safeMint(address,uint16)" ];
        const iface = new ethers.utils.Interface(ABI);

        it('should group multiple calls into one transaction', async () => {
            const newLevel = 10;
            const newEnemiesHit = 100;

            const calls = [
                iface.encodeFunctionData("levelUp", [1, newLevel]),
                iface.encodeFunctionData("updateEnemiesHit", [1, newEnemiesHit - 9]),
                iface.encodeFunctionData("updateEnemiesHit", [1, newEnemiesHit - 8]),
                iface.encodeFunctionData("updateEnemiesHit", [1, newEnemiesHit - 7]),
                iface.encodeFunctionData("updateEnemiesHit", [1, newEnemiesHit - 6]),
                iface.encodeFunctionData("updateEnemiesHit", [1, newEnemiesHit - 5]),
                iface.encodeFunctionData("updateEnemiesHit", [1, newEnemiesHit - 4]),
                iface.encodeFunctionData("updateEnemiesHit", [1, newEnemiesHit - 3]),
                iface.encodeFunctionData("updateEnemiesHit", [1, newEnemiesHit - 2]),
                iface.encodeFunctionData("updateEnemiesHit", [1, newEnemiesHit - 1]),
                iface.encodeFunctionData("updateEnemiesHit", [1, newEnemiesHit])
            ];

            await cut.connect(operator).multicall(calls);

            expect(await cut.level(1)).to.eq(newLevel);
            expect(await cut.enemiesHit(1)).to.eq(newEnemiesHit);
        });

        it('should revert if no calls are passed', async () => {
            await expect(cut.multicall([])).to.be.revertedWith("Card: empty calls");
        });

        it('should revert if a single call reverts', async () => {
            const calls = [
                iface.encodeFunctionData("levelUp", [1, 10]),
                iface.encodeFunctionData("safeMint", [tokenOwner.address, 1])
            ];

            await expect(cut.connect(operator).multicall(calls)).to
                .be.revertedWith(`AccessControl: account ${operator.address.toLowerCase()} is missing role ${ROLE_MINTER}`);
        });
    });
});
