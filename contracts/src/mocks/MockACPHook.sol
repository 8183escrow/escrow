// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {IERC8183} from "../../src/interfaces/IERC8183.sol";
import {IACPHook} from "../../src/interfaces/IACPHook.sol";

/**
 * @title MockACP Hook
 * @dev Tracks calls for assertions. Can be configured to revert.
 */
contract MockACPHook is IACPHook {
    uint256 public beforeCount;
    uint256 public afterCount;
    bool public shouldRevert;

    function setShouldRevert(bool v) external {
        shouldRevert = v;
    }

    function beforeAction(uint256, bytes4, bytes calldata) external override {
        if (shouldRevert) revert("MockHook: before revert");
        beforeCount++;
    }

    function afterAction(uint256, bytes4, bytes calldata) external override {
        if (shouldRevert) revert("MockHook: after revert");
        afterCount++;
    }
}
