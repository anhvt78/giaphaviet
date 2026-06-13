// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import {Clones} from "@openzeppelin/contracts/proxy/Clones.sol";

import {IFamilyNFT} from "./IFamilyNFT.sol";
import {FamilyTypes} from "./familyTypes.sol";
import "./constants.sol";

/// @title Genealogy Registry
/// @notice Manages registration of FamilyNFT clan contracts.
///         Deploys new clans as EIP-1167 minimal proxies of a shared implementation,
///         dramatically reducing per-clan deployment gas cost.
///         The contract owner can pause all registry operations and govern individual clans.
contract Genealogy is Ownable, Pausable, ReentrancyGuard {

    /// @notice Address of the FamilyNFT implementation contract used for cloning
    address public immutable implementation;

    /// @notice Total number of currently registered clans
    uint256 public clanCount;

    /// @dev Maps clan address => address that registered it (0 = not registered)
    mapping(address => address) private _clanOwner;

    /// @dev 1-based enumerable list of registered clan addresses
    mapping(uint256 => address) private _clanList;

    /// @dev Reverse lookup: clan address => its 1-based index in _clanList
    mapping(address => uint256) private _clanListIndex;

    // Tình huống 3: Hai gia phả chung gốc tổ
    // Một bên đề xuất liên kết, bên kia chấp nhận → liên kết song chiều được kích hoạt
    mapping(address => mapping(address => bool)) private _linkProposals;
    mapping(address => mapping(address => bool)) private _clanLinks;
    mapping(address => address[])                private _linkedClans;
    mapping(address => mapping(address => uint256)) private _linkedClanIndex;

    // -----------------------------------------------------------------------
    // Events
    // -----------------------------------------------------------------------

    event ClanCreated(address indexed creatorAddress, address indexed clanAddress);
    event ClanAdded(address indexed callerAddress, address indexed clanAddress);
    event ClanRemoved(address indexed callerAddress, address indexed clanAddress);
    event ClanPaused(address indexed callerAddress, address indexed clanAddress);
    event ClanUnpaused(address indexed callerAddress, address indexed clanAddress);
    event ClanLinkProposed(address indexed proposingClan, address indexed targetClan);
    event ClanLinkProposalWithdrawn(address indexed proposingClan, address indexed targetClan);
    event ClanLinked(address indexed clan1, address indexed clan2);
    event ClanLinkRemoved(address indexed clan1, address indexed clan2);

    // -----------------------------------------------------------------------
    // Constructor
    // -----------------------------------------------------------------------

    /// @param implementation_ Address of the deployed FamilyNFT implementation contract
    constructor(address implementation_) {
        require(implementation_ != address(0), "Invalid implementation address");
        implementation = implementation_;
    }

    // -----------------------------------------------------------------------
    // Registry admin
    // -----------------------------------------------------------------------

    /// @notice Pauses all registry operations (contract owner only)
    function pause() external onlyOwner {
        _pause();
    }

    /// @notice Resumes all registry operations (contract owner only)
    function unpause() external onlyOwner {
        _unpause();
    }

    // -----------------------------------------------------------------------
    // Clan management
    // -----------------------------------------------------------------------

    /// @notice Deploys a new FamilyNFT clone and registers it in one transaction.
    /// @param clanName          Name of the clan (cannot be empty)
    /// @param clanShortDesc     Short description of the clan
    /// @param ancestorName      Name of the founding ancestor (cannot be empty)
    /// @param ancestorShortDesc Short description of the ancestor
    /// @param birthDate         Ancestor's birth date (all-zero = unknown)
    /// @param deathDate         Ancestor's death date (all-zero = unknown)
    /// @param isDeceased        Whether the founding ancestor is deceased
    /// @param ancestorSex       Biological sex of the founding ancestor
    /// @return clanAddress      Address of the newly deployed FamilyNFT clone
    function createClan(
        string memory clanName,
        string memory clanShortDesc,
        string memory ancestorName,
        string memory ancestorShortDesc,
        FamilyTypes.DateInfo memory birthDate,
        FamilyTypes.DateInfo memory deathDate,
        bool isDeceased,
        FamilyTypes.Sex ancestorSex
    ) external whenNotPaused nonReentrant returns (address clanAddress) {
        require(bytes(clanName).length > 0, "Clan name cannot be empty");
        require(bytes(ancestorName).length > 0, "Ancestor name cannot be empty");
        FamilyTypes.validateDate(birthDate);
        FamilyTypes.validateDate(deathDate);
        FamilyTypes.validateDeceased(deathDate, isDeceased);

        clanAddress = Clones.clone(implementation);
        IFamilyNFT(clanAddress).initialize(
            clanName,
            clanShortDesc,
            ancestorName,
            ancestorShortDesc,
            birthDate,
            deathDate,
            isDeceased,
            ancestorSex,
            msg.sender
        );

        _registerClan(clanAddress, msg.sender);
        emit ClanCreated(msg.sender, clanAddress);
    }

    /// @notice Registers an existing FamilyNFT contract (pre-deployed externally).
    ///         Caller must own the ancestor token of that contract.
    /// @param clanAddress Address of the FamilyNFT contract to register
    function addClan(address clanAddress) external whenNotPaused nonReentrant {
        require(clanAddress != address(0), "Invalid clan address");
        require(_clanOwner[clanAddress] == address(0), "Clan already registered");

        address ancestorOwner;
        try IFamilyNFT(clanAddress).personExists(ANCESTOR_TOKEN_ID) returns (bool exists) {
            require(exists, "Invalid FamilyNFT contract");
            // personExists passed — now verify token ownership via low-level call
            (bool ok, bytes memory data) = clanAddress.staticcall(
                abi.encodeWithSignature("tokenOwnerOf(bytes32)", ANCESTOR_TOKEN_ID)
            );
            require(ok && data.length == 32, "Invalid FamilyNFT contract");
            ancestorOwner = abi.decode(data, (address));
        } catch {
            revert("Invalid FamilyNFT contract");
        }
        require(msg.sender == ancestorOwner, "Not authorized: caller is not ancestor token owner");

        _registerClan(clanAddress, msg.sender);
        emit ClanAdded(msg.sender, clanAddress);
    }

    /// @notice Cho phép ancestor token owner hiện tại của một clan cập nhật _clanOwner trong registry.
    ///         Cần thiết khi ancestor token được chuyển nhượng sau khi clan đã đăng ký.
    /// @param clanAddress Địa chỉ clan cần cập nhật quyền sở hữu
    function claimClanRegistration(address clanAddress) external whenNotPaused nonReentrant {
        require(_clanOwner[clanAddress] != address(0), "Clan not registered");

        (bool ok, bytes memory data) = clanAddress.staticcall(
            abi.encodeWithSignature("tokenOwnerOf(bytes32)", ANCESTOR_TOKEN_ID)
        );
        require(ok && data.length == 32, "Invalid FamilyNFT contract");
        address currentAncestorOwner = abi.decode(data, (address));

        require(msg.sender == currentAncestorOwner, "Not authorized: not current ancestor token owner");
        _clanOwner[clanAddress] = msg.sender;
    }

    /// @notice Removes a clan from the registry. Only the address that registered it can remove it.
    /// @param clanAddress Address of the FamilyNFT contract to remove
    function removeClan(address clanAddress) external whenNotPaused nonReentrant {
        require(_clanOwner[clanAddress] == msg.sender, "Not authorized: caller is not clan owner");
        _deregisterClan(clanAddress);
        emit ClanRemoved(msg.sender, clanAddress);
    }

    // -----------------------------------------------------------------------
    // Clan governance (registry owner only)
    // -----------------------------------------------------------------------

    /// @notice Pauses a registered clan's operations. Registry owner only.
    /// @param clanAddress Address of the FamilyNFT contract to pause
    function pauseClan(address clanAddress) external onlyOwner {
        require(_clanOwner[clanAddress] != address(0), "Clan not registered");
        IFamilyNFT(clanAddress).pauseByRegistry();
        emit ClanPaused(msg.sender, clanAddress);
    }

    /// @notice Resumes a registered clan's operations. Registry owner only.
    /// @param clanAddress Address of the FamilyNFT contract to unpause
    function unpauseClan(address clanAddress) external onlyOwner {
        require(_clanOwner[clanAddress] != address(0), "Clan not registered");
        IFamilyNFT(clanAddress).unpauseByRegistry();
        emit ClanUnpaused(msg.sender, clanAddress);
    }

    // -----------------------------------------------------------------------
    // View functions
    // -----------------------------------------------------------------------

    /// @notice Returns the registered owner of a clan (zero address = not registered)
    function getClanOwner(address clanAddress) external view returns (address) {
        return _clanOwner[clanAddress];
    }

    /// @notice Returns whether a clan is currently registered
    function isClanRegistered(address clanAddress) external view returns (bool) {
        return _clanOwner[clanAddress] != address(0);
    }

    /// @notice Returns the clan address at a given 1-based index
    /// @param index 1-based position in the registered clan list
    function getClan(uint256 index) external view returns (address) {
        require(index >= 1 && index <= clanCount, "Index out of bounds");
        return _clanList[index];
    }

    // -----------------------------------------------------------------------
    // Tình huống 3: Liên kết hai gia phả chung gốc tổ
    // -----------------------------------------------------------------------

    /// @notice Đề xuất liên kết với một gia phả khác. Chỉ ancestor owner của myClan mới được gọi.
    ///         Nếu targetClan đã đề xuất trước → liên kết được kích hoạt ngay lập tức.
    /// @param myClan     Địa chỉ clan của bạn (phải do msg.sender đăng ký)
    /// @param targetClan Địa chỉ clan muốn liên kết
    function proposeClanLink(address myClan, address targetClan) external whenNotPaused {
        require(_clanOwner[myClan] == msg.sender, "Not authorized: not clan owner");
        require(_clanOwner[targetClan] != address(0), "Target clan not registered");
        require(myClan != targetClan, "Cannot link clan to itself");
        require(!_clanLinks[myClan][targetClan], "Already linked");
        require(!_linkProposals[myClan][targetClan], "Proposal already pending");

        _linkProposals[myClan][targetClan] = true;
        emit ClanLinkProposed(myClan, targetClan);

        // Nếu bên kia đã đề xuất trước → kích hoạt liên kết song chiều
        if (_linkProposals[targetClan][myClan]) {
            _activateClanLink(myClan, targetClan);
        }
    }

    /// @notice Rút lại đề xuất liên kết chưa được chấp nhận.
    function withdrawClanLinkProposal(address myClan, address targetClan) external whenNotPaused {
        require(_clanOwner[myClan] == msg.sender, "Not authorized: not clan owner");
        require(_linkProposals[myClan][targetClan], "No pending proposal");
        _linkProposals[myClan][targetClan] = false;
        emit ClanLinkProposalWithdrawn(myClan, targetClan);
    }

    /// @notice Xoá liên kết đang hoạt động giữa hai gia phả. Một bên có thể huỷ.
    function removeClanLink(address myClan, address otherClan) external whenNotPaused {
        require(_clanOwner[myClan] == msg.sender, "Not authorized: not clan owner");
        require(_clanLinks[myClan][otherClan], "Clans are not linked");

        _clanLinks[myClan][otherClan] = false;
        _clanLinks[otherClan][myClan] = false;
        _removeClanLinkEntry(myClan, otherClan);
        _removeClanLinkEntry(otherClan, myClan);
        emit ClanLinkRemoved(myClan, otherClan);
    }

    /// @notice Trả về danh sách các gia phả đang liên kết với clan này
    function getLinkedClans(address clanAddress) external view returns (address[] memory) {
        return _linkedClans[clanAddress];
    }

    /// @notice Kiểm tra hai clan có đang liên kết không
    function areClansLinked(address clan1, address clan2) external view returns (bool) {
        return _clanLinks[clan1][clan2];
    }

    /// @notice Kiểm tra một đề xuất liên kết có đang chờ không
    function isClanLinkProposed(address proposingClan, address targetClan) external view returns (bool) {
        return _linkProposals[proposingClan][targetClan];
    }

    // -----------------------------------------------------------------------
    // Internal helpers
    // -----------------------------------------------------------------------

    function _registerClan(address clanAddress, address owner) private {
        ++clanCount;
        _clanOwner[clanAddress] = owner;
        _clanList[clanCount] = clanAddress;
        _clanListIndex[clanAddress] = clanCount;
    }

    function _deregisterClan(address clanAddress) private {
        uint256 idx = _clanListIndex[clanAddress];
        uint256 lastIdx = clanCount;
        if (idx != lastIdx) {
            address lastClan = _clanList[lastIdx];
            _clanList[idx] = lastClan;
            _clanListIndex[lastClan] = idx;
        }
        delete _clanList[lastIdx];
        delete _clanListIndex[clanAddress];
        delete _clanOwner[clanAddress];
        --clanCount;
    }

    function _activateClanLink(address clan1, address clan2) private {
        _clanLinks[clan1][clan2] = true;
        _clanLinks[clan2][clan1] = true;

        _linkedClanIndex[clan1][clan2] = _linkedClans[clan1].length;
        _linkedClans[clan1].push(clan2);

        _linkedClanIndex[clan2][clan1] = _linkedClans[clan2].length;
        _linkedClans[clan2].push(clan1);

        delete _linkProposals[clan1][clan2];
        delete _linkProposals[clan2][clan1];
        emit ClanLinked(clan1, clan2);
    }

    function _removeClanLinkEntry(address clan, address otherClan) private {
        address[] storage linked = _linkedClans[clan];
        uint256 idx = _linkedClanIndex[clan][otherClan];
        uint256 lastIdx = linked.length - 1;
        if (idx != lastIdx) {
            address last = linked[lastIdx];
            linked[idx] = last;
            _linkedClanIndex[clan][last] = idx;
        }
        linked.pop();
        delete _linkedClanIndex[clan][otherClan];
    }
}
