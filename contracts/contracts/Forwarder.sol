// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

contract Forwarder {
    address public immutable admin;

    event PaymentReceived(address indexed from, uint256 amount, uint256 timestamp);

    constructor(address _admin) {
        admin = _admin;
    }

    receive() external payable {
        if (msg.value > 0) {
            // Forward all ETH to admin
            (bool success, ) = admin.call{value: msg.value}("");
            require(success, "Forward failed");

            emit PaymentReceived(msg.sender, msg.value, block.timestamp);
        }
    }

    function getAddress() external view returns (address) {
        return address(this);
    }
}
