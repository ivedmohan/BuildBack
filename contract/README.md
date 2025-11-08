# BuildBack Smart Contracts

Community-driven hackathon project backing platform on Avalanche.

## Overview

BuildBack uses a factory pattern to deploy isolated hackathon events where:
- Projects register and get approved by admins
- Community backs projects with **USDC or AVAX** (flexible payment options)
- **Multiple winners supported** (1st, 2nd, 3rd place with custom percentages)
- Winners are determined by hackathon judges
- Backers of winning projects earn rewards proportional to their backing

## Key Features

✅ **Dual-token support** - Back with USDC (6 decimals) OR native AVAX
✅ **Flexible payment** - Users without USDC can back with AVAX
✅ **Multiple winners** with custom prize distribution (e.g., 50% 1st, 30% 2nd, 20% 3rd)
✅ **Separate prize pools** - USDC and AVAX pools are independent
✅ Project approval system (prevents spam)
✅ Admin-controlled backing phases (no time restrictions for easier testing)
✅ Pausable (emergency safety with full refund)
✅ Factory pattern (scalable)
✅ Gas-optimized with custom errors
✅ Built with OpenZeppelin security standards

## Contracts

- `BuildBackFactory.sol` - Factory for creating hackathon events
- `BuildBack.sol` - Individual hackathon backing contract with dual-token support
- `MockUSDC.sol` - ERC20 mock for local testing (6 decimals)

## Backing Options

Users can back projects using either token:

1. **With USDC**: `backProject(projectId, amount)` - Requires USDC approval first
2. **With AVAX**: `backProjectWithAVAX(projectId)` - Send AVAX directly with transaction

Minimum amounts:
- USDC: 1 USDC (1e6)
- AVAX: 0.01 AVAX

## Reward Distribution

- USDC and AVAX pools are **separate**
- Each pool distributes rewards independently based on winner percentages
- Example: If Project A wins 50% and you backed it with both tokens:
  - You get your proportional share of 50% of the USDC pool
  - You get your proportional share of 50% of the AVAX pool
- Platform takes 2% fee from each pool

## Setup

```bash
npm install
cp .env.example .env
# Edit .env with your private key
```

## Deploy to Avalanche Fuji

```bash
npm run deploy:fuji
```

This deploys the BuildBackFactory with official Circle USDC address: `0x5425890298aed601595a70AB815c96711a31Bc65`

## Get Testnet Tokens

- **AVAX**: https://core.app/tools/testnet-faucet/
- **USDC**: https://core.app/tools/testnet-faucet/?token=usdc

## Contract Flow

1. **Admin creates hackathon** via factory
2. **Teams register projects**
3. **Admin approves projects** (spam prevention)
4. **Admin enables backing** (`enableBacking()`)
5. **Users back projects** with USDC and/or AVAX
6. **Admin disables backing** (`disableBacking()`)
7. **Admin closes registration** (`closeRegistration()`)
8. **Admin declares winners** with percentages (`settleEvent([{projectId: 1, percentage: 50}, ...])`)
9. **Users claim rewards** (`claimReward()`) - automatically receives both USDC and AVAX
10. **Admin withdraws fees** (`withdrawFees()`)

## Emergency Functions

- `pause()` - Admin can pause contract
- `emergencyRefund()` - Users get full refund (USDC + AVAX) if paused before settlement

## Verify on Snowtrace

```bash
npx hardhat verify --network fuji <FACTORY_ADDRESS> "0x5425890298aed601595a70AB815c96711a31Bc65"
```

## Changes from Reference

1. **Dual-token support**: Users can back with USDC OR AVAX (or both!)
2. **Multiple winners**: `settleEvent()` accepts array of winners with percentages
3. **Avalanche Fuji**: Deployed on Avalanche testnet instead of Base
4. **Admin phase controls**: Removed time-based validation for easier testing
5. **Separate pools**: USDC and AVAX prizes distributed independently
6. **Enhanced testing**: 26 comprehensive tests covering both tokens

## Local Testing

```bash
npm test
```

Tests cover:
- ✅ USDC-only backing
- ✅ AVAX-only backing
- ✅ Mixed backing (both tokens on same project)
- ✅ Multiple winners with percentage splits
- ✅ Reward calculations for both tokens
- ✅ Emergency refunds with both tokens
- ✅ Fee withdrawal with both tokens
