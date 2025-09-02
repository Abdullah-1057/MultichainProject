import { Navigation } from "@/components/navigation"
import { FeaturesSection } from "@/components/features-section"
import { Footer } from "@/components/footer"
import { WalletConnector } from "@/components/wallet-connector"

export default function Home() {
  return (
    <main className="min-h-screen bg-background">
      <Navigation />
      
      {/* Header Section */}
      <header className="apple-section bg-background">
        <div className="apple-container">
          <div className="text-center space-y-6">
            <h1 className="text-5xl md:text-7xl font-bold text-foreground tracking-tight">
              Fund the Project
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              Send BTC, ETH, or SOL and receive reward tokens directly to your EVM wallet. 
              Simple, secure, and instant.
            </p>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <section className="apple-section bg-muted/30">
        <div className="apple-container space-y-8">
          <WalletConnector />
          
          <div className="text-center py-8">
            <h2 className="text-2xl font-semibold mb-4">Complete Flow Available</h2>
            <p className="text-muted-foreground mb-6">
              Connect your wallet to access the full funding interface with support for:
            </p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-2xl mx-auto">
              <div className="p-4 bg-white rounded-lg border">
                <div className="text-2xl mb-2">Ξ</div>
                <div className="text-sm font-medium">Ethereum</div>
                <div className="text-xs text-muted-foreground">ETH & USDC</div>
              </div>
              <div className="p-4 bg-white rounded-lg border">
                <div className="text-2xl mb-2">🔵</div>
                <div className="text-sm font-medium">Base</div>
                <div className="text-xs text-muted-foreground">ETH & USDC</div>
              </div>
              <div className="p-4 bg-white rounded-lg border">
                <div className="text-2xl mb-2">₿</div>
                <div className="text-sm font-medium">Bitcoin</div>
                <div className="text-xs text-muted-foreground">BTC</div>
              </div>
              <div className="p-4 bg-white rounded-lg border">
                <div className="text-2xl mb-2">◎</div>
                <div className="text-sm font-medium">Solana</div>
                <div className="text-xs text-muted-foreground">SOL & USDC</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <FeaturesSection />

      {/* Footer */}
      <Footer />
    </main>
  )
}
