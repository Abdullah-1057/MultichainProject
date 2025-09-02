import { Navigation } from "@/components/navigation"
import { FeaturesSection } from "@/components/features-section"
import { Footer } from "@/components/footer"

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
          <div className="text-center py-12">
            <h2 className="text-2xl font-semibold mb-4">Application is being updated</h2>
            <p className="text-muted-foreground">
              We're fixing some issues and will be back online shortly. 
              Thank you for your patience!
            </p>
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
