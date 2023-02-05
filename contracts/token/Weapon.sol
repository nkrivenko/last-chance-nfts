// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.17;

import { Card } from "./Card.sol";
import { AccessControlUpgradeable } from "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";

contract Weapon is Card {

    struct WeaponImmutableParameters {
        string name;
        uint240 issueDate;
        uint8 improvementSlots;
        uint8 maxLevel;
        Rarity rarity;
    }

    struct WeaponMutableParameters {
        uint248 enemiesHit;
        uint8 level;
    }

    mapping (uint16 => WeaponImmutableParameters) private _immutableParameters;
    mapping (uint256 => WeaponMutableParameters) private _mutableParameters;

    event NewEnemiesHit(uint256 tokenId, uint248 newEnemiesHit);

    function initialize(string calldata name, string calldata symbol, string calldata metadataURI) public initializer {
        __Card_init(name, symbol, metadataURI);
    }

    function level(uint256 tokenId) public view tokenExists(tokenId) returns (uint8) {
        return _mutableParameters[tokenId].level;
    }

    function enemiesHit(uint256 tokenId) public view tokenExists(tokenId) returns (uint248) {
        require(_mutableParameters[tokenId].level > 0, "Weapon: token with given ID does not exist");
        return _mutableParameters[tokenId].enemiesHit;
    }

    function levelUp(uint256 tokenId, uint8 newLevel) public onlyRole(ROLE_OPERATOR) tokenExists(tokenId) {
        WeaponMutableParameters storage params = _mutableParameters[tokenId];

        uint16 passedTokenType = _tokenIdToType[tokenId];

        require(params.level < newLevel, "Weapon: cannot decrease level");
        require(newLevel < _immutableParameters[passedTokenType].maxLevel, "Weapon: cannot exceed max level");
    
        params.level = newLevel;
        emit LevelUp(tokenId, newLevel);
    }

    function updateEnemiesHit(uint256 tokenId, uint248 newEnemiesHit) public onlyRole(ROLE_OPERATOR) tokenExists(tokenId) {
        WeaponMutableParameters storage params = _mutableParameters[tokenId];
        require(params.enemiesHit < newEnemiesHit, "Weapon: cannot decrease the number of enemies hit");

        params.enemiesHit = newEnemiesHit;

        emit NewEnemiesHit(tokenId, newEnemiesHit);
    }

    function update(uint256 tokenId, WeaponMutableParameters calldata parameters) public onlyRole(ROLE_OPERATOR) tokenExists(tokenId) {
        WeaponMutableParameters storage params = _mutableParameters[tokenId];
        uint16 passedTokenType = _tokenIdToType[tokenId];
        
        require(params.level < parameters.level, "Weapon: cannot decrease level");
        require(parameters.level < _immutableParameters[passedTokenType].maxLevel, "Weapon: cannot exceed max level");
        require(params.enemiesHit < parameters.enemiesHit, "Weapon: cannot decrease the number of enemies hit");

        params.level = parameters.level;
        params.enemiesHit = parameters.enemiesHit;
    }

    function addNewTokenType(uint16 typeId, WeaponImmutableParameters calldata typeParams) public onlyRole(DEFAULT_ADMIN_ROLE) {
        WeaponImmutableParameters storage params = _immutableParameters[typeId];
        require(params.issueDate == 0, "Weapon: token type is already initialized");

        require(typeParams.maxLevel > 0, "Weapon: maxLevel should be positive");

        params.name = typeParams.name;
        params.maxLevel = typeParams.maxLevel;
        params.rarity = typeParams.rarity;
        params.improvementSlots = typeParams.improvementSlots;
        params.issueDate = typeParams.issueDate;
    }

    function updateTokenType(uint16 typeId, WeaponImmutableParameters calldata typeParams) public onlyRole(DEFAULT_ADMIN_ROLE) {
        WeaponImmutableParameters storage params = _immutableParameters[typeId];
        require(params.issueDate > 0, "Weapon: token type is not initialized");

        require(typeParams.maxLevel > 0, "Weapon: maxLevel should be positive");

        params.name = typeParams.name;
        params.maxLevel = typeParams.maxLevel;
        params.rarity = typeParams.rarity;
        params.improvementSlots = typeParams.improvementSlots;
        params.issueDate = typeParams.issueDate;
    }

    function tokenTypeImmutableCharacteristics(uint16 typeId) public view returns (WeaponImmutableParameters memory) {
        return _immutableParameters[typeId];
    }

    function getWeapon(uint256 tokenId) public view tokenExists(tokenId) returns (WeaponMutableParameters memory) {
        return _mutableParameters[tokenId];
    }

    function _doSafeMint(uint256 tokenId) internal virtual override {
        WeaponMutableParameters storage params = _mutableParameters[tokenId];

        params.enemiesHit = 0;
        params.level = 1;
    }


    uint256[40] private __gap;
}
