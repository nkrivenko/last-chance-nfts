// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.17;

import { AccessControlUpgradeable } from "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";
import { ERC721EnumerableUpgradeable } from "@openzeppelin/contracts-upgradeable/token/ERC721/extensions/ERC721EnumerableUpgradeable.sol";
import { ERC721BurnableUpgradeable, ERC721Upgradeable } from "@openzeppelin/contracts-upgradeable/token/ERC721/extensions/ERC721BurnableUpgradeable.sol";
import { PausableUpgradeable } from "@openzeppelin/contracts-upgradeable/security/PausableUpgradeable.sol";
import { CountersUpgradeable } from "@openzeppelin/contracts-upgradeable/utils/CountersUpgradeable.sol";
import { StringsUpgradeable } from "@openzeppelin/contracts-upgradeable/utils/StringsUpgradeable.sol";

import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";

abstract contract Card is Initializable, AccessControlUpgradeable, ERC721EnumerableUpgradeable, ERC721BurnableUpgradeable, PausableUpgradeable, UUPSUpgradeable {

    using StringsUpgradeable for uint16;
    using CountersUpgradeable for CountersUpgradeable.Counter;

    CountersUpgradeable.Counter private _tokenIdCounter;

    enum Rarity { COMMON, UNCOMMON, RARE, EPIC, LEGENDARY }

    bytes32 internal constant ROLE_OPERATOR = keccak256("ROLE_OPERATOR");
    bytes32 internal constant ROLE_UPGRADER = keccak256("ROLE_UPGRADER");
    bytes32 internal constant ROLE_MINTER = keccak256("ROLE_MINTER");
    bytes32 internal constant ROLE_PAUSER = keccak256("ROLE_PAUSER");

    mapping(uint256 => uint16) internal _tokenIdToType;

    string private _metadataURI;

    event LevelUp(uint256 tokenId, uint8 newLevel);

    modifier tokenExists(uint256 tokenId) {
        _requireMinted(tokenId);
        _;
    }

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    // solhint-disable-next-line func-name-mixedcase
    function __Card_init(string calldata name_, string calldata symbol_, string calldata metadataURI_) internal onlyInitializing {
        __ERC721_init_unchained(name_, symbol_);
        __Pausable_init_unchained();
        __ERC721Enumerable_init_unchained();
        __ERC721Burnable_init_unchained();
        __AccessControl_init_unchained();
        __UUPSUpgradeable_init_unchained();

        __Card_init_unchained(metadataURI_);
    }

    function multicall(bytes[] calldata data) external virtual returns (bytes[] memory results) {
        require(data.length > 0, "Card: empty calls");

        results = new bytes[](data.length);
        for (uint256 i = 0; i < data.length; i++) {
            results[i] = _funcDelegateCall(address(this), data[i]);
        }
        return results;
    }

    function tokenURI(uint256 tokenId) public view virtual override returns (string memory) {
        _requireMinted(tokenId);

        uint16 tokenIdType = _tokenIdToType[tokenId];
        string memory baseURI = _baseURI();
        return bytes(baseURI).length > 0 ? string(abi.encodePacked(baseURI, tokenIdType.toString(), ".json")) : "";
    }

    function tokenType(uint256 tokenId) public view returns (uint16) {
        return _tokenIdToType[tokenId];
    }

    function setBaseURI(string calldata newBaseURI) public onlyRole(DEFAULT_ADMIN_ROLE) {
        _metadataURI = newBaseURI;
    }

    function pause() public onlyRole(ROLE_PAUSER) {
        _pause();
    }

    function unpause() public onlyRole(ROLE_PAUSER) {
        _unpause();
    }

    function safeMint(address to, uint16 cardType) public onlyRole(ROLE_MINTER) {
        _tokenIdCounter.increment();
        uint256 id = _tokenIdCounter.current();
        _safeMint(to, id);

        _tokenIdToType[id] = cardType;

        _doSafeMint(id);
    }

    /**
     * @dev See {IERC721-approve}.
     */
    function _baseURI() internal view virtual override returns (string memory) {
        return _metadataURI;
    }

    // solhint-disable-next-line func-name-mixedcase
    function __Card_init_unchained(string calldata metadataURI_) internal onlyInitializing {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(ROLE_UPGRADER, msg.sender);

        _metadataURI = metadataURI_;
    }

    function _authorizeUpgrade(address newImplementation)
        internal
        onlyRole(ROLE_UPGRADER)
        override 
    {
        // solhint-disable-previous-line no-empty-blocks
    }
    function _funcDelegateCall(address target, bytes memory data) private returns (bytes memory) {
        require(AddressUpgradeable.isContract(target), "Address: delegate call to non-contract");

        // solhint-disable-next-line avoid-low-level-calls
        (bool success, bytes memory returndata) = target.delegatecall(data);
        return AddressUpgradeable.verifyCallResult(success, returndata, "Address: low-level delegate call failed");
    }

    // The following functions are overrides required by Solidity.

    function _beforeTokenTransfer(address from, address to, uint256 tokenId, uint256 batchSize)
        internal
        whenNotPaused
        override(ERC721Upgradeable, ERC721EnumerableUpgradeable)
    {
        super._beforeTokenTransfer(from, to, tokenId, batchSize);
    }

    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(ERC721EnumerableUpgradeable, ERC721Upgradeable, AccessControlUpgradeable)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }

    function _doSafeMint(uint256 tokenId) internal virtual;

    /**
     * @dev This empty reserved space is put in place to allow future versions to add new
     * variables without shifting down storage in the inheritance chain.
     * See https://docs.openzeppelin.com/contracts/4.x/upgradeable#storage_gaps
     */
    uint256[48] private __gap;
}
