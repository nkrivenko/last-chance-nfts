// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.17;

import { Card } from "./Card.sol";

contract Character is Card {

    struct CharacterImmutableParameters {
        uint240 issueDate;
        uint8 maxLevel;
        Rarity rarity;
        string name;
        string activeSkill1;
        string activeSkill2;
    }

    struct CharacterMutableParameters {
        uint248 gamesPlayed;
        uint8 level;
    }

    mapping (uint16 => CharacterImmutableParameters) private _immutableParameters;
    mapping (uint256 => CharacterMutableParameters) private _mutableParameters;

    event NewGamesPlayed(uint256 tokenId, uint248 newGamesPlayed);

    function initialize(string calldata name, string calldata symbol, string calldata metadataURI) public initializer {
        __Card_init(name, symbol, metadataURI);
    }

    function getCharacter(uint256 tokenId) public view returns (CharacterMutableParameters memory) {
        return _mutableParameters[tokenId];
    }

    function level(uint256 tokenId) public view tokenExists(tokenId) returns (uint8) {
        return _mutableParameters[tokenId].level;
    }

    function gamesPlayed(uint256 tokenId) public view tokenExists(tokenId) returns (uint248) {
        return _mutableParameters[tokenId].gamesPlayed;
    }

    function levelUp(uint256 tokenId, uint8 newLevel) public onlyRole(ROLE_OPERATOR) tokenExists(tokenId) {
        CharacterMutableParameters storage params = _mutableParameters[tokenId];

        uint16 tokenType = _tokenIdToType[tokenId];

        require(params.level < newLevel, "Character: cannot decrease level");
        require(newLevel < _immutableParameters[tokenType].maxLevel, "Character: cannot exceed max level");
    
        params.level = newLevel;
        emit LevelUp(tokenId, newLevel);
    }

    function updateGamesPlayed(uint256 tokenId, uint248 newGamesPlayed) public onlyRole(ROLE_OPERATOR) tokenExists(tokenId) {
        CharacterMutableParameters storage params = _mutableParameters[tokenId];
        require(params.gamesPlayed < newGamesPlayed, "Character: cannot decrease the number of games played");

        params.gamesPlayed = newGamesPlayed;

        emit NewGamesPlayed(tokenId, newGamesPlayed);
    }

    function update(uint256 tokenId, CharacterMutableParameters calldata parameters) public onlyRole(ROLE_OPERATOR) tokenExists(tokenId) {
        CharacterMutableParameters storage params = _mutableParameters[tokenId];
        uint16 tokenType = _tokenIdToType[tokenId];
        
        require(params.level < parameters.level, "Character: cannot decrease level");
        require(parameters.level < _immutableParameters[tokenType].maxLevel, "Character: cannot exceed max level");
        require(params.gamesPlayed < parameters.gamesPlayed, "Character: cannot decrease the number of games played");

        params.level = parameters.level;
        params.gamesPlayed = parameters.gamesPlayed;
    }

    function addNewTokenType(uint16 typeId, CharacterImmutableParameters calldata typeParams) public onlyRole(DEFAULT_ADMIN_ROLE) {
        CharacterImmutableParameters storage params = _immutableParameters[typeId];
        require(params.issueDate == 0, "Character: token type is already initialized");

        require(typeParams.maxLevel > 0, "Character: maxLevel should be positive");

        params.name = typeParams.name;
        params.maxLevel = typeParams.maxLevel;
        params.rarity = typeParams.rarity;
        params.activeSkill1 = typeParams.activeSkill1;
        params.activeSkill2 = typeParams.activeSkill2;
        params.issueDate = typeParams.issueDate;
    }

    function tokenTypeImmutableCharacteristics(uint16 typeId) public view returns (CharacterImmutableParameters memory) {
        return _immutableParameters[typeId];
    }

    function _doSafeMint(uint256 tokenId) internal virtual override {
        CharacterMutableParameters storage params = _mutableParameters[tokenId];

        params.gamesPlayed = 0;
        params.level = 1;
    }

    uint256[40] private __gap;
}
