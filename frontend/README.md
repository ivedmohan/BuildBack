# BuildBack - Hackathon Prediction Markets

> Back the projects you believe in. Earn rewards when they win.

BuildBack is a decentralized prediction market platform for hackathons built on Avalanche. Users can back projects they believe will win using AVAX, and earn proportional rewards from the prize pool if their predictions are correct.

## 🚀 Features

- **Wallet Integration**: Seamless wallet connection with RainbowKit
- **Browse Hackathons**: View all active hackathons and their details
- **Back Projects**: Support projects with AVAX tokens
- **Confidence Scores**: Real-time metrics showing community backing
- **Claim Rewards**: Automatically claim rewards when your backed project wins
- **Beautiful UI**: Glass morphism design with smooth animations

## 🛠 Tech Stack

- **Frontend**: React + Vite + TypeScript
- **Styling**: Tailwind CSS + Shadcn/ui
- **Web3**: wagmi v2 + viem + RainbowKit
- **Animations**: Framer Motion
- **Blockchain**: Avalanche Fuji Testnet

## 📋 Prerequisites

- Node.js 18+ and npm
- MetaMask or compatible Web3 wallet
- AVAX tokens on Fuji testnet ([Get from faucet](https://core.app/tools/testnet-faucet/?subnet=c&token=c))

## 🔧 Setup

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Configure WalletConnect**:
   - Get a project ID from [WalletConnect Cloud](https://cloud.walletconnect.com/)
   - Update `src/lib/wagmi.ts` with your project ID:
     ```typescript
     projectId: 'YOUR_PROJECT_ID',
     ```

3. **Start development server**:
   ```bash
   npm run dev
   ```

4. **Connect your wallet**:
   - Switch to Avalanche Fuji testnet in your wallet
   - Click "Connect Wallet" in the app

## 📝 Smart Contract Addresses

- **Factory**: `0x730B769843216e73e1A0B488635642a64a401503`
- **Network**: Avalanche Fuji (Chain ID: 43113)
- **Block Explorer**: [SnowTrace Testnet](https://testnet.snowtrace.io)

## 🎯 How It Works

1. **Connect Wallet**: Link your wallet to participate
2. **Browse Hackathons**: View active hackathons and registered projects
3. **Back Projects**: Support projects you believe will win with AVAX
4. **Earn Rewards**: Claim proportional rewards if your backed project wins

## 🏗 Project Structure

```
src/
├── components/
│   ├── Navbar.tsx              # Navigation with wallet connect
│   ├── WalletProvider.tsx      # Web3 provider setup
│   └── ui/                     # Shadcn UI components
├── lib/
│   ├── contracts.ts            # Smart contract ABIs & addresses
│   └── wagmi.ts                # Wagmi configuration
├── pages/
│   ├── Index.tsx               # Landing page
│   ├── Hackathons.tsx          # Browse all hackathons
│   ├── HackathonDetail.tsx     # View & back projects
│   └── Rewards.tsx             # View & claim rewards
└── index.css                   # Design system & styles
```

## 🎨 Design System

The app uses a custom design system with:
- **Primary**: Electric blue (#0EA5E9) for CTAs and highlights
- **Accent**: Emerald green (#10B981) for rewards and success states
- **Glass Morphism**: Translucent cards with backdrop blur
- **Smooth Animations**: Framer Motion for page transitions

## 🔗 Key Features Explained

### Confidence Scores
Shows what percentage of the total prize pool is backing each project, giving real-time sentiment.

### Dual Token Support
While the UI focuses on AVAX for simplicity, the smart contracts support both USDC and AVAX backing.

### Proportional Rewards
Winners receive rewards proportional to their backing amount compared to the total backing on winning projects.

## 📜 License

MIT

## 🙏 Acknowledgments

Built with Lovable, wagmi, and RainbowKit.
