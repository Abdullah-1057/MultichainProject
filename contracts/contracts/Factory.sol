// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "./Forwarder.sol";

contract Factory {
    address public immutable admin;
    mapping(bytes32 => address) public forwarders;

    event ForwarderCreated(bytes32 indexed salt, address forwarder);

    constructor(address _admin) {
        admin = _admin;
    }

    function createForwarder(bytes32 salt) external returns (address) {
        require(forwarders[salt] == address(0), "Forwarder already exists");

        // Create forwarder with CREATE2 for deterministic addresses
        bytes memory bytecode = abi.encodePacked(
            type(Forwarder).creationCode,
            abi.encode(admin)
        );

        address forwarder;
        assembly {
            forwarder := create2(0, add(bytecode, 0x20), mload(bytecode), salt)
        }

        require(forwarder != address(0), "Failed to create forwarder");

        forwarders[salt] = forwarder;
        emit ForwarderCreated(salt, forwarder);

        return forwarder;
    }

    function getForwarder(bytes32 salt) external view returns (address) {
        return forwarders[salt];
    }

    function predictAddress(bytes32 salt) external view returns (address) {
        bytes memory bytecode = abi.encodePacked(
            type(Forwarder).creationCode,
            abi.encode(admin)
        );

        bytes32 hash = keccak256(
            abi.encodePacked(
                bytes1(0xff),
                address(this),
                salt,
                keccak256(bytecode)
            )
        );

        return address(uint160(uint256(hash)));
    }
}
