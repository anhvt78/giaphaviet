// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {FamilyTypes} from "./familyTypes.sol";

/// @title IFamilyNFT
/// @notice Interface used by the Genealogy registry to initialize clone instances
///         and exercise governance (pause/unpause) over individual clans.
interface IFamilyNFT {
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
    ) external;

    /// @notice Returns whether a person token exists in this contract
    function personExists(bytes32 personId) external view returns (bool);

    /// @notice Pauses the clan; callable only by the registered Genealogy registry
    function pauseByRegistry() external;

    /// @notice Unpauses the clan; callable only by the registered Genealogy registry
    function unpauseByRegistry() external;
}
