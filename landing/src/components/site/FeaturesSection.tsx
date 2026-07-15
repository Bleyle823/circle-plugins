import { motion } from "framer-motion";
import { Wallet, ArrowLeftRight, Zap, Droplets, ShieldCheck, Link2 } from "lucide-react";

const features = [
  {
    title: "Agent Wallets",
    description: "Create and manage developer-controlled wallets on Arc Testnet with USDC as gas.",
    icon: Wallet,
    items: ["createWallet / listWallets", "getUsdcBalance", "Arc Testnet default"],
  },
  {
    title: "USDC Transfers",
    description: "Send USDC with fee estimates, wait-for-confirmation, and idempotent mutating calls.",
    icon: ArrowLeftRight,
    items: ["sendUSDC", "estimateFee", "waitForTransaction"],
  },
  {
    title: "x402 Nanopayments",
    description: "Gas-free, sub-cent USDC payments via Circle Gateway for API access.",
    icon: Zap,
    items: ["payX402", "gatewayDeposit / Balance", "requirePayment"],
  },
  {
    title: "Testnet Faucet",
    description: "Self-serve testnet funding through Circle's faucet API or faucet.circle.com.",
    icon: Droplets,
    items: ["requestFaucet", "faucetInfo", "ARC-TESTNET ready"],
  },
  {
    title: "Guardrails",
    description: "Built-in protection for mainnet ops and large transfers before they hit the chain.",
    icon: ShieldCheck,
    items: ["confirm: true on mainnet", "100 USDC threshold", "Address / amount checks"],
  },
  {
    title: "Payment Requests",
    description: "Generate EIP-681 payment URIs so agents can request USDC from users.",
    icon: Link2,
    items: ["createPaymentRequest", "EIP-681 URI", "Invoice-style amounts"],
  },
];

export function FeaturesSection() {
  return (
    <section id="features" className="px-8 md:px-14 py-24 md:py-32 border-t border-white/5">
      <div className="mx-auto max-w-6xl">
        <h2 className="text-[clamp(1.8rem,3.5vw,3rem)] leading-tight font-light tracking-tight text-white text-center mb-4">
          What @circle-plugins/core unlocks.
        </h2>
        <p className="text-center text-white/50 text-[15px] mb-16 max-w-xl mx-auto">
          Same capability surface across ElizaOS, OpenClaw, Hermes, and custom agents.
        </p>
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
                  <li key={item} className="flex items-center gap-2 text-white/50 text-xs font-mono">
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
