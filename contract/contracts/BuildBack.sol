// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";

/**
 * @title BuildBack
 * @dev Community-driven hackathon project backing platform on Base
 * @notice Users back projects they believe in and earn rewards for accurate predictions
 */
contract BuildBack is Ownable, ReentrancyGuard, Pausable {
    // Custom errors for gas efficiency
    error RegistrationClosed();
    error AlreadyRegistered();
    error InvalidStringLength();
    error ProjectNotFound();
    error BackingTooSmall();
    error EventAlreadySettled();
    error NoBackingOnWinner();
    error RewardAlreadyClaimed();
    error TransferFailed();
    error RegistrationStillOpen();
    error ProjectNotApproved();

    // Constants
    uint256 public constant PLATFORM_FEE_PERCENT = 2;
    uint256 public constant MIN_BACKING = 0.0001 ether;
    uint256 public constant MAX_NAME_LENGTH = 50;
    uint256 public constant MAX_DESCRIPTION_LENGTH = 500;
    uint256 public constant MAX_HACKATHON_NAME_LENGTH = 100;
    uint256 public constant MAX_HACKATHON_DESCRIPTION_LENGTH = 1000;

    // Structs
    struct Hackathon {
        string name;
        string description;
        uint256 startTime;
        uint256 endTime;
        bool created;
    }

    struct Project {
        uint256 id;
        string name;
        string description;
        address creator;
        uint256 totalBacking;
        bool exists;
        bool approved;
    }

    struct Backing {
        uint256 amount;
        bool claimed;
    }

    // State variables
    Hackathon public hackathon;
    mapping(uint256 => Project) public projects;
    mapping(address => mapping(uint256 => Backing)) public userBackings;
    mapping(address => bool) public hasRegisteredProject;
    
    uint256 public projectCount;
    uint256 public totalPool;
    uint256 public winnerId;
    bool public registrationOpen;
    bool public eventSettled;

    // Events
    event HackathonCreated(string name, string description, uint256 startTime, uint256 endTime);
    event ProjectRegistered(uint256 indexed projectId, string name, address indexed creator);
    event ProjectApproved(uint256 indexed projectId);
    event ProjectBacked(address indexed backer, uint256 indexed projectId, uint256 amount);
    event RegistrationClosed();
    event EventSettled(uint256 indexed winnerId);
    event RewardClaimed(address indexed user, uint256 amount);

    constructor(
        address _owner,
        string memory name,
        string memory description,
        uint256 startTime,
        uint256 endTime
    ) Ownable(_owner) {
        if (bytes(name).length == 0 || bytes(name).length > MAX_HACKATHON_NAME_LENGTH) revert InvalidStringLength();
        if (bytes(description).length == 0 || bytes(description).length > MAX_HACKATHON_DESCRIPTION_LENGTH) revert InvalidStringLength();

        hackathon = Hackathon({
            name: name,
            description: description,
            startTime: startTime,
            endTime: endTime,
            created: true
        });

        registrationOpen = true;
        eventSettled = false;

        emit HackathonCreated(name, description, startTime, endTime);
    }

    /**
     * @dev Register a new project for the hackathon
     * @param name Project name (max 50 characters)
     * @param description Project description (max 500 characters)
     */
    function registerProject(string calldata name, string calldata description) external whenNotPaused {
        if (!registrationOpen) revert RegistrationClosed();
        if (hasRegisteredProject[msg.sender]) revert AlreadyRegistered();
        if (bytes(name).length == 0 || bytes(name).length > MAX_NAME_LENGTH) revert InvalidStringLength();
        if (bytes(description).length == 0 || bytes(description).length > MAX_DESCRIPTION_LENGTH) revert InvalidStringLength();

        projectCount++;
        
        projects[projectCount] = Project({
            id: projectCount,
            name: name,
            description: description,
            creator: msg.sender,
            totalBacking: 0,
            exists: true,
            approved: false // Requires admin approval
        });

        hasRegisteredProject[msg.sender] = true;

        emit ProjectRegistered(projectCount, name, msg.sender);
    }

    /**
     * @dev Approve a project (admin only)
     * @param projectId ID of the project to approve
     */
    function approveProject(uint256 projectId) external onlyOwner {
        if (!projects[projectId].exists) revert ProjectNotFound();
        projects[projectId].approved = true;
        emit ProjectApproved(projectId);
    }

    /**
     * @dev Back a project with ETH
     * @param projectId ID of the project to back
     */
    function backProject(uint256 projectId) external payable whenNotPaused {
        if (!projects[projectId].exists) revert ProjectNotFound();
        if (!projects[projectId].approved) revert ProjectNotApproved();
        if (msg.value < MIN_BACKING) revert BackingTooSmall();
        if (eventSettled) revert EventAlreadySettled();

        // Update or create backing
        userBackings[msg.sender][projectId].amount += msg.value;
        
        // Update project and pool totals
        projects[projectId].totalBacking += msg.value;
        totalPool += msg.value;

        emit ProjectBacked(msg.sender, projectId, msg.value);
    }

    /**
     * @dev Close project registration (admin only)
     */
    function closeRegistration() external onlyOwner {
        if (!registrationOpen) revert RegistrationClosed();
        registrationOpen = false;
        emit RegistrationClosed();
    }

    /**
     * @dev Settle the event with a winner (admin only)
     * @param _winnerId ID of the winning project
     */
    function settleEvent(uint256 _winnerId) external onlyOwner {
        if (eventSettled) revert EventAlreadySettled();
        if (!projects[_winnerId].exists) revert ProjectNotFound();
        if (registrationOpen) revert RegistrationStillOpen();

        winnerId = _winnerId;
        eventSettled = true;

        emit EventSettled(_winnerId);
    }

    /**
     * @dev Claim rewards if backed the winner
     */
    function claimReward() external nonReentrant whenNotPaused {
        if (!eventSettled) revert EventAlreadySettled();
        
        Backing storage userBacking = userBackings[msg.sender][winnerId];
        
        if (userBacking.amount == 0) revert NoBackingOnWinner();
        if (userBacking.claimed) revert RewardAlreadyClaimed();

        // Calculate reward
        uint256 winnerTotalBacking = projects[winnerId].totalBacking;
        uint256 poolAfterFee = (totalPool * (100 - PLATFORM_FEE_PERCENT)) / 100;
        uint256 reward = (userBacking.amount * poolAfterFee) / winnerTotalBacking;

        // Mark as claimed before transfer
        userBacking.claimed = true;

        // Transfer reward
        (bool success, ) = msg.sender.call{value: reward}("");
        if (!success) revert TransferFailed();

        emit RewardClaimed(msg.sender, reward);
    }

    /**
     * @dev Get confidence score for a project (returns multiplier * 100)
     * @param projectId ID of the project
     * @return Confidence score as percentage (e.g., 250 = 2.5x)
     */
    function getConfidenceScore(uint256 projectId) external view returns (uint256) {
        if (!projects[projectId].exists) return 0;
        if (projects[projectId].totalBacking == 0) return 0;
        
        return (totalPool * 100) / projects[projectId].totalBacking;
    }

    /**
     * @dev Get project details
     * @param projectId ID of the project
     */
    function getProjectDetails(uint256 projectId) external view returns (Project memory) {
        return projects[projectId];
    }

    /**
     * @dev Get user's backing on a project
     * @param user Address of the user
     * @param projectId ID of the project
     */
    function getUserBacking(address user, uint256 projectId) external view returns (Backing memory) {
        return userBackings[user][projectId];
    }

    /**
     * @dev Get all projects (for frontend)
     */
    function getAllProjects() external view returns (Project[] memory) {
        Project[] memory allProjects = new Project[](projectCount);
        
        for (uint256 i = 1; i <= projectCount; i++) {
            allProjects[i - 1] = projects[i];
        }
        
        return allProjects;
    }

    /**
     * @dev Get hackathon details
     */
    function getHackathonDetails() external view returns (Hackathon memory) {
        return hackathon;
    }

    /**
     * @dev Calculate expected reward for a user
     * @param user Address of the user
     */
    function calculateReward(address user) external view returns (uint256) {
        if (!eventSettled) return 0;
        
        Backing memory userBacking = userBackings[user][winnerId];
        if (userBacking.amount == 0 || userBacking.claimed) return 0;

        uint256 winnerTotalBacking = projects[winnerId].totalBacking;
        uint256 poolAfterFee = (totalPool * (100 - PLATFORM_FEE_PERCENT)) / 100;
        
        return (userBacking.amount * poolAfterFee) / winnerTotalBacking;
    }

    /**
     * @dev Withdraw platform fees (admin only)
     */
    function withdrawFees() external onlyOwner {
        if (!eventSettled) revert EventAlreadySettled();
        
        uint256 fees = (totalPool * PLATFORM_FEE_PERCENT) / 100;
        
        (bool success, ) = owner().call{value: fees}("");
        if (!success) revert TransferFailed();
    }

    /**
     * @dev Pause contract (emergency)
     */
    function pause() external onlyOwner {
        _pause();
    }

    /**
     * @dev Unpause contract
     */
    function unpause() external onlyOwner {
        _unpause();
    }
}
