import { createConfig, http } from 'wagmi'
import { mainnet, polygon, arbitrum, optimism, sepolia, base } from 'wagmi/chains'
import { injected, walletConnect, coinbaseWallet } from 'wagmi/connectors'

// Get project ID from environment variables
const projectId = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || 'default-project-id'

export const config = createConfig({
  chains: [mainnet, polygon, arbitrum, optimism, sepolia, base],
  connectors: [
    injected(),
    walletConnect({
      projectId,
      showQrModal: true,
    }),
                coinbaseWallet({
              appName: 'FundFlow',
              appLogoUrl: '/placeholder-logo.png',
              enableMobileWalletLink: false,
            }),
  ],
  transports: {
    [mainnet.id]: http(),
    [polygon.id]: http(),
    [arbitrum.id]: http(),
    [optimism.id]: http(),
    [sepolia.id]: http(),
    [base.id]: http(),
  },
})

export const chains = [mainnet, polygon, arbitrum, optimism, sepolia, base]

