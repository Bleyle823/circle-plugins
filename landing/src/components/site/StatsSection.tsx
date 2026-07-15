import { motion } from "framer-motion";

const stats = [
  { value: "0.1.0", label: "@circle-plugins/core on npm" },
  { value: "8", label: "ElizaOS actions" },
  { value: "26", label: "OpenClaw tools" },
  { value: "15", label: "Hermes tools" },
];

export function StatsSection() {
  return (
    <section className="px-8 md:px-14 py-24 md:py-32 border-t border-white/5">
      <div className="mx-auto max-w-6xl">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-12">
          {stats.map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              className="text-center"
            >
              <div className="text-4xl md:text-5xl font-light text-accent-blue mb-4">{stat.value}</div>
              <div className="text-white/50 text-[10px] md:text-xs font-mono tracking-[0.2em] uppercase">
                {stat.label}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
