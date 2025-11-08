# BuildBack Smart Contracts

Community-driven hackathon project backing platform on Base.

## Overview

BuildBack uses a factory pattern to deploy isolated hackathon events where:
- Projects register and get approved by admins
- Community backs projects with ETH
- Winners are determined by hackathon judges
- Backers of winning projects earn rewards proportional to their backing

## Contracts

- `BuildBackFactory.sol` - Factory for creating hackathon events
- `BuildBack.sol` - Individual hackathon backing contract

## Features

✅ Project approval system (prevents spam)
✅ Pausable (emergency safety)
✅ Factory pattern (scalable)
✅ Gas-optimized with custom errors
✅ Built with OpenZeppelin security standards

## Setup

```bash
npm install
cp .env.example .env
# Edit .env with your private key
```

## Deploy to Base Sepolia

```bash
npm run deploy:base-sepolia
```

## Verify on Basescan

```bash
npx hardhat verify --network baseSepolia <FACTORY_ADDRESS>
```

## Local Testing

```bash
npm test
```
