import { AnimatePresence, motion, useMotionValue, useSpring, useTransform } from "framer-motion";
import { Copy, Github } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { NPM_CORE_URL, REPO_URL } from "@/lib/links";
import { WavePattern } from "./WavePattern";

const phrases = [
  { verb: "send", tail: "USDC from any agent chat." },
  { verb: "pay", tail: "for APIs with x402 nanopayments." },
  { verb: "fund", tail: "wallets on Arc in one prompt." },
  { verb: "bridge", tail: "USDC across chains with CCTP." },
  { verb: "hold", tail: "a Circle wallet on Eliza, OpenClaw, or Hermes." },
];

export function Hero() {
  const [i, setI] = useState(0);
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const t = setInterval(() => setI((p) => (p + 1) % phrases.length), 3200);
    return () => clearInterval(t);
  }, []);

  // Cursor tracking (normalized -0.5 .. 0.5)
  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  const smx = useSpring(mx, { stiffness: 60, damping: 20, mass: 0.6 });
  const smy = useSpring(my, { stiffness: 60, damping: 20, mass: 0.6 });

  // Parallax transforms at various depths
  const waveX = useTransform(smx, (v) => v * -40);
  const waveY = useTransform(smy, (v) => v * -25);
  const orb1X = useTransform(smx, (v) => v * 80);
  const orb1Y = useTransform(smy, (v) => v * 60);
  const orb2X = useTransform(smx, (v) => v * -120);
  const orb2Y = useTransform(smy, (v) => v * -90);
  const headingX = useTransform(smx, (v) => v * 12);
  const headingY = useTransform(smy, (v) => v * 8);

  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;
    const onMove = (e: MouseEvent) => {
      const r = el.getBoundingClientRect();
      mx.set((e.clientX - r.left) / r.width - 0.5);
      my.set((e.clientY - r.top) / r.height - 0.5);
    };
    const onLeave = () => {
      mx.set(0);
      my.set(0);
    };
    el.addEventListener("mousemove", onMove);
    el.addEventListener("mouseleave", onLeave);
    return () => {
      el.removeEventListener("mousemove", onMove);
      el.removeEventListener("mouseleave", onLeave);
    };
  }, [mx, my]);

  const current = phrases[i];

  return (
    <section
      id="top"
      ref={sectionRef}
      className="relative min-h-[92vh] px-8 md:px-14 pt-40 pb-24 overflow-hidden"
    >
      {/* Ambient glow orbs that drift with the cursor */}
      <motion.div
        aria-hidden
        style={{ x: orb2X, y: orb2Y }}
        className="pointer-events-none absolute -top-40 -left-40 h-[520px] w-[520px] rounded-full opacity-40 blur-3xl"
      >
        <div className="h-full w-full rounded-full bg-[radial-gradient(circle_at_center,rgba(127,180,255,0.35),transparent_65%)]" />
      </motion.div>
      <motion.div
        aria-hidden
        style={{ x: orb1X, y: orb1Y }}
        className="pointer-events-none absolute top-1/3 right-[-10%] h-[420px] w-[420px] rounded-full opacity-50 blur-3xl"
      >
        <div className="h-full w-full rounded-full bg-[radial-gradient(circle_at_center,rgba(56,120,220,0.35),transparent_65%)]" />
      </motion.div>

      {/* Wave pattern with subtle parallax drift */}
      <motion.div
        style={{ x: waveX, y: waveY }}
        className="pointer-events-none absolute inset-y-0 right-0 w-[75%]"
      >
        <WavePattern className="w-full h-full opacity-90" />
      </motion.div>

      <motion.div style={{ x: headingX, y: headingY }} className="relative max-w-6xl">

        <div className="flex items-center gap-2 mb-10">
          {phrases.map((_, idx) => (
            <button
              key={idx}
              onClick={() => setI(idx)}
              className="group py-2"
              aria-label={`Show phrase ${idx + 1}`}
            >
              <motion.span
                animate={{
                  opacity: idx === i ? 1 : 0.3,
                  width: idx === i ? 34 : 20,
                }}
                transition={{ duration: 0.5, ease: [0.2, 0.7, 0.2, 1] }}
                className={`block h-[3px] rounded-full ${idx === i ? "bg-accent-blue" : "bg-white/25 group-hover:bg-white/50"}`}
              />
            </button>
          ))}
        </div>

        <h1 className="font-light tracking-[-0.02em] leading-[0.98] text-[clamp(2.4rem,6.5vw,5.5rem)] min-h-[2.4em]">
          <span className="block text-white">
            Circle Plugins to enable AI agents to{" "}
            <span className="relative inline-block align-baseline">
              <AnimatePresence mode="wait">
                <motion.span
                  key={current.verb}
                  initial={{ opacity: 0, y: "0.4em" }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: "-0.4em" }}
                  transition={{ duration: 0.55, ease: [0.2, 0.7, 0.2, 1] }}
                  className="inline-block text-accent-blue"
                >
                  {current.verb}
                </motion.span>
              </AnimatePresence>
            </span>
          </span>
          <span className="block text-accent-blue relative overflow-hidden">
            <AnimatePresence mode="wait">
              <motion.span
                key={current.tail}
                initial={{ opacity: 0, y: "0.4em" }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: "-0.4em" }}
                transition={{ duration: 0.6, delay: 0.05, ease: [0.2, 0.7, 0.2, 1] }}
                className="inline-block"
              >
                {current.tail}
              </motion.span>
            </AnimatePresence>
          </span>
        </h1>

        <p className="mt-8 text-xl text-white/60 max-w-2xl leading-relaxed">
          Open source plugins for ElizaOS, OpenClaw, and Hermes — powered by{" "}
          <a
            href={NPM_CORE_URL}
            target="_blank"
            rel="noreferrer"
            className="text-white/85 font-mono text-[17px] hover:text-accent-blue transition"
          >
            @circle-plugins/core
          </a>{" "}
          on npm.
        </p>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.5 }}
          className="mt-14 flex flex-wrap items-center gap-4"
        >
          <a
            href={REPO_URL}
            target="_blank"
            rel="noreferrer"
            className="group inline-flex items-center gap-3 rounded-sm bg-panel text-panel-foreground px-5 py-3 text-mono text-[13px] tracking-wide shadow-[0_0_0_1px_rgba(255,255,255,0.06)] hover:bg-white transition"
          >
            <Github className="h-4 w-4" />
            github.com/Bleyle823/circle-plugins
          </a>
          <a
            href={NPM_CORE_URL}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-2 text-mono text-[13px] tracking-wide text-white/90 border-b border-white/50 pb-1 hover:text-accent-blue hover:border-accent-blue transition"
          >
            <Copy className="h-3.5 w-3.5" />
            npm i @circle-plugins/core
          </a>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.9 }}
          className="mt-10 flex flex-wrap items-center gap-x-5 gap-y-3 text-mono text-[11px] tracking-[0.2em] text-white/60"
        >
          <span>WORKS WITH</span>
          <Chip label="ELIZAOS" glyph="✳" />
          <Chip label="OPENCLAW" glyph="◎" />
          <Chip label="HERMES" glyph="◼" />
          <Chip label="AI TOWN" glyph="◇" />
        </motion.div>
      </motion.div>

    </section>
  );
}


function Chip({ label, glyph }: { label: string; glyph: string }) {
  return (
    <span className="inline-flex items-center gap-2 text-white/80">
      <span className="text-accent-blue">{glyph}</span>
      {label}
    </span>
  );
}
