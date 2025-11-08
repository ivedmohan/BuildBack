import { getDefaultConfig } from '@rainbow-me/rainbowkit';
import { avalancheFuji } from 'wagmi/chains';

export const config = getDefaultConfig({
  appName: 'BuildBack',
  projectId: import.meta.env.VITE_WALLETCONNECT_PROJECT_ID || 'e4a6a4fd5bdf6e73e4536d7ee0c5a242',
  chains: [avalancheFuji],
  ssr: false,
});
