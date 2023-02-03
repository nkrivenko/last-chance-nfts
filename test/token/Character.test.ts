import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { Contract } from "ethers";
import { ethers, upgrades } from "hardhat";
import { expect } from "chai";

const ROLE_OPERATOR = '0xaa3edb77f7c8cc9e38e8afe78954f703aeeda7fffe014eeb6e56ea84e62f6da7';
const DEFAULT_ADMIN_ROLE = '0x0000000000000000000000000000000000000000000000000000000000000000';
const ROLE_MINTER = '0xaeaef46186eb59f884e36929b6d682a6ae35e1e43d8f05f058dcefb92b601461';

describe('Character', () => {
    let cut: Contract;
    
    let admin: SignerWithAddress;
    let operator: SignerWithAddress;
    let tokenOwner: SignerWithAddress;
    let minter: SignerWithAddress;

    const MAX_LEVEL = 40;
    const NAME = "Prime Games Character";
    const SYMBOL = "PGC"
    const METADATA_URI = "ipfs://123/";
    const TOKEN_TYPE_ID = 100;

    beforeEach(async () => {
        cut = await ethers.getContractFactory("Character")
            .then(factory => upgrades.deployProxy(factory, [NAME, SYMBOL, METADATA_URI], {initializer: "initialize"}));
        
        [ admin, operator, tokenOwner, minter ] = await ethers.getSigners();

        await cut.addNewTokenType(TOKEN_TYPE_ID, {name: "Sir Mullich", maxLevel: MAX_LEVEL, rarity: 0, activeSkill1: 'Speed +2', activeSkill2: 'Leadership', issueDate: +new Date()});
        await cut.grantRole(ROLE_MINTER, minter.address);

        await Promise.all(
            [
                cut.connect(admin).grantRole(ROLE_OPERATOR, operator.address), 
                cut.connect(minter).safeMint(tokenOwner.address, TOKEN_TYPE_ID)
            ]
        )
    });

    it('should create a contract with correct parameters', async () => {
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
        it('should create the character with correct parameters', async () => {
            const [level, gamesPlayed] = await Promise.all(
                [
                    cut.level(1),
                    cut.gamesPlayed(1)
                ]
            );

            expect(1).to.eq(level);
            expect(0).to.eq(gamesPlayed);
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
                .to.revertedWith("Character: cannot decrease level");
        });

        it('should revert if trying to exceed the character max level', async () => {
            await expect(cut.connect(operator).levelUp(1, MAX_LEVEL + 1))
                .to.revertedWith("Character: cannot exceed max level");
        });

        it('should revert if trying to level up the nonexistent token', async () => {
            await expect(cut.connect(operator).levelUp(2, EXPECTED_LEVEL))
                .to.revertedWith("ERC721: invalid token ID");
        });
    });

    describe('Playing games', () => {
        const GAMES_PLAYED = 100;

        it('should update the amount of hit enemies if called by operator', async () => {
            await cut.connect(operator).updateGamesPlayed(1, GAMES_PLAYED);

            expect(await cut.gamesPlayed(1)).to.eq(GAMES_PLAYED);
        });

        it('should emit the NewGamesPlayed event', async () => {
            await expect(cut.connect(operator).updateGamesPlayed(1, GAMES_PLAYED))
                .to.emit(cut, 'NewGamesPlayed')
                .withArgs(1, GAMES_PLAYED);
        });

        it('should revert if trying to call not by operator', async () => {
            await expect(cut.connect(tokenOwner).updateGamesPlayed(1, GAMES_PLAYED))
                .to.revertedWith(`AccessControl: account ${tokenOwner.address.toLowerCase()} is missing role ${ROLE_OPERATOR}`);
        });

        it('should revert if trying to decrease the amount of games played', async () => {
            await cut.connect(operator).updateGamesPlayed(1, GAMES_PLAYED);

            await expect(cut.connect(operator).updateGamesPlayed(1, GAMES_PLAYED - 1))
                .to.revertedWith('Character: cannot decrease the number of games played');
        });

        it('should revert if trying to level up the nonexistent token', async () => {
            await expect(cut.connect(operator).levelUp(2, GAMES_PLAYED))
                .to.revertedWith("ERC721: invalid token ID");
        });
    });

    describe('Updating the whole character', async () => {
        const NEW_LEVEL = 10;
        const NEW_GAMES_PLAYED = 100;

        it('should update all character mutable characteristics', async () => {
            await cut.connect(operator).update(1, {level: NEW_LEVEL, gamesPlayed: NEW_GAMES_PLAYED});
            
            const [level, gamesPlayed] = await Promise.all(
                [
                    cut.level(1),
                    cut.gamesPlayed(1)
                ]
            );

            expect(level).to.eq(NEW_LEVEL);
            expect(gamesPlayed).to.eq(NEW_GAMES_PLAYED);
        });

        it('should revert if caller has no "ROLE_OPERATOR" role', async () => {
            await expect(cut.connect(tokenOwner).update(1, {level: NEW_LEVEL, gamesPlayed: NEW_GAMES_PLAYED}))
                .to.revertedWith(`AccessControl: account ${tokenOwner.address.toLowerCase()} is missing role ${ROLE_OPERATOR}`);
        });

        it('should revert if trying to decrease the games played count', async () => {
            await cut.connect(operator).updateGamesPlayed(1, NEW_GAMES_PLAYED);

            await expect(cut.connect(operator).update(1, {level: NEW_LEVEL, gamesPlayed: NEW_GAMES_PLAYED - 1}))
                .to.revertedWith("Character: cannot decrease the number of games played");
        });

        it('should revert if trying to decrease the level', async () => {
            await cut.connect(operator).levelUp(1, NEW_LEVEL);

            await expect(cut.connect(operator).update(1, {level: NEW_LEVEL - 1, gamesPlayed: NEW_GAMES_PLAYED}))
                .to.revertedWith("Character: cannot decrease level");
        });

        it('should revert if new level exceeds the max level', async () => {
            await expect(cut.connect(operator).update(1, {level: MAX_LEVEL + 1, gamesPlayed: NEW_GAMES_PLAYED}))
                .to.revertedWith("Character: cannot exceed max level");
        });

        it('should revert if trying to update non-existent token', async () => {
            await expect(cut.connect(operator).update(2, {level: NEW_LEVEL, gamesPlayed: NEW_GAMES_PLAYED}))
                .to.revertedWith("ERC721: invalid token ID");
        });
    });

    describe('Immutable characteristics management', () => {
        const NEW_CHARACTER_CLASS_NAME = "Gelu";
        const NEW_MAX_LEVEL = MAX_LEVEL - 2;
        const NEW_RARITY = 3;
        const NEW_ACTIVE_SKILL_1 = 'Sharpshooters';
        const NEW_ACTIVE_SKILL_2 = 'Luck';
        const ISSUE_DATE = +new Date();

        const SECOND_CHARACTER_CHARS = {name: NEW_CHARACTER_CLASS_NAME, maxLevel: NEW_MAX_LEVEL, rarity: NEW_RARITY,
            activeSkill1: NEW_ACTIVE_SKILL_1, activeSkill2: NEW_ACTIVE_SKILL_2, issueDate: ISSUE_DATE};

        it('should allow to add type immutable characteristics to admin', async () => {
            await cut.addNewTokenType(2, SECOND_CHARACTER_CHARS);

            const tokenTypeCharacteristics = await cut.tokenTypeImmutableCharacteristics(2);

            expect(tokenTypeCharacteristics["name"]).to.eq(NEW_CHARACTER_CLASS_NAME);
            expect(tokenTypeCharacteristics["issueDate"]).to.eq(ISSUE_DATE);
            expect(tokenTypeCharacteristics["maxLevel"]).to.eq(NEW_MAX_LEVEL);
            expect(tokenTypeCharacteristics["rarity"]).to.eq(NEW_RARITY);
            expect(tokenTypeCharacteristics["activeSkill1"]).to.eq(NEW_ACTIVE_SKILL_1);
            expect(tokenTypeCharacteristics["activeSkill2"]).to.eq(NEW_ACTIVE_SKILL_2);
        });

        it('should revert if adding the characteristics to existent type', async () => {
            await expect(cut.addNewTokenType(TOKEN_TYPE_ID, SECOND_CHARACTER_CHARS))
                .to.revertedWith("Character: token type is already initialized");
        });

        it('should revert if caller has no DEFAULT_ADMIN_ROLE role', async () => {
            await expect(cut.connect(operator).addNewTokenType(2, SECOND_CHARACTER_CHARS))
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

        const ABI = [ "function levelUp(uint256,uint8)", "function updateGamesPlayed(uint256,uint248)", "function safeMint(address,uint16)" ];
        const iface = new ethers.utils.Interface(ABI)

        it('should group multiple calls into one transaction', async () => {
            const newLevel = 10;
            const newGamesPlayed = 100;

            const calls = [
                iface.encodeFunctionData("levelUp", [1, newLevel]),
                iface.encodeFunctionData("updateGamesPlayed", [1, newGamesPlayed]),
            ];

            await cut.connect(operator).multicall(calls);

            expect(await cut.level(1)).to.eq(newLevel);
            expect(await cut.gamesPlayed(1)).to.eq(newGamesPlayed);
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
