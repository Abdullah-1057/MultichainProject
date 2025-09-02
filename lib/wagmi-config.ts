import { createConfig, http } from 'wagmi'
import { mainnet, polygon, arbitrum, optimism, sepolia } from 'wagmi/chains'
import { injected, walletConnect, coinbaseWallet } from 'wagmi/connectors'

// Get project ID from environment variables
const projectId = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || 'your-project-id'

export const config = createConfig({
  chains: [mainnet, polygon, arbitrum, optimism, sepolia],
  connectors: [
    injected(),
    walletConnect({
      projectId,
      showQrModal: true,
    }),
    coinbaseWallet({
      appName: 'FundFlow',
      appLogoUrl: '/placeholder-logo.png',
    }),
  ],
  transports: {
    [mainnet.id]: http(),
    [polygon.id]: http(),
    [arbitrum.id]: http(),
    [optimism.id]: http(),
    [sepolia.id]: http(),
  },
})

export const chains = [mainnet, polygon, arbitrum, optimism, sepolia]

