// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.17;

import { Card } from "./Card.sol";
import { AccessControlUpgradeable } from "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";

contract Weapon is Card {

    struct WeaponMutableParameters {
        uint248 enemiesHit;
        uint8 level;
    }

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

        require(params.level < newLevel, "Weapon: cannot decrease level");
        // TODO Check if max level exceeded
    
        params.level = newLevel;
        emit LevelUp(tokenId, newLevel);
    }

    function upgradeEnemiesHit(uint256 tokenId, uint248 newEnemiesHit) public onlyRole(ROLE_OPERATOR) {
        require(_mutableParameters[tokenId].level > 0, "Weapon: token with given ID does not exist");

        WeaponMutableParameters storage params = _mutableParameters[tokenId];
        require(params.enemiesHit < newEnemiesHit, "Weapon: cannot decrease the number of enemies hit");

        params.enemiesHit = newEnemiesHit;

        emit NewEnemiesHit(tokenId, newEnemiesHit);
    }

    function _doSafeMint(uint256 tokenId) internal virtual override {
        WeaponMutableParameters storage params = _mutableParameters[tokenId];

        params.enemiesHit = 0;
        params.level = 1;
    }
}
