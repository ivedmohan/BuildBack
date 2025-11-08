import { getDefaultConfig } from '@rainbow-me/rainbowkit';
import { avalancheFuji } from 'wagmi/chains';

export const config = getDefaultConfig({
  appName: 'BuildBack',
  projectId: import.meta.env.VITE_WALLETCONNECT_PROJECT_ID || 'YOUR_PROJECT_ID', // Get from WalletConnect Cloud
  chains: [avalancheFuji],
  ssr: false,
});
