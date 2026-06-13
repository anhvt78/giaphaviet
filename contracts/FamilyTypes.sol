// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

library FamilyTypes {
    enum Sex {
        MALE,
        FEMALE,
        UNDEFINED
    }

    struct DateInfo {
        uint8 day;
        uint8 month;
        uint16 year;
    }

    /// @dev Reference to a person in another FamilyNFT contract (cross-clan)
    struct ExternalRef {
        address contractAddress;
        bytes32 tokenId;
    }

    struct Person {
        string name;
        bytes32 parentId;
        bytes32[] children;
        bytes32[] spouses;
        ExternalRef[] externalSpouses;
        Sex sex;
        DateInfo birthDate;
        DateInfo deathDate;
        bool isDeceased;
        string shortDesc;
        uint256 createdAt;
    }

    function isDateSet(DateInfo memory date) internal pure returns (bool) {
        return date.day != 0 || date.month != 0 || date.year != 0;
    }

    /// @dev Zero date means unknown and is always valid.
    ///      Non-zero dates must have month in [1,12] and day in [1,31].
    function validateDate(DateInfo memory date) internal pure {
        if (isDateSet(date)) {
            require(date.month >= 1 && date.month <= 12, "Invalid month");
            require(date.day >= 1 && date.day <= 31, "Invalid day");
        }
    }

    /// @dev If deathDate is set, isDeceased must be true.
    function validateDeceased(DateInfo memory deathDate, bool isDeceased) internal pure {
        require(!isDateSet(deathDate) || isDeceased, "Death date set but isDeceased is false");
    }
}
