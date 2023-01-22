// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.17;

import { AccessControlUpgradeable } from "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";
import { ERC721EnumerableUpgradeable } from "@openzeppelin/contracts-upgradeable/token/ERC721/extensions/ERC721EnumerableUpgradeable.sol";
import { CountersUpgradeable } from "@openzeppelin/contracts-upgradeable/utils/CountersUpgradeable.sol";

import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";

abstract contract Card is Initializable, AccessControlUpgradeable, ERC721EnumerableUpgradeable, UUPSUpgradeable {

    using CountersUpgradeable for CountersUpgradeable.Counter;

    CountersUpgradeable.Counter private _tokenIdCounter;

    enum Rarity { COMMON, UNCOMMON, RARE, LEGENDARY, EPIC }

    bytes32 internal constant ROLE_OPERATOR = keccak256("ROLE_OPERATOR");
    bytes32 internal constant ROLE_UPGRADER = keccak256("ROLE_UPGRADER");

    mapping(uint256 => uint16) internal _tokenIdToType;

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    function initialize() public initializer {
        __ERC721_init("MyToken", "MTK");
        __AccessControl_init();
        __ERC721Enumerable_init();
        __UUPSUpgradeable_init();

        __Card_init();
    }

    // solhint-disable-next-line func-name-mixedcase
    function __Card_init() internal onlyInitializing {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(ROLE_UPGRADER, msg.sender);
    }

    function _authorizeUpgrade(address newImplementation)
        internal
        onlyRole(ROLE_UPGRADER)
        override 
    {
        // solhint-disable-previous-line no-empty-blocks
    }

    // The following functions are overrides required by Solidity.

    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(ERC721EnumerableUpgradeable, AccessControlUpgradeable)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }

    function safeMint(address to, uint16 tokenType) public {
        _tokenIdCounter.increment();
        uint256 id = _tokenIdCounter.current();
        _safeMint(to, id);

        _tokenIdToType[id] = tokenType;

        _doSafeMint(id);
    }

    function _doSafeMint(uint256 tokenId) internal virtual;

    /**
     * @dev This empty reserved space is put in place to allow future versions to add new
     * variables without shifting down storage in the inheritance chain.
     * See https://docs.openzeppelin.com/contracts/4.x/upgradeable#storage_gaps
     */
    uint256[48] private __gap;
}
