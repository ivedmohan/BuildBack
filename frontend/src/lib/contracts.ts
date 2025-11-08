export const FACTORY_ADDRESS = '0x730B769843216e73e1A0B488635642a64a401503' as const;
export const USDC_ADDRESS = '0x5425890298aed601595a70AB815c96711a31Bc65' as const;

export const FACTORY_ABI = [
  'function createHackathon(string name, string description, uint256 startTime, uint256 endTime) external returns (address)',
  'function getAllHackathons() external view returns (address[])',
  'function getHackathonCount() external view returns (uint256)',
  'function isHackathon(address) external view returns (bool)',
  'event HackathonCreated(address indexed hackathonAddress, string name, string description, uint256 startTime, uint256 endTime, address indexed creator)'
] as const;

export const USDC_ABI = [
  'function approve(address spender, uint256 amount) external returns (bool)',
  'function allowance(address owner, address spender) external view returns (uint256)',
  'function balanceOf(address account) external view returns (uint256)',
  'function decimals() external view returns (uint8)',
  'function symbol() external view returns (string)',
  'function transfer(address to, uint256 amount) external returns (bool)'
] as const;

export const BUILDBACK_ABI = [
  'function registerProject(string name, string description) external',
  'function approveProject(uint256 projectId) external',
  'function backProject(uint256 projectId, uint256 usdcAmount) external',
  'function backProjectWithAVAX(uint256 projectId) external payable',
  'function closeRegistration() external',
  'function enableBacking() external',
  'function disableBacking() external',
  'function settleEvent(tuple(uint256 projectId, uint256 percentage)[] winners) external',
  'function claimReward() external',
  'function withdrawFees() external',
  'function pause() external',
  'function unpause() external',
  'function getAllProjects() external view returns (tuple(uint256 id, string name, string description, address creator, uint256 totalUsdcBacking, uint256 totalAvaxBacking, bool exists, bool approved)[])',
  'function getProjectDetails(uint256 projectId) external view returns (tuple(uint256 id, string name, string description, address creator, uint256 totalUsdcBacking, uint256 totalAvaxBacking, bool exists, bool approved))',
  'function getUserBacking(address user, uint256 projectId) external view returns (tuple(uint256 usdcAmount, uint256 avaxAmount, bool claimed))',
  'function calculateReward(address user) external view returns (uint256 usdcReward, uint256 avaxReward)',
  'function getConfidenceScore(uint256 projectId) external view returns (uint256 usdcScore, uint256 avaxScore)',
  'function getHackathonDetails() external view returns (tuple(string name, string description, uint256 startTime, uint256 endTime, bool created))',
  'function getAllWinners() external view returns (tuple(uint256 projectId, uint256 percentage)[])',
  'function totalUsdcPool() external view returns (uint256)',
  'function totalAvaxPool() external view returns (uint256)',
  'function projectCount() external view returns (uint256)',
  'function winners(uint256) external view returns (uint256 projectId, uint256 percentage)',
  'function registrationOpen() external view returns (bool)',
  'function backingAllowed() external view returns (bool)',
  'function eventSettled() external view returns (bool)',
  'function owner() external view returns (address)',
  'event ProjectRegistered(uint256 indexed projectId, string name, address indexed creator)',
  'event ProjectApproved(uint256 indexed projectId)',
  'event ProjectBackedWithUSDC(address indexed backer, uint256 indexed projectId, uint256 amount)',
  'event ProjectBackedWithAVAX(address indexed backer, uint256 indexed projectId, uint256 amount)',
  'event BackingEnabled()',
  'event BackingDisabled()',
  'event EventSettled(tuple(uint256 projectId, uint256 percentage)[] winners)',
  'event RewardClaimed(address indexed user, uint256 usdcAmount, uint256 avaxAmount)'
] as const;

