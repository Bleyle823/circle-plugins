import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

type Step = { icon: string; label: string; price: string };
type Tab = {
  key: string;
  label: string;
  prompt: string;
  steps: Step[];
  done: React.ReactNode;
  panel: React.ReactNode;
};

const tabs: Tab[] = [
  {
    key: "eliza",
    label: "ELIZAOS",
    prompt: "npm install @circle-plugins/plugin-eliza @circle-plugins/core@0.1.0",
    steps: [
      { icon: "𝟭", label: "Install the plugin", price: "npm install" },
      { icon: "𝟮", label: "Configure environment", price: ".env" },
      { icon: "𝟯", label: "Register the plugin", price: "config.ts" },
    ],
    done: (
      <>
        Done. Plugin registered. 8 actions available.
      </>
    ),
    panel: <ElizaPanel />,
  },
  {
    key: "openclaw",
    label: "OPENCLAW",
    prompt: "pnpm add @circle-plugins/plugin-openclaw @circle-plugins/core@0.1.0",
    steps: [
      { icon: "𝟭", label: "Add the dependency", price: "pnpm add" },
      { icon: "𝟮", label: "Configure environment", price: ".env" },
      { icon: "𝟯", label: "Enable the plugin", price: "config.json" },
    ],
    done: <>Done. OpenClaw tools active. 26 tools registered.</>,
    panel: <OpenClawPanel />,
  },
  {
    key: "hermes",
    label: "HERMES",
    prompt: "pip install circle-plugins[circle]",
    steps: [
      { icon: "𝟭", label: "Install the Python core", price: "pip install" },
      { icon: "𝟮", label: "Copy the Hermes plugin", price: "hermes/circle-plugins" },
      { icon: "𝟯", label: "Configure and use", price: "export" },
    ],
    done: <>Done. Hermes tools active. 15 tools mirrored.</>,
    panel: <HermesPanel />,
  },
  {
    key: "core",
    label: "CORE SDK",
    prompt: "npm install @circle-plugins/core@0.1.0",
    steps: [
      { icon: "𝟭", label: "Install TypeScript core", price: "npm install" },
      { icon: "𝟮", label: "Initialize the kit", price: "CircleAgentKit.create()" },
      { icon: "𝟯", label: "Start building", price: "kit.createWallet()" },
    ],
    done: <>Done. SDK initialized. Ready for agentic payments.</>,
    panel: <CorePanel />,
  },
];

export function UnlockSection() {
  const [active, setActive] = useState(0);
  const tab = tabs[active];

  // Progressive reveal of steps
  const [visibleSteps, setVisibleSteps] = useState(0);
  const [done, setDone] = useState(false);

  useEffect(() => {
    setVisibleSteps(0);
    setDone(false);
    const timers: ReturnType<typeof setTimeout>[] = [];
    tab.steps.forEach((_, i) => {
      timers.push(setTimeout(() => setVisibleSteps(i + 1), 550 + i * 700));
    });
    timers.push(setTimeout(() => setDone(true), 700 + tab.steps.length * 700));
    return () => timers.forEach(clearTimeout);
  }, [active, tab.steps]);

  return (
    <section id="getting-started" className="px-8 md:px-14 py-24 md:py-32 border-t border-white/5">
      <div className="mx-auto max-w-6xl">
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-8 mb-14">
          <h2 className="text-[clamp(1.8rem,3.5vw,3rem)] leading-tight font-light tracking-tight text-white max-w-xl">
            Get started in minutes.
          </h2>
          <div className="flex flex-wrap gap-0 border border-white/10 rounded-sm overflow-hidden">
            {tabs.map((t, i) => (
              <button
                key={t.key}
                onClick={() => setActive(i)}
                className={`text-mono text-[11px] tracking-[0.2em] px-4 py-3 border-r last:border-r-0 border-white/10 transition ${
                  i === active
                    ? "bg-panel text-panel-foreground"
                    : "text-white/70 hover:text-white"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 items-start">
          <div>
            <AnimatePresence mode="wait">
              <motion.div
                key={tab.key + "-prompt"}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.4 }}
                className="inline-block rounded-full bg-white/[0.06] border border-white/10 px-5 py-3 text-[15px] text-white/90 max-w-xl"
              >
                {tab.prompt}
              </motion.div>
            </AnimatePresence>

            <div className="mt-10 space-y-4">
              <div className="flex items-center gap-3 text-white/70">
                <span className="h-2.5 w-2.5 rounded-full bg-accent-blue/70 inline-block" />
                <span>Installation</span>
              </div>
              <ul className="divide-y divide-white/5">
                {tab.steps.map((s, i) => (
                  <AnimatePresence key={`${tab.key}-${i}`}>
                    {i < visibleSteps && (
                      <motion.li
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.35 }}
                        className="flex items-center justify-between py-3 text-[15px]"
                      >
                        <span className="flex items-center gap-4 text-white/85">
                          <span className="inline-flex h-5 w-5 items-center justify-center text-accent-blue text-xs">
                            {s.icon}
                          </span>
                          {s.label}
                        </span>
                        <span className="text-mono text-[12px] text-white/50">{s.price}</span>
                      </motion.li>
                    )}
                  </AnimatePresence>
                ))}
              </ul>

              <AnimatePresence>
                {done && (
                  <motion.p
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="pt-4 text-[15px] text-white/90"
                  >
                    {tab.done}
                  </motion.p>
                )}
              </AnimatePresence>
            </div>
          </div>

          <div className="min-h-[360px] rounded-lg border border-dashed border-white/10 relative overflow-hidden">
            <AnimatePresence mode="wait">
              {done ? (
                <motion.div
                  key={tab.key + "-panel"}
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.5 }}
                  className="absolute inset-0"
                >
                  {tab.panel}
                </motion.div>
              ) : (
                <motion.div
                  key={tab.key + "-working"}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute inset-0 flex items-center justify-center text-mono text-[12px] tracking-[0.3em] text-white/40"
                >
                  <span className="caret">WORKING</span>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ---------------- Result Panels ---------------- */

function PanelShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="h-full w-full bg-panel text-panel-foreground rounded-lg p-8">{children}</div>
  );
}

function ElizaPanel() {
  return (
    <PanelShell>
      <div className="flex items-center gap-2 mb-4">
        <span className="flex gap-1">
          <span className="h-2 w-2 rounded-full bg-panel-foreground/20" />
          <span className="h-2 w-2 rounded-full bg-panel-foreground/20" />
          <span className="h-2 w-2 rounded-full bg-panel-foreground/20" />
        </span>
        <span className="text-mono text-[11px] text-panel-foreground/60">elizaos-config.ts</span>
      </div>
      <div className="mt-6 font-mono text-[12px] text-panel-foreground/80 space-y-2">
        <p><span className="text-blue-600">import</span> &#123; circlePlugin &#125; <span className="text-blue-600">from</span> <span className="text-green-600">"@circle-plugins/plugin-eliza"</span></p>
        <p><span className="text-blue-600">export default</span> &#123;</p>
        <p>&nbsp;&nbsp;plugins: [circlePlugin],</p>
        <p>&nbsp;&nbsp;actions: [<span className="text-orange-600">"CIRCLE_CREATE_WALLET"</span>, <span className="text-orange-600">"CIRCLE_SEND_USDC"</span>, ...]</p>
        <p>&#125;</p>
      </div>
    </PanelShell>
  );
}

function OpenClawPanel() {
  return (
    <PanelShell>
      <div className="flex items-center gap-2 mb-4">
        <span className="flex gap-1">
          <span className="h-2 w-2 rounded-full bg-panel-foreground/20" />
          <span className="h-2 w-2 rounded-full bg-panel-foreground/20" />
          <span className="h-2 w-2 rounded-full bg-panel-foreground/20" />
        </span>
        <span className="text-mono text-[11px] text-panel-foreground/60">openclaw.plugin.json</span>
      </div>
      <div className="mt-6 font-mono text-[12px] text-panel-foreground/80 space-y-2">
        <p>&#123;</p>
        <p>&nbsp;&nbsp;<span className="text-blue-600">"id"</span>: <span className="text-green-600">"circle-plugins"</span>,</p>
        <p>&nbsp;&nbsp;<span className="text-blue-600">"name"</span>: <span className="text-green-600">"Circle Plugins"</span>,</p>
        <p>&nbsp;&nbsp;<span className="text-blue-600">"tools"</span>: [</p>
        <p>&nbsp;&nbsp;&nbsp;&nbsp;<span className="text-green-600">"circle_create_wallet"</span>,</p>
        <p>&nbsp;&nbsp;&nbsp;&nbsp;<span className="text-green-600">"circle_send_usdc"</span>,</p>
        <p>&nbsp;&nbsp;&nbsp;&nbsp;<span className="text-green-600">"circle_pay_x402"</span></p>
        <p>&nbsp;&nbsp;]</p>
        <p>&#125;</p>
      </div>
    </PanelShell>
  );
}

function HermesPanel() {
  return (
    <PanelShell>
      <div className="flex items-center gap-2 mb-4">
        <span className="flex gap-1">
          <span className="h-2 w-2 rounded-full bg-panel-foreground/20" />
          <span className="h-2 w-2 rounded-full bg-panel-foreground/20" />
          <span className="h-2 w-2 rounded-full bg-panel-foreground/20" />
        </span>
        <span className="text-mono text-[11px] text-panel-foreground/60">~/.hermes/config.yaml</span>
      </div>
      <div className="mt-6 font-mono text-[12px] text-panel-foreground/80 space-y-2">
        <p><span className="text-blue-600">#</span> pip install circle-plugins[circle]</p>
        <p><span className="text-blue-600">#</span> cp -r hermes/circle-plugins ~/.hermes/plugins/</p>
        <p>plugins:</p>
        <p>&nbsp;&nbsp;enabled:</p>
        <p>&nbsp;&nbsp;&nbsp;&nbsp;- <span className="text-green-600">circle-plugins</span></p>
      </div>
    </PanelShell>
  );
}

function CorePanel() {
  return (
    <PanelShell>
      <div className="flex items-center gap-2 mb-4">
        <span className="flex gap-1">
          <span className="h-2 w-2 rounded-full bg-panel-foreground/20" />
          <span className="h-2 w-2 rounded-full bg-panel-foreground/20" />
          <span className="h-2 w-2 rounded-full bg-panel-foreground/20" />
        </span>
        <span className="text-mono text-[11px] text-panel-foreground/60">app.ts</span>
      </div>
      <div className="mt-6 font-mono text-[12px] text-panel-foreground/80 space-y-2">
        <p><span className="text-blue-600">import</span> &#123; CircleAgentKit &#125; <span className="text-blue-600">from</span> <span className="text-green-600">"@circle-plugins/core"</span></p>
        <p><span className="text-blue-600">const</span> kit = CircleAgentKit.create()</p>
        <p><span className="text-blue-600">const</span> wallet = <span className="text-blue-600">await</span> kit.createWallet()</p>
        <p><span className="text-blue-600">await</span> kit.sendUSDC(&#123;</p>
        <p>&nbsp;&nbsp;amount: <span className="text-green-600">"1.0"</span>,</p>
        <p>&nbsp;&nbsp;destinationAddress: <span className="text-green-600">"0x..."</span></p>
        <p>&#125;)</p>
      </div>
    </PanelShell>
  );
}
function Row({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex justify-between border-b border-panel-foreground/10 pb-2">
      <span className="text-panel-foreground/70">{k}</span>
      <span className="text-mono">{v}</span>
    </div>
  );
}
