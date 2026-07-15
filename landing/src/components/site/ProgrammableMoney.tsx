import { motion } from "framer-motion";

export function ProgrammableMoney() {
  const price = "10⁻⁶ USDC";
  return (
    <section className="px-8 md:px-14 py-32 md:py-40 border-t border-white/5">
      <div className="mx-auto grid max-w-6xl grid-cols-1 md:grid-cols-2 gap-16 md:gap-24 items-start">
        <div>
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
            className="text-[clamp(2.2rem,4.5vw,4rem)] leading-[1.05] font-light tracking-tight text-white"
          >
            Programmable money,
            <br />
            designed for agents.
          </motion.h2>

          <div className="mt-14 space-y-10 max-w-lg">
            {[
              { h: "Sub-cent efficiency.", p: "Gas-free nanopayments starting at $0.000001." },
              { h: "Headless APIs.", p: "Agents paying agents for work too small to invoice." },
              { h: "Unified SDK.", p: "@circle-plugins/core@0.1.0 on npm — one kit for ElizaOS, OpenClaw, Hermes, and AI Town." },
              { h: "Arc Testnet.", p: "Developer-controlled wallets with USDC as gas." },
            ].map((b, i) => (
              <motion.div
                key={b.h}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
              >
                <h3 className="text-xl font-medium text-white">{b.h}</h3>
                <p className="mt-2 text-mono text-[13px] text-white/60">{b.p}</p>
              </motion.div>
            ))}
          </div>
        </div>

        <div className="flex items-center justify-center md:justify-start md:pt-8">
          <div className="text-[clamp(3rem,7vw,6rem)] font-light tracking-tight leading-none text-white/40">
            {price.split("").map((ch, i) => (
              <motion.span
                key={i}
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.35, delay: i * 0.08 }}
                style={{
                  color:
                    i >= price.length - 4
                      ? "var(--accent-blue)"
                      : i >= price.length - 7
                        ? "rgba(255,255,255,0.7)"
                        : undefined,
                }}
              >
                {ch}
              </motion.span>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
