// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
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
    error BackingNotAllowed();
    error CannotRefundAfterSettlement();
    error NoBackingToRefund();

    // Constants
    uint256 public constant PLATFORM_FEE_PERCENT = 2;
    uint256 public constant MIN_BACKING_USDC = 1e6; // 1 USDC (6 decimals)
    uint256 public constant MIN_BACKING_AVAX = 0.01 ether; // 0.01 AVAX
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
        uint256 totalUsdcBacking;
        uint256 totalAvaxBacking;
        bool exists;
        bool approved;
    }

    struct Backing {
        uint256 usdcAmount;
        uint256 avaxAmount;
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
    uint256 public totalUsdcPool;
    uint256 public totalAvaxPool;
    bool public registrationOpen;
    bool public backingAllowed;  // Admin controls when backing is allowed
    bool public eventSettled;

    // Events
    event HackathonCreated(string name, string description, uint256 startTime, uint256 endTime);
    event ProjectRegistered(uint256 indexed projectId, string name, address indexed creator);
    event ProjectApproved(uint256 indexed projectId);
    event ProjectBackedWithUSDC(address indexed backer, uint256 indexed projectId, uint256 amount);
    event ProjectBackedWithAVAX(address indexed backer, uint256 indexed projectId, uint256 amount);
    event RegistrationClosed();
    event BackingEnabled();
    event BackingDisabled();
    event EventSettled(Winner[] winners);
    event RewardClaimed(address indexed user, uint256 usdcAmount, uint256 avaxAmount);

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
        backingAllowed = false;  // Admin must enable backing manually
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
            totalUsdcBacking: 0,
            totalAvaxBacking: 0,
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
        if (!backingAllowed) revert BackingNotAllowed();
        if (!projects[projectId].exists) revert ProjectNotFound();
        if (!projects[projectId].approved) revert ProjectNotApproved();
        if (amount < MIN_BACKING_USDC) revert BackingTooSmall();
        if (eventSettled) revert EventAlreadySettled();

        // Transfer USDC from user to contract
        usdcToken.safeTransferFrom(msg.sender, address(this), amount);

        // Update or create backing
        userBackings[msg.sender][projectId].usdcAmount += amount;
        
        // Update project and pool totals
        projects[projectId].totalUsdcBacking += amount;
        totalUsdcPool += amount;

        emit ProjectBackedWithUSDC(msg.sender, projectId, amount);
    }

    /**
     * @dev Back a project with native AVAX
     * @param projectId ID of the project to back
     */
    function backProjectWithAVAX(uint256 projectId) external payable whenNotPaused {
        if (!backingAllowed) revert BackingNotAllowed();
        if (!projects[projectId].exists) revert ProjectNotFound();
        if (!projects[projectId].approved) revert ProjectNotApproved();
        if (msg.value < MIN_BACKING_AVAX) revert BackingTooSmall();
        if (eventSettled) revert EventAlreadySettled();

        // Update or create backing
        userBackings[msg.sender][projectId].avaxAmount += msg.value;
        
        // Update project and pool totals
        projects[projectId].totalAvaxBacking += msg.value;
        totalAvaxPool += msg.value;

        emit ProjectBackedWithAVAX(msg.sender, projectId, msg.value);
    }

    /**
     * @dev Enable backing (admin only) - Opens backing phase
     */
    function enableBacking() external onlyOwner {
        backingAllowed = true;
        emit BackingEnabled();
    }

    /**
     * @dev Disable backing (admin only) - Closes backing phase
     */
    function disableBacking() external onlyOwner {
        backingAllowed = false;
        emit BackingDisabled();
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
        
        uint256 totalUsdcReward = 0;
        uint256 totalAvaxReward = 0;

        // Calculate rewards from all winning projects
        for (uint256 i = 0; i < winners.length; i++) {
            uint256 projectId = winners[i].projectId;
            uint256 percentage = winners[i].percentage;
            
            Backing storage userBacking = userBackings[msg.sender][projectId];
            
            if (!userBacking.claimed && (userBacking.usdcAmount > 0 || userBacking.avaxAmount > 0)) {
                // Calculate USDC rewards
                if (userBacking.usdcAmount > 0) {
                    uint256 winnerTotalUsdcBacking = projects[projectId].totalUsdcBacking;
                    uint256 winnerUsdcPrizePool = (totalUsdcPool * percentage * (100 - PLATFORM_FEE_PERCENT)) / 10000;
                    uint256 usdcReward = (userBacking.usdcAmount * winnerUsdcPrizePool) / winnerTotalUsdcBacking;
                    totalUsdcReward += usdcReward;
                }

                // Calculate AVAX rewards
                if (userBacking.avaxAmount > 0) {
                    uint256 winnerTotalAvaxBacking = projects[projectId].totalAvaxBacking;
                    uint256 winnerAvaxPrizePool = (totalAvaxPool * percentage * (100 - PLATFORM_FEE_PERCENT)) / 10000;
                    uint256 avaxReward = (userBacking.avaxAmount * winnerAvaxPrizePool) / winnerTotalAvaxBacking;
                    totalAvaxReward += avaxReward;
                }

                userBacking.claimed = true;
            }
        }

        if (totalUsdcReward == 0 && totalAvaxReward == 0) revert NoBackingOnWinner();

        // Transfer USDC rewards
        if (totalUsdcReward > 0) {
            usdcToken.safeTransfer(msg.sender, totalUsdcReward);
        }

        // Transfer AVAX rewards
        if (totalAvaxReward > 0) {
            (bool success, ) = msg.sender.call{value: totalAvaxReward}("");
            if (!success) revert TransferFailed();
        }

        emit RewardClaimed(msg.sender, totalUsdcReward, totalAvaxReward);
    }

    /**
     * @dev Get confidence score for a project (returns multiplier * 100)
     * @param projectId ID of the project
     * @return usdcScore USDC confidence score
     * @return avaxScore AVAX confidence score
     */
    function getConfidenceScore(uint256 projectId) external view returns (uint256 usdcScore, uint256 avaxScore) {
        if (!projects[projectId].exists) return (0, 0);
        
        usdcScore = projects[projectId].totalUsdcBacking == 0 ? 0 : (totalUsdcPool * 100) / projects[projectId].totalUsdcBacking;
        avaxScore = projects[projectId].totalAvaxBacking == 0 ? 0 : (totalAvaxPool * 100) / projects[projectId].totalAvaxBacking;
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
     * @return usdcReward Expected USDC reward
     * @return avaxReward Expected AVAX reward
     */
    function calculateReward(address user) external view returns (uint256 usdcReward, uint256 avaxReward) {
        if (!eventSettled) return (0, 0);
        
        uint256 totalUsdcReward = 0;
        uint256 totalAvaxReward = 0;

        for (uint256 i = 0; i < winners.length; i++) {
            uint256 projectId = winners[i].projectId;
            uint256 percentage = winners[i].percentage;
            
            Backing memory userBacking = userBackings[user][projectId];
            
            if (!userBacking.claimed) {
                // USDC rewards
                if (userBacking.usdcAmount > 0) {
                    uint256 winnerTotalUsdcBacking = projects[projectId].totalUsdcBacking;
                    uint256 winnerUsdcPrizePool = (totalUsdcPool * percentage * (100 - PLATFORM_FEE_PERCENT)) / 10000;
                    uint256 reward = (userBacking.usdcAmount * winnerUsdcPrizePool) / winnerTotalUsdcBacking;
                    totalUsdcReward += reward;
                }

                // AVAX rewards
                if (userBacking.avaxAmount > 0) {
                    uint256 winnerTotalAvaxBacking = projects[projectId].totalAvaxBacking;
                    uint256 winnerAvaxPrizePool = (totalAvaxPool * percentage * (100 - PLATFORM_FEE_PERCENT)) / 10000;
                    uint256 reward = (userBacking.avaxAmount * winnerAvaxPrizePool) / winnerTotalAvaxBacking;
                    totalAvaxReward += reward;
                }
            }
        }

        return (totalUsdcReward, totalAvaxReward);
    }

    /**
     * @dev Withdraw platform fees (admin only)
     */
    function withdrawFees() external onlyOwner {
        if (!eventSettled) revert EventAlreadySettled();
        
        uint256 usdcFees = (totalUsdcPool * PLATFORM_FEE_PERCENT) / 100;
        uint256 avaxFees = (totalAvaxPool * PLATFORM_FEE_PERCENT) / 100;
        
        if (usdcFees > 0) {
            usdcToken.safeTransfer(owner(), usdcFees);
        }

        if (avaxFees > 0) {
            (bool success, ) = owner().call{value: avaxFees}("");
            if (!success) revert TransferFailed();
        }
    }

    /**
     * @dev Emergency refund mechanism if hackathon is cancelled
     * @notice Users can claim their full backing back if event not settled
     */
    function emergencyRefund() external nonReentrant whenPaused {
        if (eventSettled) revert CannotRefundAfterSettlement();
        
        uint256 totalUsdcRefund = 0;
        uint256 totalAvaxRefund = 0;

        // Refund all user backings across all projects
        for (uint256 i = 1; i <= projectCount; i++) {
            Backing storage userBacking = userBackings[msg.sender][i];
            if (!userBacking.claimed && (userBacking.usdcAmount > 0 || userBacking.avaxAmount > 0)) {
                totalUsdcRefund += userBacking.usdcAmount;
                totalAvaxRefund += userBacking.avaxAmount;
                userBacking.claimed = true; // Mark as claimed to prevent double refund
            }
        }

        if (totalUsdcRefund == 0 && totalAvaxRefund == 0) revert NoBackingToRefund();

        // Transfer USDC refund
        if (totalUsdcRefund > 0) {
            usdcToken.safeTransfer(msg.sender, totalUsdcRefund);
        }

        // Transfer AVAX refund
        if (totalAvaxRefund > 0) {
            (bool success, ) = msg.sender.call{value: totalAvaxRefund}("");
            if (!success) revert TransferFailed();
        }

        emit RewardClaimed(msg.sender, totalUsdcRefund, totalAvaxRefund);
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
