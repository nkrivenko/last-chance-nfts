import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { Contract } from "ethers";
import { ethers, upgrades } from "hardhat";
import { expect } from "chai";

const ROLE_OPERATOR = '0xaa3edb77f7c8cc9e38e8afe78954f703aeeda7fffe014eeb6e56ea84e62f6da7';
const DEFAULT_ADMIN_ROLE = '0x0000000000000000000000000000000000000000000000000000000000000000';

describe('Character', () => {
    let cut: Contract;
    
    let admin: SignerWithAddress;
    let operator: SignerWithAddress;
    let tokenOwner: SignerWithAddress;

    const MAX_LEVEL = 40;
    const NAME = "Prime Games Character";
    const SYMBOL = "PGC"

    beforeEach(async () => {
        cut = await ethers.getContractFactory("Character")
            .then(factory => upgrades.deployProxy(factory, [NAME, SYMBOL], {initializer: "initialize"}));
        
        [ admin, operator, tokenOwner ] = await ethers.getSigners();

        await cut.addNewTokenType(1, {name: "Sir Mullich", maxLevel: MAX_LEVEL, rarity: 0, activeSkill1: 'Speed +2', activeSkill2: 'Leadership', issueDate: +new Date()});

        await Promise.all(
            [
                cut.connect(admin).grantRole(ROLE_OPERATOR, operator.address), 
                cut.safeMint(tokenOwner.address, 1)
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
            await expect(cut.addNewTokenType(1, SECOND_CHARACTER_CHARS))
                .to.revertedWith("Character: token type is already initialized");
        });

        it('should revert if caller has no DEFAULT_ADMIN_ROLE role', async () => {
            await expect(cut.connect(operator).addNewTokenType(2, SECOND_CHARACTER_CHARS))
                .to.revertedWith(`AccessControl: account ${operator.address.toLowerCase()} is missing role ${DEFAULT_ADMIN_ROLE}`);
        });
    })
});
