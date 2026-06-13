// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {LSP8IdentifiableDigitalAssetInitAbstract} from "@lukso/lsp-smart-contracts/contracts/LSP8IdentifiableDigitalAsset/LSP8IdentifiableDigitalAssetInitAbstract.sol";
import {_LSP8_TOKENID_FORMAT_NUMBER} from "@lukso/lsp-smart-contracts/contracts/LSP8IdentifiableDigitalAsset/LSP8Constants.sol";
import {_LSP4_TOKEN_TYPE_COLLECTION} from "@lukso/lsp-smart-contracts/contracts/LSP4DigitalAssetMetadata/LSP4Constants.sol";
import {PausableUpgradeable} from "@openzeppelin/contracts-upgradeable/security/PausableUpgradeable.sol";
import {ReentrancyGuardUpgradeable} from "@openzeppelin/contracts-upgradeable/security/ReentrancyGuardUpgradeable.sol";

import {FamilyTypes} from "./familyTypes.sol";
import {IFamilyNFT} from "./IFamilyNFT.sol";
import "./constants.sol";

/// @title FamilyNFT
/// @notice LSP8-based NFT contract representing members of a genealogy clan.
///         Deployed as a minimal proxy clone by the Genealogy registry.
///         Each person is a unique token. Token ID 1 (ANCESTOR_TOKEN_ID) is the
///         founding ancestor; its owner has admin rights over the entire clan.
contract FamilyNFT is
    IFamilyNFT,
    LSP8IdentifiableDigitalAssetInitAbstract,
    ReentrancyGuardUpgradeable,
    PausableUpgradeable
{
    /// @notice Total number of persons ever minted (monotonically increasing)
    uint256 public personCount;

    /// @dev Person data keyed by token ID
    mapping(bytes32 => FamilyTypes.Person) private persons;

    /// @dev Tracks whether a person token has been created
    mapping(bytes32 => bool) private _personExists;

    // Same-clan spouse tracking (O(1) bidirectional removal)
    mapping(bytes32 => mapping(bytes32 => uint256)) private _spouseIndex;
    mapping(bytes32 => mapping(bytes32 => bool))    private _isSpouse;

    // Cross-clan spouse tracking; key = keccak256(abi.encode(contractAddress, tokenId))
    mapping(bytes32 => mapping(bytes32 => uint256)) private _externalSpouseIndex;
    mapping(bytes32 => mapping(bytes32 => bool))    private _isExternalSpouse;

    // Children tracking (O(1) removal)
    mapping(bytes32 => mapping(bytes32 => uint256)) private _childIndex;
    mapping(bytes32 => mapping(bytes32 => bool))    private _isChild;

    // Tình huống 2: Nhập người từ gia phả khác
    // Non-zero contractAddress = person was imported from that clan
    mapping(bytes32 => FamilyTypes.ExternalRef) private _personOrigin;

    // Tình huống 3: Hai người ở hai gia phả khác nhau là cùng một người thực
    mapping(bytes32 => FamilyTypes.ExternalRef[]) private _equivalents;
    mapping(bytes32 => mapping(bytes32 => bool))    private _isEquivalent;
    mapping(bytes32 => mapping(bytes32 => uint256)) private _equivalentIndex;

    /// @notice Address of the Genealogy registry that initialized this clone
    address public genealogyAddress;

    /// @notice Short description of this clan
    string public clanShortDesc;

    // -----------------------------------------------------------------------
    // Events
    // -----------------------------------------------------------------------

    event PersonCreated(bytes32 indexed personId, address indexed ownership);
    event UpdatePersonData(address indexed sender, bytes32 indexed personId);
    event ClanShortDescChanged(address indexed owner);
    event SpouseAdded(address indexed sender, bytes32 indexed personId, bytes32 indexed newSpouseId);
    event SpouseRemoved(address indexed sender, bytes32 indexed personId, bytes32 indexed spouseId);
    event ExternalSpouseAdded(address indexed sender, bytes32 indexed personId, address indexed clanAddress, bytes32 externalPersonId);
    event ExternalSpouseRemoved(address indexed sender, bytes32 indexed personId, address indexed clanAddress, bytes32 externalPersonId);
    event ChildAdded(address indexed sender, bytes32 indexed parentId, bytes32 indexed newChildId);
    event ChildRemoved(address indexed sender, bytes32 indexed childId);
    event PersonImported(address indexed sender, bytes32 indexed newPersonId, address indexed srcClanAddress, bytes32 srcPersonId);
    event SamePersonLinked(address indexed sender, bytes32 indexed localPersonId, address indexed otherClanAddress, bytes32 otherPersonId);
    event SamePersonUnlinked(address indexed sender, bytes32 indexed localPersonId, address indexed otherClanAddress, bytes32 otherPersonId);

    // -----------------------------------------------------------------------
    // Constructor — locks the implementation so it cannot be initialized directly
    // -----------------------------------------------------------------------

    constructor() {
        _disableInitializers();
    }

    // -----------------------------------------------------------------------
    // Initializer — called once by Genealogy on each freshly deployed clone
    // -----------------------------------------------------------------------

    /// @notice Initializes this clan clone.
    /// @param clanName          Name of the clan
    /// @param clanDesc          Short description of the clan
    /// @param ancestorName      Name of the founding ancestor
    /// @param ancestorShortDesc Short description of the ancestor
    /// @param birthDate         Ancestor's birth date (all-zero = unknown)
    /// @param deathDate         Ancestor's death date (all-zero = unknown)
    /// @param isDeceased        Whether the ancestor is deceased
    /// @param ancestorSex       Biological sex of the ancestor
    /// @param owner             Address that will own the ancestor token and control the clan
    function initialize(
        string memory clanName,
        string memory clanDesc,
        string memory ancestorName,
        string memory ancestorShortDesc,
        FamilyTypes.DateInfo memory birthDate,
        FamilyTypes.DateInfo memory deathDate,
        bool isDeceased,
        FamilyTypes.Sex ancestorSex,
        address owner
    ) external override initializer {
        require(bytes(clanName).length > 0, "Clan name cannot be empty");
        require(bytes(ancestorName).length > 0, "Ancestor name cannot be empty");
        FamilyTypes.validateDate(birthDate);
        FamilyTypes.validateDate(deathDate);
        FamilyTypes.validateDeceased(deathDate, isDeceased);

        LSP8IdentifiableDigitalAssetInitAbstract._initialize(
            clanName,
            "FAMILY",
            owner,
            _LSP4_TOKEN_TYPE_COLLECTION,
            _LSP8_TOKENID_FORMAT_NUMBER
        );
        __ReentrancyGuard_init();
        __Pausable_init();

        genealogyAddress = msg.sender;
        clanShortDesc = clanDesc;
        _createNewPerson(ancestorName, ancestorShortDesc, owner, ancestorSex, birthDate, deathDate, isDeceased);
    }

    // -----------------------------------------------------------------------
    // Admin (ancestor token owner)
    // -----------------------------------------------------------------------

    /// @notice Pauses all state-changing operations. Only the ancestor token owner can call this.
    function pause() external {
        require(msg.sender == tokenOwnerOf(ANCESTOR_TOKEN_ID), "Not authorized");
        _pause();
    }

    /// @notice Resumes state-changing operations. Only the ancestor token owner can call this.
    function unpause() external {
        require(msg.sender == tokenOwnerOf(ANCESTOR_TOKEN_ID), "Not authorized");
        _unpause();
    }

    // -----------------------------------------------------------------------
    // Registry governance (Genealogy contract only)
    // -----------------------------------------------------------------------

    /// @inheritdoc IFamilyNFT
    function pauseByRegistry() external override onlyGenealogy {
        _pause();
    }

    /// @inheritdoc IFamilyNFT
    function unpauseByRegistry() external override onlyGenealogy {
        _unpause();
    }

    // -----------------------------------------------------------------------
    // Clan metadata
    // -----------------------------------------------------------------------

    /// @notice Updates the clan's short description. Only the ancestor token owner can call this.
    function setClanShortDesc(string memory newClanShortDesc) external whenNotPaused {
        require(msg.sender == tokenOwnerOf(ANCESTOR_TOKEN_ID), "Not authorized");
        clanShortDesc = newClanShortDesc;
        emit ClanShortDescChanged(msg.sender);
    }

    // -----------------------------------------------------------------------
    // Person management
    // -----------------------------------------------------------------------

    /// @notice Updates a person's basic information.
    function updatePersonData(
        bytes32 personId,
        string memory newName,
        string memory newShortDesc,
        FamilyTypes.DateInfo memory birthDate,
        FamilyTypes.DateInfo memory deathDate,
        bool isDeceased
    ) external whenNotPaused onlyAuthorized(personId) {
        require(bytes(newName).length > 0, "Name cannot be empty");
        FamilyTypes.validateDate(birthDate);
        FamilyTypes.validateDate(deathDate);
        FamilyTypes.validateDeceased(deathDate, isDeceased);
        FamilyTypes.Person storage p = persons[personId];
        p.name = newName;
        p.birthDate = birthDate;
        p.deathDate = deathDate;
        p.isDeceased = isDeceased;
        p.shortDesc = newShortDesc;
        emit UpdatePersonData(msg.sender, personId);
    }

    /// @notice Creates a new person token and registers them as a spouse.
    /// @param personId   Token ID of the existing person
    /// @param name       Name of the spouse
    /// @param shortDesc  Short description of the spouse
    /// @param sex        Biological sex of the spouse
    /// @param birthDate  Spouse's birth date (all-zero = unknown)
    /// @param deathDate  Spouse's death date (all-zero = unknown)
    /// @param isDeceased Whether the spouse is deceased
    function addSpouse(
        bytes32 personId,
        string memory name,
        string memory shortDesc,
        FamilyTypes.Sex sex,
        FamilyTypes.DateInfo memory birthDate,
        FamilyTypes.DateInfo memory deathDate,
        bool isDeceased
    ) external whenNotPaused nonReentrant onlyAuthorized(personId) {
        require(bytes(name).length > 0, "Spouse name cannot be empty");
        FamilyTypes.validateDate(birthDate);
        FamilyTypes.validateDate(deathDate);
        FamilyTypes.validateDeceased(deathDate, isDeceased);

        bytes32 spouseId = _createNewPerson(name, shortDesc, msg.sender, sex, birthDate, deathDate, isDeceased);
        _addSpouseLink(personId, spouseId);
        _addSpouseLink(spouseId, personId);
        emit SpouseAdded(msg.sender, personId, spouseId);
    }

    /// @notice Links two existing persons within this clan as spouses (bidirectional).
    ///         Caller must be the ancestor owner or the owner of either token.
    function linkSpouses(
        bytes32 personId1,
        bytes32 personId2
    ) external whenNotPaused nonReentrant {
        require(_personExists[personId1], "Person 1 does not exist");
        require(_personExists[personId2], "Person 2 does not exist");
        require(personId1 != personId2, "Cannot link person to themselves");
        require(!_isSpouse[personId1][personId2], "Already spouses");

        address ancestorOwner = tokenOwnerOf(ANCESTOR_TOKEN_ID);
        require(
            msg.sender == ancestorOwner ||
            msg.sender == tokenOwnerOf(personId1) ||
            msg.sender == tokenOwnerOf(personId2),
            "Not authorized"
        );

        _addSpouseLink(personId1, personId2);
        _addSpouseLink(personId2, personId1);
        emit SpouseAdded(msg.sender, personId1, personId2);
    }

    /// @notice Removes the spouse link between two same-clan persons (bidirectional).
    function removeSpouse(
        bytes32 personId,
        bytes32 spouseId
    ) external whenNotPaused onlyAuthorized(personId) {
        require(_isSpouse[personId][spouseId], "Spouse not found");
        _removeSpouseLink(personId, spouseId);
        _removeSpouseLink(spouseId, personId);
        emit SpouseRemoved(msg.sender, personId, spouseId);
    }

    /// @notice Links a person in this clan to a person in another FamilyNFT clan as spouses.
    ///         The link is one-directional (stored only in this contract).
    /// @param personId        Token ID of the local person
    /// @param clanAddress     Address of the external FamilyNFT contract
    /// @param externalPersonId Token ID of the person in the external contract
    function addExternalSpouse(
        bytes32 personId,
        address clanAddress,
        bytes32 externalPersonId
    ) external whenNotPaused nonReentrant onlyAuthorized(personId) {
        require(clanAddress != address(this), "Use addSpouse or linkSpouses for same-clan members");
        require(clanAddress != address(0), "Invalid clan address");

        bytes32 refHash = _externalRefHash(clanAddress, externalPersonId);
        require(!_isExternalSpouse[personId][refHash], "Already linked as external spouse");
        require(IFamilyNFT(clanAddress).personExists(externalPersonId), "External person does not exist");

        _externalSpouseIndex[personId][refHash] = persons[personId].externalSpouses.length;
        _isExternalSpouse[personId][refHash] = true;
        persons[personId].externalSpouses.push(FamilyTypes.ExternalRef({
            contractAddress: clanAddress,
            tokenId: externalPersonId
        }));
        emit ExternalSpouseAdded(msg.sender, personId, clanAddress, externalPersonId);
    }

    /// @notice Removes a cross-clan spouse link from this person's record.
    function removeExternalSpouse(
        bytes32 personId,
        address clanAddress,
        bytes32 externalPersonId
    ) external whenNotPaused onlyAuthorized(personId) {
        bytes32 refHash = _externalRefHash(clanAddress, externalPersonId);
        require(_isExternalSpouse[personId][refHash], "External spouse not found");

        FamilyTypes.ExternalRef[] storage ext = persons[personId].externalSpouses;
        uint256 idx = _externalSpouseIndex[personId][refHash];
        uint256 lastIndex = ext.length - 1;
        if (idx != lastIndex) {
            FamilyTypes.ExternalRef memory last = ext[lastIndex];
            ext[idx] = last;
            _externalSpouseIndex[personId][_externalRefHash(last.contractAddress, last.tokenId)] = idx;
        }
        ext.pop();
        delete _externalSpouseIndex[personId][refHash];
        delete _isExternalSpouse[personId][refHash];
        emit ExternalSpouseRemoved(msg.sender, personId, clanAddress, externalPersonId);
    }

    /// @notice Creates a new child token and links it to the parent.
    function addChild(
        bytes32 parentId,
        string memory childName,
        string memory shortDesc,
        FamilyTypes.Sex sex,
        FamilyTypes.DateInfo memory birthDate,
        FamilyTypes.DateInfo memory deathDate,
        bool isDeceased
    ) external whenNotPaused nonReentrant onlyAuthorized(parentId) {
        require(bytes(childName).length > 0, "Child name cannot be empty");
        require(_personExists[parentId], "Parent does not exist");
        FamilyTypes.validateDate(birthDate);
        FamilyTypes.validateDate(deathDate);
        FamilyTypes.validateDeceased(deathDate, isDeceased);

        bytes32 childId = _createNewPerson(childName, shortDesc, msg.sender, sex, birthDate, deathDate, isDeceased);
        _childIndex[parentId][childId] = persons[parentId].children.length;
        _isChild[parentId][childId] = true;
        persons[parentId].children.push(childId);
        persons[childId].parentId = parentId;
        emit ChildAdded(msg.sender, parentId, childId);
    }

    /// @notice Removes a child from their parent's children list.
    function removeChild(
        bytes32 childId
    ) external whenNotPaused onlyAuthorized(childId) {
        bytes32 parentId = persons[childId].parentId;
        require(parentId != bytes32(0), "Parent invalid");
        require(_isChild[parentId][childId], "Child not found in parent");

        FamilyTypes.Person storage parent = persons[parentId];
        uint256 idx = _childIndex[parentId][childId];
        uint256 lastIndex = parent.children.length - 1;
        if (idx != lastIndex) {
            bytes32 lastChild = parent.children[lastIndex];
            parent.children[idx] = lastChild;
            _childIndex[parentId][lastChild] = idx;
        }
        parent.children.pop();
        delete _childIndex[parentId][childId];
        delete _isChild[parentId][childId];
        persons[childId].parentId = bytes32(0);
        emit ChildRemoved(msg.sender, childId);
    }

    // -----------------------------------------------------------------------
    // Tình huống 2: Nhập người từ gia phả khác (import)
    // -----------------------------------------------------------------------

    /// @notice Tạo token mới trong clan này đại diện cho một người đã có trong gia phả khác.
    ///         Token mới hoạt động đầy đủ (có thể thêm con, vợ/chồng...) và lưu nguồn gốc.
    ///         Chỉ ancestor owner mới có quyền import.
    /// @param name           Tên người được nhập
    /// @param shortDesc      Mô tả ngắn
    /// @param sex            Giới tính
    /// @param birthDate      Ngày sinh (all-zero = không rõ)
    /// @param deathDate      Ngày mất (all-zero = không rõ)
    /// @param isDeceased     Đã mất chưa
    /// @param srcClanAddress Địa chỉ contract FamilyNFT nguồn
    /// @param srcPersonId    Token ID của người trong gia phả nguồn
    /// @return newPersonId   Token ID mới được tạo trong clan này
    function importPerson(
        string memory name,
        string memory shortDesc,
        FamilyTypes.Sex sex,
        FamilyTypes.DateInfo memory birthDate,
        FamilyTypes.DateInfo memory deathDate,
        bool isDeceased,
        address srcClanAddress,
        bytes32 srcPersonId
    ) external whenNotPaused nonReentrant returns (bytes32 newPersonId) {
        require(msg.sender == tokenOwnerOf(ANCESTOR_TOKEN_ID), "Not authorized: ancestor owner only");
        require(srcClanAddress != address(0) && srcClanAddress != address(this), "Invalid source clan");
        require(bytes(name).length > 0, "Name cannot be empty");
        FamilyTypes.validateDate(birthDate);
        FamilyTypes.validateDate(deathDate);
        FamilyTypes.validateDeceased(deathDate, isDeceased);
        require(IFamilyNFT(srcClanAddress).personExists(srcPersonId), "Source person does not exist");

        newPersonId = _createNewPerson(name, shortDesc, msg.sender, sex, birthDate, deathDate, isDeceased);
        _personOrigin[newPersonId] = FamilyTypes.ExternalRef({
            contractAddress: srcClanAddress,
            tokenId: srcPersonId
        });
        emit PersonImported(msg.sender, newPersonId, srcClanAddress, srcPersonId);
    }

    // -----------------------------------------------------------------------
    // Tình huống 3: Đánh dấu hai bản ghi ở hai gia phả là cùng một người thực
    // -----------------------------------------------------------------------

    /// @notice Đánh dấu localPersonId trong clan này là cùng một người thực với
    ///         otherPersonId trong clan khác. Liên kết một chiều (chỉ lưu ở đây).
    ///         Hữu ích khi hai gia phả phát hiện cùng ghi một người.
    function linkSamePerson(
        bytes32 localPersonId,
        address otherClanAddress,
        bytes32 otherPersonId
    ) external whenNotPaused nonReentrant onlyAuthorized(localPersonId) {
        require(otherClanAddress != address(0) && otherClanAddress != address(this), "Invalid clan address");

        bytes32 refHash = _externalRefHash(otherClanAddress, otherPersonId);
        require(!_isEquivalent[localPersonId][refHash], "Already marked as same person");
        require(IFamilyNFT(otherClanAddress).personExists(otherPersonId), "External person does not exist");

        _equivalentIndex[localPersonId][refHash] = _equivalents[localPersonId].length;
        _isEquivalent[localPersonId][refHash] = true;
        _equivalents[localPersonId].push(FamilyTypes.ExternalRef({
            contractAddress: otherClanAddress,
            tokenId: otherPersonId
        }));
        emit SamePersonLinked(msg.sender, localPersonId, otherClanAddress, otherPersonId);
    }

    /// @notice Xoá liên kết "cùng người thực" đã thiết lập bởi linkSamePerson.
    function unlinkSamePerson(
        bytes32 localPersonId,
        address otherClanAddress,
        bytes32 otherPersonId
    ) external whenNotPaused onlyAuthorized(localPersonId) {
        bytes32 refHash = _externalRefHash(otherClanAddress, otherPersonId);
        require(_isEquivalent[localPersonId][refHash], "Not linked as same person");

        FamilyTypes.ExternalRef[] storage equivs = _equivalents[localPersonId];
        uint256 idx = _equivalentIndex[localPersonId][refHash];
        uint256 lastIndex = equivs.length - 1;
        if (idx != lastIndex) {
            FamilyTypes.ExternalRef memory last = equivs[lastIndex];
            equivs[idx] = last;
            _equivalentIndex[localPersonId][_externalRefHash(last.contractAddress, last.tokenId)] = idx;
        }
        equivs.pop();
        delete _equivalentIndex[localPersonId][refHash];
        delete _isEquivalent[localPersonId][refHash];
        emit SamePersonUnlinked(msg.sender, localPersonId, otherClanAddress, otherPersonId);
    }

    /// @notice Sets arbitrary metadata on a person token (LSP8 data key/value).
    function setDataForTokenId(
        bytes32 tokenId,
        bytes32 dataKey,
        bytes memory dataValue
    ) public virtual override whenNotPaused onlyAuthorized(tokenId) {
        _setDataForTokenId(tokenId, dataKey, dataValue);
    }

    // -----------------------------------------------------------------------
    // View functions
    // -----------------------------------------------------------------------

    /// @inheritdoc IFamilyNFT
    function personExists(bytes32 personId) external view override returns (bool) {
        return _personExists[personId];
    }

    /// @notice Returns the full data record for a person
    function getPersonInfo(bytes32 personId) external view returns (FamilyTypes.Person memory) {
        return persons[personId];
    }

    /// @notice Returns the origin reference if this person was imported from another clan.
    ///         contractAddress == address(0) means the person was created locally.
    function getPersonOrigin(bytes32 personId) external view returns (FamilyTypes.ExternalRef memory) {
        return _personOrigin[personId];
    }

    /// @notice Returns all cross-clan "same person" equivalents declared for this person.
    function getEquivalents(bytes32 personId) external view returns (FamilyTypes.ExternalRef[] memory) {
        return _equivalents[personId];
    }

    // -----------------------------------------------------------------------
    // Internal helpers
    // -----------------------------------------------------------------------

    function _createNewPerson(
        string memory name,
        string memory shortDesc,
        address owner,
        FamilyTypes.Sex sex,
        FamilyTypes.DateInfo memory birthDate,
        FamilyTypes.DateInfo memory deathDate,
        bool isDeceased
    ) private returns (bytes32 personId) {
        unchecked { ++personCount; }
        personId = bytes32(personCount);
        _mint(owner, personId, true, "");
        _personExists[personId] = true;
        FamilyTypes.Person storage p = persons[personId];
        p.name = name;
        p.birthDate = birthDate;
        p.deathDate = deathDate;
        p.isDeceased = isDeceased;
        p.sex = sex;
        p.shortDesc = shortDesc;
        p.createdAt = block.timestamp;
        emit PersonCreated(personId, owner);
    }

    function _addSpouseLink(bytes32 personId, bytes32 spouseId) private {
        _spouseIndex[personId][spouseId] = persons[personId].spouses.length;
        _isSpouse[personId][spouseId] = true;
        persons[personId].spouses.push(spouseId);
    }

    function _removeSpouseLink(bytes32 personId, bytes32 spouseId) private {
        bytes32[] storage spouses = persons[personId].spouses;
        uint256 idx = _spouseIndex[personId][spouseId];
        uint256 lastIndex = spouses.length - 1;
        if (idx != lastIndex) {
            bytes32 last = spouses[lastIndex];
            spouses[idx] = last;
            _spouseIndex[personId][last] = idx;
        }
        spouses.pop();
        delete _spouseIndex[personId][spouseId];
        delete _isSpouse[personId][spouseId];
    }

    function _externalRefHash(address contractAddress, bytes32 tokenId) private pure returns (bytes32) {
        return keccak256(abi.encode(contractAddress, tokenId));
    }

    // -----------------------------------------------------------------------
    // Modifiers
    // -----------------------------------------------------------------------

    modifier onlyGenealogy() {
        require(msg.sender == genealogyAddress, "Not authorized: not registry");
        _;
    }

    /// @dev Short-circuit: if caller is ancestor owner, skip the second storage read.
    modifier onlyAuthorized(bytes32 tokenId) {
        address ancestorOwner = tokenOwnerOf(ANCESTOR_TOKEN_ID);
        require(
            msg.sender == ancestorOwner || msg.sender == tokenOwnerOf(tokenId),
            "Not authorized"
        );
        _;
    }
}
