# BuildBack Smart Contracts

Community-driven hackathon project backing platform on Avalanche.

## Overview

BuildBack uses a factory pattern to deploy isolated hackathon events where:
- Projects register and get approved by admins
- Community backs projects with USDC (not ETH)
- **Multiple winners supported** (1st, 2nd, 3rd place with custom percentages)
- Winners are determined by hackathon judges
- Backers of winning projects earn USDC rewards proportional to their backing

## Key Features

✅ **USDC-based backing** (6 decimals, minimum 1 USDC)
✅ **Multiple winners** with custom prize distribution (e.g., 50% 1st, 30% 2nd, 20% 3rd)
✅ Project approval system (prevents spam)
✅ Pausable (emergency safety)
✅ Factory pattern (scalable)
✅ Gas-optimized with custom errors
✅ Built with OpenZeppelin security standards

## Contracts

- `BuildBackFactory.sol` - Factory for creating hackathon events
- `BuildBack.sol` - Individual hackathon backing contract with USDC support

## Setup

```bash
npm install
cp .env.example .env
# Edit .env with your private key and USDC address
```

## Deploy to Avalanche Fuji

```bash
npm run deploy:fuji
```

## Get Testnet USDC

Visit: https://core.app/tools/testnet-faucet/?token=usdc

## Verify on Snowtrace

```bash
npx hardhat verify --network fuji <FACTORY_ADDRESS> "0x5425890298aed601595a70AB815c96711a31Bc65"
```

## Changes from Reference

1. **USDC instead of ETH**: Uses ERC20 USDC for all transactions
2. **Multiple winners**: `settleEvent()` now accepts array of winners with percentages
3. **Avalanche Fuji**: Deployed on Avalanche testnet instead of Base
4. **Prize distribution**: Rewards calculated per winner based on percentage allocation

## Local Testing

```bash
npm test
```
