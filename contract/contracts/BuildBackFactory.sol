// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "./BuildBack.sol";

/**
 * @title BuildBackFactory
 * @dev Factory contract for creating multiple hackathon backing events
 */
contract BuildBackFactory is Ownable {
    error InvalidStringLength();

    // Array of all created hackathon contracts
    address[] public hackathons;
    
    // Mapping to check if address is a valid hackathon
    mapping(address => bool) public isHackathon;

    event HackathonCreated(
        address indexed hackathonAddress,
        string name,
        string description,
        uint256 startTime,
        uint256 endTime,
        address indexed creator
    );

    constructor() Ownable(msg.sender) {}

    /**
     * @dev Create a new hackathon backing event
     * @param name Hackathon name
     * @param description Hackathon description
     * @param startTime Start timestamp
     * @param endTime End timestamp
     * @return hackathonAddress Address of the newly created hackathon contract
     */
    function createHackathon(
        string calldata name,
        string calldata description,
        uint256 startTime,
        uint256 endTime
    ) external onlyOwner returns (address hackathonAddress) {
        if (bytes(name).length == 0 || bytes(name).length > 100) revert InvalidStringLength();
        if (bytes(description).length == 0 || bytes(description).length > 1000) revert InvalidStringLength();

        // Deploy new BuildBack contract
        BuildBack newHackathon = new BuildBack(
            owner(),
            name,
            description,
            startTime,
            endTime
        );

        hackathonAddress = address(newHackathon);
        
        // Store the new hackathon
        hackathons.push(hackathonAddress);
        isHackathon[hackathonAddress] = true;

        emit HackathonCreated(
            hackathonAddress,
            name,
            description,
            startTime,
            endTime,
            msg.sender
        );

        return hackathonAddress;
    }

    /**
     * @dev Get all hackathon addresses
     * @return Array of hackathon contract addresses
     */
    function getAllHackathons() external view returns (address[] memory) {
        return hackathons;
    }

    /**
     * @dev Get total number of hackathons
     * @return Total count of hackathons
     */
    function getHackathonCount() external view returns (uint256) {
        return hackathons.length;
    }

    /**
     * @dev Get hackathon address by index
     * @param index Index in the hackathons array
     * @return Hackathon contract address
     */
    function getHackathonByIndex(uint256 index) external view returns (address) {
        require(index < hackathons.length, "Index out of bounds");
        return hackathons[index];
    }

    /**
     * @dev Check if an address is a valid hackathon from this factory
     * @param hackathonAddress Address to check
     * @return True if address is a valid hackathon
     */
    function isValidHackathon(address hackathonAddress) external view returns (bool) {
        return isHackathon[hackathonAddress];
    }
}
