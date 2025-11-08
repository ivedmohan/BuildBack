// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

/**
 * @title BuildBack
 * @dev Community-driven hackathon project backing platform on Avalanche
 * @notice Users back projects with USDC and earn rewards for accurate predictions
 */
contract BuildBack is Ownable, ReentrancyGuard, Pausable {
    using SafeERC20 for IERC20;

    // Custom errors for gas efficiency
    error RegistrationAlreadyClosed();
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
    error InvalidWinnerPercentages();
    error InsufficientAllowance();

    // Constants
    uint256 public constant PLATFORM_FEE_PERCENT = 2;
    uint256 public constant MIN_BACKING = 1e6; // 1 USDC (6 decimals)
    uint256 public constant MAX_NAME_LENGTH = 50;
    uint256 public constant MAX_DESCRIPTION_LENGTH = 500;
    uint256 public constant MAX_HACKATHON_NAME_LENGTH = 100;
    uint256 public constant MAX_HACKATHON_DESCRIPTION_LENGTH = 1000;

    // USDC token address (Avalanche Fuji testnet)
    IERC20 public immutable usdcToken;

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

    struct Winner {
        uint256 projectId;
        uint256 percentage; // Percentage of pool (e.g., 50 = 50%)
    }

    // State variables
    Hackathon public hackathon;
    mapping(uint256 => Project) public projects;
    mapping(address => mapping(uint256 => Backing)) public userBackings;
    mapping(address => bool) public hasRegisteredProject;
    
    Winner[] public winners;
    uint256 public projectCount;
    uint256 public totalPool;
    bool public registrationOpen;
    bool public eventSettled;

    // Events
    event HackathonCreated(string name, string description, uint256 startTime, uint256 endTime);
    event ProjectRegistered(uint256 indexed projectId, string name, address indexed creator);
    event ProjectApproved(uint256 indexed projectId);
    event ProjectBacked(address indexed backer, uint256 indexed projectId, uint256 amount);
    event RegistrationClosed();
    event EventSettled(Winner[] winners);
    event RewardClaimed(address indexed user, uint256 amount);

    constructor(
        address _owner,
        address _usdcToken,
        string memory name,
        string memory description,
        uint256 startTime,
        uint256 endTime
    ) Ownable(_owner) {
        if (bytes(name).length == 0 || bytes(name).length > MAX_HACKATHON_NAME_LENGTH) revert InvalidStringLength();
        if (bytes(description).length == 0 || bytes(description).length > MAX_HACKATHON_DESCRIPTION_LENGTH) revert InvalidStringLength();

        usdcToken = IERC20(_usdcToken);
        
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
        if (!registrationOpen) revert RegistrationAlreadyClosed();
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
     * @dev Back a project with USDC
     * @param projectId ID of the project to back
     * @param amount Amount of USDC to back (in USDC's decimals, typically 6)
     */
    function backProject(uint256 projectId, uint256 amount) external whenNotPaused {
        if (!projects[projectId].exists) revert ProjectNotFound();
        if (!projects[projectId].approved) revert ProjectNotApproved();
        if (amount < MIN_BACKING) revert BackingTooSmall();
        if (eventSettled) revert EventAlreadySettled();

        // Transfer USDC from user to contract
        usdcToken.safeTransferFrom(msg.sender, address(this), amount);

        // Update or create backing
        userBackings[msg.sender][projectId].amount += amount;
        
        // Update project and pool totals
        projects[projectId].totalBacking += amount;
        totalPool += amount;

        emit ProjectBacked(msg.sender, projectId, amount);
    }

    /**
     * @dev Close project registration (admin only)
     */
    function closeRegistration() external onlyOwner {
        if (!registrationOpen) revert RegistrationAlreadyClosed();
        registrationOpen = false;
        emit RegistrationClosed();
    }

    /**
     * @dev Settle the event with multiple winners (admin only)
     * @param _winners Array of winners with their prize percentages
     */
    function settleEvent(Winner[] calldata _winners) external onlyOwner {
        if (eventSettled) revert EventAlreadySettled();
        if (registrationOpen) revert RegistrationStillOpen();

        // Validate percentages sum to 100
        uint256 totalPercentage = 0;
        for (uint256 i = 0; i < _winners.length; i++) {
            if (!projects[_winners[i].projectId].exists) revert ProjectNotFound();
            totalPercentage += _winners[i].percentage;
            winners.push(_winners[i]);
        }

        if (totalPercentage != 100) revert InvalidWinnerPercentages();

        eventSettled = true;

        emit EventSettled(_winners);
    }

    /**
     * @dev Claim rewards if backed any winning projects
     */
    function claimReward() external nonReentrant whenNotPaused {
        if (!eventSettled) revert EventAlreadySettled();
        
        uint256 totalReward = 0;

        // Calculate rewards from all winning projects
        for (uint256 i = 0; i < winners.length; i++) {
            uint256 projectId = winners[i].projectId;
            uint256 percentage = winners[i].percentage;
            
            Backing storage userBacking = userBackings[msg.sender][projectId];
            
            if (userBacking.amount > 0 && !userBacking.claimed) {
                uint256 winnerTotalBacking = projects[projectId].totalBacking;
                
                // Calculate this winner's prize pool
                uint256 winnerPrizePool = (totalPool * percentage * (100 - PLATFORM_FEE_PERCENT)) / 10000;
                
                // Calculate user's share of this prize pool
                uint256 reward = (userBacking.amount * winnerPrizePool) / winnerTotalBacking;
                
                totalReward += reward;
                userBacking.claimed = true;
            }
        }

        if (totalReward == 0) revert NoBackingOnWinner();

        // Transfer total USDC reward
        usdcToken.safeTransfer(msg.sender, totalReward);

        emit RewardClaimed(msg.sender, totalReward);
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
     * @dev Get all winners
     */
    function getAllWinners() external view returns (Winner[] memory) {
        return winners;
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
        
        uint256 totalReward = 0;

        for (uint256 i = 0; i < winners.length; i++) {
            uint256 projectId = winners[i].projectId;
            uint256 percentage = winners[i].percentage;
            
            Backing memory userBacking = userBackings[user][projectId];
            
            if (userBacking.amount > 0 && !userBacking.claimed) {
                uint256 winnerTotalBacking = projects[projectId].totalBacking;
                uint256 winnerPrizePool = (totalPool * percentage * (100 - PLATFORM_FEE_PERCENT)) / 10000;
                uint256 reward = (userBacking.amount * winnerPrizePool) / winnerTotalBacking;
                totalReward += reward;
            }
        }

        return totalReward;
    }

    /**
     * @dev Withdraw platform fees (admin only)
     */
    function withdrawFees() external onlyOwner {
        if (!eventSettled) revert EventAlreadySettled();
        
        uint256 fees = (totalPool * PLATFORM_FEE_PERCENT) / 100;
        
        usdcToken.safeTransfer(owner(), fees);
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
