# Dual Token Support Upgrade

## Overview

BuildBack now supports **both USDC and AVAX** for backing projects! This makes the platform more accessible to users who don't have USDC tokens.

## What Changed?

### 1. New Backing Function

**Added `backProjectWithAVAX()`** - Users can now send native AVAX directly:

```solidity
function backProjectWithAVAX(uint256 projectId) external payable
```

Example usage:
```javascript
await hackathon.backProjectWithAVAX(1, { value: ethers.parseEther("1.0") });
```

### 2. Separate Prize Pools

- `totalUsdcPool` - Tracks all USDC backing
- `totalAvaxPool` - Tracks all AVAX backing

Each pool distributes rewards **independently** based on winner percentages.

### 3. Updated Data Structures

**Project struct now tracks both tokens:**
```solidity
struct Project {
    // ... other fields ...
    uint256 totalUsdcBacking;  // NEW
    uint256 totalAvaxBacking;  // NEW
}
```

**Backing struct stores both amounts:**
```solidity
struct Backing {
    uint256 usdcAmount;  // Changed from 'amount'
    uint256 avaxAmount;  // NEW
    bool claimed;
}
```

### 4. Enhanced Reward Claims

`claimReward()` now automatically sends both USDC and AVAX rewards:

```solidity
function claimReward() external nonReentrant whenNotPaused {
    // Calculates rewards from both pools
    // Transfers USDC if any
    // Transfers AVAX if any
    emit RewardClaimed(msg.sender, totalUsdcReward, totalAvaxReward);
}
```

### 5. Updated View Functions

**`getConfidenceScore(projectId)`** now returns both scores:
```solidity
function getConfidenceScore(uint256 projectId) 
    external view 
    returns (uint256 usdcScore, uint256 avaxScore)
```

**`calculateReward(user)`** now returns both rewards:
```solidity
function calculateReward(address user) 
    external view 
    returns (uint256 usdcReward, uint256 avaxReward)
```

### 6. Emergency Refunds

`emergencyRefund()` now refunds both USDC and AVAX if contract is paused.

### 7. Fee Withdrawal

`withdrawFees()` now withdraws platform fees from both pools.

## Minimum Backing Amounts

- **USDC**: 1 USDC (1e6 with 6 decimals)
- **AVAX**: 0.01 AVAX

## Example User Flow

### Scenario: User backs with both tokens

```javascript
// 1. User backs Project 1 with USDC
await usdc.approve(hackathonAddress, ethers.parseUnits("100", 6));
await hackathon.backProject(1, ethers.parseUnits("100", 6));

// 2. Same user backs Project 1 with AVAX
await hackathon.backProjectWithAVAX(1, { value: ethers.parseEther("1") });

// 3. Project 1 wins 50% of the prize
await hackathon.settleEvent([{ projectId: 1, percentage: 50 }]);

// 4. User claims rewards - gets both USDC and AVAX
await hackathon.claimReward();
```

## Reward Calculation Example

### Setup:
- Total USDC pool: 1000 USDC
- Total AVAX pool: 10 AVAX
- Project 1 wins 50%
- User backed Project 1 with:
  - 100 USDC (10% of Project 1's USDC backing)
  - 2 AVAX (20% of Project 1's AVAX backing)

### User's Rewards:
- **USDC**: 50% of 1000 USDC = 500 USDC prize pool
  - User gets 10% = 50 USDC (before 2% platform fee = 49 USDC)
- **AVAX**: 50% of 10 AVAX = 5 AVAX prize pool
  - User gets 20% = 1 AVAX (before 2% platform fee = 0.98 AVAX)

**Total Reward: 49 USDC + 0.98 AVAX**

## Testing

All 26 tests passing, including:

✅ USDC-only backing
✅ AVAX-only backing  
✅ Mixed backing (both tokens)
✅ Minimum amount enforcement
✅ Separate pool tracking
✅ Dual reward claims
✅ Emergency dual refunds
✅ Dual fee withdrawal

## Benefits

1. **Lower barrier to entry** - Users don't need USDC
2. **More flexible** - Back with any available token
3. **Risk diversification** - Can back with multiple tokens
4. **Native token support** - AVAX is always available
5. **Separate pools** - Each token economy independent

## Gas Considerations

- Backing with AVAX is **cheaper** (no ERC20 approval needed)
- Claiming rewards with both tokens costs ~same as claiming single token
- Emergency refunds handle both tokens in single transaction

## Frontend Integration

Frontend should:
1. Show both USDC and AVAX balance options
2. Allow users to choose which token(s) to back with
3. Display both pool sizes separately
4. Show expected rewards in both tokens
5. Handle native AVAX transactions with `{ value: amount }`

## Deployment

No changes to deployment process. Factory still requires USDC address:

```bash
npm run deploy:fuji
```

The USDC address is only used for USDC backing - AVAX backing works natively.

## Backward Compatibility

- Original `backProject()` function still works for USDC
- All existing USDC functionality preserved
- Frontend can gradually add AVAX support

## Security Notes

- ✅ ReentrancyGuard protects both token transfers
- ✅ SafeERC20 for USDC transfers
- ✅ Native AVAX transfer uses `call{value}` with success check
- ✅ Separate pool tracking prevents cross-contamination
- ✅ Emergency refunds return full amounts of both tokens
