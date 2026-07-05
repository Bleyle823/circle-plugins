import { motion } from "framer-motion";

const useCases = [
  {
    number: "01",
    title: "Meeting prep",
    description: "Pull company briefs, profile research, and recent social media activity for meeting preparation",
    cost: "~$0.10",
    calls: "2 calls"
  },
  {
    number: "02",
    title: "Domain discovery",
    description: "Search domain availability across multiple TLDs with pricing information",
    cost: "~$0.30",
    calls: "1 call"
  },
  {
    number: "03",
    title: "Research & Analytics",
    description: "Access real-time data, academic papers, and market analysis APIs",
    cost: "~$0.02",
    calls: "2 calls"
  },
  {
    number: "04",
    title: "Crypto Trading",
    description: "Analyze positions, track wallet behavior, and execute DeFi strategies",
    cost: "~$0.04",
    calls: "1 call"
  }
];

export function UseCasesSection() {
  return (
    <section className="px-8 md:px-14 py-24 md:py-32 border-t border-white/5 bg-white/[0.01]">
      <div className="mx-auto max-w-6xl">
        <h2 className="text-[clamp(1.8rem,3.5vw,3rem)] leading-tight font-light tracking-tight text-white text-center mb-16">
          With USDC, agents gain new abilities.
        </h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {useCases.map((uc, i) => (
            <motion.div
              key={uc.number}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              className="bg-white/[0.03] border border-white/10 rounded-sm p-8 hover:-translate-y-1 transition-all"
            >
              <div className="text-2xl font-light text-accent-blue mb-4">{uc.number}</div>
              <h3 className="text-lg font-medium text-white mb-4">{uc.title}</h3>
              <p className="text-white/60 text-sm mb-6 leading-relaxed">{uc.description}</p>
              <div className="flex items-center gap-2 text-accent-blue font-mono text-xs">
                {uc.cost}
                <span className="text-white/30 font-normal">{uc.calls}</span>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
