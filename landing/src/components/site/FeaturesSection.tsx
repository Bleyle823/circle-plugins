import { motion } from "framer-motion";
import { Wallet, Repeat, Zap, Store, ShieldCheck, Link2 } from "lucide-react";

const features = [
  {
    title: "Agent Wallets",
    description: "Create and manage developer-controlled wallets on Arc Testnet with USDC as gas",
    icon: Wallet,
    items: ["Wallet creation & management", "Balance checking", "Multi-chain support"]
  },
  {
    title: "DeFi Operations",
    description: "Execute complex DeFi operations using Circle's official App Kit integration",
    icon: Repeat,
    items: ["Cross-chain CCTP bridges", "Token swaps via DEX aggregators", "Smart contract execution"]
  },
  {
    title: "x402 Nanopayments",
    description: "Gas-free, sub-cent USDC payments for API access and micro-transactions",
    icon: Zap,
    items: ["Gateway balance management", "Automatic payment negotiation", "Pay-per-call APIs"]
  },
  {
    title: "Marketplace Discovery",
    description: "Find and pay for services in the Circle Agent Marketplace",
    icon: Store,
    items: ["Service search & inspection", "Price & schema validation", "Seamless payment integration"]
  },
  {
    title: "Security & Guardrails",
    description: "Built-in protection for mainnet operations and large transactions",
    icon: ShieldCheck,
    items: ["Confirmation requirements", "Amount thresholds", "Network validation"]
  },
  {
    title: "Payment Requests",
    description: "Generate EIP-681 payment URIs and QR codes for receiving USDC",
    icon: Link2,
    items: ["EIP-681 URI generation", "QR code support", "Custom memos"]
  }
];

export function FeaturesSection() {
  return (
    <section id="features" className="px-8 md:px-14 py-24 md:py-32 border-t border-white/5">
      <div className="mx-auto max-w-6xl">
        <h2 className="text-[clamp(1.8rem,3.5vw,3rem)] leading-tight font-light tracking-tight text-white text-center mb-16">
          Unlock what your agent can do.
        </h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, i) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.05 }}
              className="bg-white/[0.03] border border-white/10 rounded-sm p-8 hover:border-accent-blue/50 transition-all duration-300"
            >
              <feature.icon className="w-8 h-8 text-accent-blue mb-6" />
              <h3 className="text-xl font-medium text-white mb-4">{feature.title}</h3>
              <p className="text-white/60 mb-6 text-sm leading-relaxed">{feature.description}</p>
              <ul className="space-y-3">
                {feature.items.map((item) => (
                  <li key={item} className="flex items-center gap-2 text-white/50 text-xs">
                    <span className="text-accent-blue font-bold">✓</span>
                    {item}
                  </li>
                ))}
              </ul>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
