import { motion } from "framer-motion";

const struck = ["KYC hurdles", "fiat on-ramps", "manual approvals", "session timeouts", "billing cycles"];

export function PaymentAuthSection() {
  return (
    <section className="px-8 md:px-14 py-32 md:py-40">
      <div className="mx-auto grid max-w-6xl grid-cols-1 md:grid-cols-2 gap-16 md:gap-24 items-start">
        <ul className="space-y-6 md:space-y-8 text-[clamp(1.6rem,3vw,2.4rem)] font-light text-white/40">
          {struck.map((s, i) => (
            <motion.li
              key={s}
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: "-80px" }}
              transition={{ duration: 0.5, delay: i * 0.08 }}
              className="relative w-fit"
            >
              <span className="relative">
                {s}
                <motion.span
                  initial={{ scaleX: 0 }}
                  whileInView={{ scaleX: 1 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: 0.15 + i * 0.08 }}
                  className="absolute left-0 top-1/2 h-[2px] w-full origin-left bg-white/50"
                />
              </span>
            </motion.li>
          ))}
        </ul>

        <div>
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
            className="text-[clamp(2.2rem,4.5vw,4rem)] leading-[1.05] font-light tracking-tight text-white"
          >
            x402: Payment as
            <br />
            authentication.
          </motion.h2>
          <div className="mt-10 space-y-6 text-mono text-[13px] leading-relaxed text-white/70 max-w-md">
            <p>
              Agents get stuck behind paywalls and authentication, halting workflows. x402 nanopayments 
              unlock doors for agents to work uninterrupted with gas-free, sub-cent USDC payments.
            </p>
            <p>Micro payments, macro results.</p>
          </div>
        </div>
      </div>
    </section>
  );
}
