// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.17;

import { Card } from "./Card.sol";
import { AccessControlUpgradeable } from "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";

contract Weapon is Card {

    struct WeaponImmutableParameters {
        string name;
        uint240 improvementSlots;
        uint8 maxLevel;
        Rarity rarity;
    }

    struct WeaponMutableParameters {
        uint248 enemiesHit;
        uint8 level;
    }

    mapping (uint16 => WeaponImmutableParameters) private _immutableParameters;
    mapping (uint256 => WeaponMutableParameters) private _mutableParameters;

    event LevelUp(uint256 tokenId, uint8 newLevel);
    event NewEnemiesHit(uint256 tokenId, uint248 newEnemiesHit);

    function level(uint256 tokenId) public view returns (uint8) {
        require(_mutableParameters[tokenId].level > 0, "Weapon: token with given ID does not exist");
        return _mutableParameters[tokenId].level;
    }

    function enemiesHit(uint256 tokenId) public view returns (uint248) {
        require(_mutableParameters[tokenId].level > 0, "Weapon: token with given ID does not exist");
        return _mutableParameters[tokenId].enemiesHit;
    }

    function levelUp(uint256 tokenId, uint8 newLevel) public onlyRole(ROLE_OPERATOR) {
        require(_mutableParameters[tokenId].level > 0, "Weapon: token with given ID does not exist");

        WeaponMutableParameters storage params = _mutableParameters[tokenId];

        uint16 tokenType = _tokenIdToType[tokenId];

        require(params.level < newLevel, "Weapon: cannot decrease level");
        require(newLevel < _immutableParameters[tokenType].maxLevel, "Weapon: cannot exceed max level");
    
        params.level = newLevel;
        emit LevelUp(tokenId, newLevel);
    }

    function updateEnemiesHit(uint256 tokenId, uint248 newEnemiesHit) public onlyRole(ROLE_OPERATOR) {
        require(_mutableParameters[tokenId].level > 0, "Weapon: token with given ID does not exist");

        WeaponMutableParameters storage params = _mutableParameters[tokenId];
        require(params.enemiesHit < newEnemiesHit, "Weapon: cannot decrease the number of enemies hit");

        params.enemiesHit = newEnemiesHit;

        emit NewEnemiesHit(tokenId, newEnemiesHit);
    }

    function update(uint256 tokenId, WeaponMutableParameters calldata parameters) public onlyRole(ROLE_OPERATOR) {
        require(_mutableParameters[tokenId].level > 0, "Weapon: token with given ID does not exist");

        WeaponMutableParameters storage params = _mutableParameters[tokenId];
        uint16 tokenType = _tokenIdToType[tokenId];
        
        require(params.level < parameters.level, "Weapon: cannot decrease level");
        require(parameters.level < _immutableParameters[tokenType].maxLevel, "Weapon: cannot exceed max level");
        require(params.enemiesHit < parameters.enemiesHit, "Weapon: cannot decrease the number of enemies hit");

        params.level = parameters.level;
        params.enemiesHit = parameters.enemiesHit;
    }

    function addNewTokenType(uint16 typeId, WeaponImmutableParameters calldata typeParams) public onlyRole(DEFAULT_ADMIN_ROLE) {
        WeaponImmutableParameters storage params = _immutableParameters[typeId];

        params.name = typeParams.name;
        params.maxLevel = typeParams.maxLevel;
        params.rarity = typeParams.rarity;
        params.improvementSlots = typeParams.improvementSlots;
    }

    function _doSafeMint(uint256 tokenId) internal virtual override {
        WeaponMutableParameters storage params = _mutableParameters[tokenId];

        params.enemiesHit = 0;
        params.level = 1;
    }


    uint256[40] private __gap;
}
