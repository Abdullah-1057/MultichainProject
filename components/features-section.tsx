import { Shield, Zap, Globe, Lock } from "lucide-react"

const features = [
  {
    icon: Shield,
    title: "Secure & Trusted",
    description: "Enterprise-grade security with multi-signature wallets and encrypted transactions."
  },
  {
    icon: Zap,
    title: "Lightning Fast",
    description: "Instant processing with automated smart contracts and real-time monitoring."
  },
  {
    icon: Globe,
    title: "Multi-Chain Support",
    description: "Seamlessly work with Bitcoin, Ethereum, Solana, and more blockchain networks."
  },
  {
    icon: Lock,
    title: "Privacy First",
    description: "Your funds and personal data are protected with advanced privacy protocols."
  }
]

export function FeaturesSection() {
  return (
    <section id="features" className="apple-section bg-background">
      <div className="apple-container">
        <div className="text-center space-y-4 mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-foreground tracking-tight">
            Why Choose FundFlow
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            Built for the future of decentralized finance with cutting-edge technology and user-first design.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {features.map((feature, index) => (
            <div key={index} className="text-center space-y-4">
              <div className="mx-auto w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center">
                <feature.icon className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-xl font-semibold text-foreground">{feature.title}</h3>
              <p className="text-muted-foreground leading-relaxed">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

