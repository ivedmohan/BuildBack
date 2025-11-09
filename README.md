# BuildBack 🚀

**Community-driven hackathon crowdfunding platform on Avalanche**

BuildBack is a prediction market meets crowdfunding platform where supporters fund builders directly while predicting hackathon winners. It's less gambling, more community-driven funding for innovation.

## 🎯 How It Works

1. **Builders Register** - Project teams submit their hackathon projects
2. **Admin Approves** - Hackathon organizers review and approve submissions
3. **Community Supports** - Users fund projects with USDC or AVAX
   - 💰 **10% goes directly to the project creator** (instant funding)
   - 🏆 **88% goes to the prize pool** (for supporters of winners)
   - 🔧 **2% platform fee** (helps maintain BuildBack)
4. **Admin Declares Winners** - After the hackathon, organizers settle results
5. **Supporters Claim Rewards** - If you supported winning projects, claim your share!

## ✨ Key Features

- **Dual Token Support**: Back projects with USDC or AVAX
- **Multiple Winners**: Prize pool can be split across multiple projects
- **Direct Developer Funding**: 10% of contributions go straight to builders
- **Admin Controlled Phases**: Manual control over registration, backing, and settlement
- **Emergency Refunds**: Built-in safety mechanism if hackathon is cancelled
- **Transparent & On-Chain**: All transactions on Avalanche Fuji testnet

## 🏗️ Architecture

### Smart Contracts
- **BuildBack.sol** - Main hackathon contract with dual-token rewards
- **BuildBackFactory.sol** - Factory for creating multiple hackathon instances
- Built with Solidity 0.8.20 + OpenZeppelin 5.0.0

### Frontend
- **React 18 + Vite** - Modern, fast development
- **Wagmi v2 + RainbowKit** - Web3 wallet integration
- **Shadcn UI + Tailwind** - Beautiful, accessible components
- **Framer Motion** - Smooth animations

## 📦 Deployed Contracts (Avalanche Fuji)

- **Factory Address**: `0x3B2510eB4F0208eF58d045F7Bcd16669842f9fBa`
- **USDC Address**: `0x5425890298aed601595a70AB815c96711a31Bc65`
- **Chain ID**: `43113`

## 🚀 Getting Started

### Prerequisites

```bash
Node.js v18+
pnpm or npm
```

### Smart Contracts

```bash
cd contract
npm install
npx hardhat test              # Run tests
npx hardhat compile           # Compile contracts
npx hardhat run scripts/deploy-factory.ts --network fuji  # Deploy
```

### Frontend

```bash
cd frontend
pnpm install
pnpm dev                      # Start dev server (localhost:8080)
pnpm build                    # Build for production
```

## 🎮 Usage

### For Hackathon Organizers (Admin)

1. **Create Hackathon** - Deploy via factory or use existing
2. **Manage Projects**:
   - Approve submitted projects
   - Control registration phases
   - Enable/disable backing
3. **Settle Event** - Declare winners with percentage splits
4. **Withdraw Fees** - Claim 2% platform fee after settlement

### For Project Teams (Builders)

1. **Register Project** - Submit name + description
2. **Wait for Approval** - Admin reviews your submission
3. **Receive Funding** - Get 10% of all contributions instantly!
4. **Build** - Create your awesome project

### For Supporters (Community)

1. **Browse Hackathons** - View active events
2. **Support Projects** - Fund projects you believe in (USDC or AVAX)
   - 10% goes to builder
   - 88% to prize pool
3. **Claim Rewards** - If your projects win, claim your share!

## 🧪 Testing

All 26 tests passing ✅

```bash
cd contract
npx hardhat test

# Output:
# ✓ Project registration
# ✓ USDC backing with developer share
# ✓ AVAX backing with developer share
# ✓ Multiple winners settlement
# ✓ Reward calculations
# ✓ Emergency refunds
# ✓ Fee withdrawals
```

## 🔒 Security Features

- **ReentrancyGuard** - Prevents reentrancy attacks
- **Pausable** - Emergency stop mechanism
- **Ownable** - Admin-only functions
- **SafeERC20** - Safe token transfers
- **Input Validation** - Strict checks on all parameters

## 📊 Distribution Breakdown

When you support a project with **100 USDC**:

```
→ 10 USDC  → Project Creator (instant)
→ 88 USDC  → Prize Pool (for winners' supporters)
→ 2 USDC   → Platform Fee
```

If the project wins **50% of the prize pool**:
- All supporters of that project split their share proportionally
- You can claim your rewards after settlement

## 🌐 Live Demo

**Frontend**: https://buildback-qln7uzbtw-ved-mohans-projects-486ed2df.vercel.app

**Testnet**: Avalanche Fuji
- Get testnet AVAX: https://core.app/tools/testnet-faucet/
- Get testnet USDC: https://core.app/tools/testnet-faucet/?token=usdc

## 📝 Smart Contract Functions

### User Functions
- `registerProject(name, description)` - Submit your project
- `backProject(projectId, amount)` - Support with USDC
- `backProjectWithAVAX(projectId)` - Support with AVAX
- `claimReward()` - Claim winnings if you backed winners
- `emergencyRefund()` - Get funds back if hackathon cancelled

### Admin Functions (Owner Only)
- `approveProject(projectId)` - Approve submitted projects
- `enableBacking()` / `disableBacking()` - Control backing phase
- `closeRegistration()` - Close project submissions
- `settleEvent(Winner[])` - Declare winners with %splits
- `withdrawFees()` - Claim 2% platform fees
- `pause()` / `unpause()` - Emergency controls

## 🛠️ Tech Stack

**Smart Contracts**:
- Solidity 0.8.20
- Hardhat
- OpenZeppelin Contracts 5.0.0
- TypeScript

**Frontend**:
- React 18
- Vite 5.4
- Wagmi v2
- RainbowKit 2.2
- Shadcn UI
- Tailwind CSS
- Framer Motion

**Blockchain**:
- Avalanche Fuji Testnet
- USDC (6 decimals)
- Native AVAX (18 decimals)

## 📄 License

MIT

## 🤝 Contributing

Contributions welcome! Please feel free to submit a Pull Request.

## 📧 Contact

- GitHub: [@ivedmohan](https://github.com/ivedmohan)
- Repository: [BuildBack](https://github.com/ivedmohan/BuildBack)

---

**Built with ❤️ for the builder community**
