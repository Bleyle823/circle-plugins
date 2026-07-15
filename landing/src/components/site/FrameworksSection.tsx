import { motion } from "framer-motion";
import { Brain, Cpu, Package, Terminal } from "lucide-react";
import { NPM_CORE_URL, REPO_URL } from "@/lib/links";

const frameworks = [
  {
    name: "@circle-plugins/core",
    description:
      "Published TypeScript SDK on npm — wallets, USDC transfers, x402 nanopayments, faucet, and payment requests on Arc.",
    tech: "npm · v0.1.0",
    icon: Package,
    href: NPM_CORE_URL,
  },
  {
    name: "ElizaOS",
    description:
      "@circle-plugins/plugin-eliza — 8 actions for agent wallets. Demoed in AI Town with the published core.",
    tech: "TypeScript",
    icon: Brain,
    href: `${REPO_URL}/tree/main/plugin-eliza`,
  },
  {
    name: "OpenClaw",
    description:
      "@circle-plugins/plugin-openclaw — 26 agent tools (send, bridge, swap, x402, Agent Stack CLI) on core@0.1.0.",
    tech: "TypeScript",
    icon: Cpu,
    href: `${REPO_URL}/tree/main/plugin-openclaw`,
  },
  {
    name: "Hermes Agent",
    description:
      "hermes/circle-plugins — 15 Python tools mirroring the TypeScript kit for Hermes Agent.",
    tech: "Python",
    icon: Terminal,
    href: `${REPO_URL}/tree/main/hermes/circle-plugins`,
  },
];

export function FrameworksSection() {
  return (
    <section id="frameworks" className="px-8 md:px-14 py-24 md:py-32 border-t border-white/5 bg-white/[0.01]">
      <div className="mx-auto max-w-6xl">
        <h2 className="text-[clamp(1.8rem,3.5vw,3rem)] leading-tight font-light tracking-tight text-white text-center mb-4">
          One core. Three agent frameworks.
        </h2>
        <p className="text-center text-white/50 text-[15px] mb-16 max-w-2xl mx-auto">
          Everything lives in{" "}
          <a
            href={REPO_URL}
            target="_blank"
            rel="noreferrer"
            className="text-accent-blue hover:underline font-mono text-[13px]"
          >
            Bleyle823/circle-plugins
          </a>
          . Install{" "}
          <a
            href={NPM_CORE_URL}
            target="_blank"
            rel="noreferrer"
            className="text-accent-blue hover:underline font-mono text-[13px]"
          >
            @circle-plugins/core
          </a>{" "}
          once — plug into ElizaOS, OpenClaw, or Hermes.
        </p>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {frameworks.map((fw, i) => (
            <motion.a
              key={fw.name}
              href={fw.href}
              target={fw.href.startsWith("http") ? "_blank" : undefined}
              rel={fw.href.startsWith("http") ? "noreferrer" : undefined}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              className="group relative bg-white/[0.03] border border-white/10 rounded-sm p-7 hover:bg-white/[0.05] hover:border-accent-blue/40 transition-all duration-300 block"
            >
              <div className="w-11 h-11 bg-accent-blue/10 rounded-sm flex items-center justify-center mb-5 text-accent-blue">
                <fw.icon className="w-5 h-5" />
              </div>
              <h3 className="text-base font-medium text-white mb-3 font-mono tracking-tight break-all">
                {fw.name}
              </h3>
              <p className="text-white/60 mb-5 text-sm leading-relaxed">{fw.description}</p>
              <span className="inline-block bg-accent-blue/20 text-accent-blue px-3 py-1 rounded-full text-[10px] font-mono tracking-wider uppercase">
                {fw.tech}
              </span>
            </motion.a>
          ))}
        </div>
      </div>
    </section>
  );
}
