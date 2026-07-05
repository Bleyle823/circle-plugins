import { motion } from "framer-motion";
import { Brain, Cpu, Terminal } from "lucide-react";

const frameworks = [
  {
    name: "ElizaOS",
    description: "TypeScript plugin with 13 actions for wallet management, DeFi operations, and marketplace access",
    tech: "TypeScript",
    icon: Brain
  },
  {
    name: "OpenClaw",
    description: "Compatible with ElizaOS plugin architecture for seamless agent integration",
    tech: "TypeScript",
    icon: Cpu
  },
  {
    name: "Hermes Agent",
    description: "Python plugin with mirrored functionality for cross-language compatibility",
    tech: "Python",
    icon: Terminal
  }
];

export function FrameworksSection() {
  return (
    <section id="frameworks" className="px-8 md:px-14 py-24 md:py-32 border-t border-white/5 bg-white/[0.01]">
      <div className="mx-auto max-w-6xl">
        <h2 className="text-[clamp(1.8rem,3.5vw,3rem)] leading-tight font-light tracking-tight text-white text-center mb-16">
          Works with your favorite AI framework.
        </h2>
        <div className="grid md:grid-cols-3 gap-8">
          {frameworks.map((fw, i) => (
            <motion.div
              key={fw.name}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              className="group relative bg-white/[0.03] border border-white/10 rounded-sm p-8 hover:bg-white/[0.05] transition-all duration-300"
            >
              <div className="w-12 h-12 bg-accent-blue/10 rounded-sm flex items-center justify-center mb-6 text-accent-blue">
                <fw.icon className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-medium text-white mb-4">{fw.name}</h3>
              <p className="text-white/60 mb-6 text-sm leading-relaxed">{fw.description}</p>
              <span className="inline-block bg-accent-blue/20 text-accent-blue px-3 py-1 rounded-full text-[10px] font-mono tracking-wider uppercase">
                {fw.tech}
              </span>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
