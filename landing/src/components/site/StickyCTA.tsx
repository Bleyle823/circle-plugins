import { Copy } from "lucide-react";
import { CircleLogo } from "./CircleLogo";

export function StickyCTA() {
  return (
    <div className="sticky bottom-0 z-20 mx-6 md:mx-10 mb-6 md:mb-8 rounded-md bg-[#0d264f] border border-white/10 px-6 md:px-8 py-4 flex flex-col md:flex-row items-center gap-4 md:gap-6 justify-between backdrop-blur">
      <div className="flex items-center gap-3 text-white">
        <CircleLogo className="h-5 w-5" />
        <span className="text-mono text-[12px] tracking-[0.25em]">CIRCLE FOR AGENTS</span>
      </div>
      <div className="flex items-center gap-3">
        <button className="inline-flex items-center gap-2 rounded-sm bg-panel text-panel-foreground px-4 py-2.5 text-mono text-[12px] tracking-wide hover:bg-white transition">
          <Copy className="h-4 w-4" />
          Integrate Eliza, OpenClaw, or Hermes
        </button>
        <a href="#getting-started" className="inline-flex items-center gap-2 rounded-sm border border-white/25 text-white px-4 py-2.5 text-mono text-[12px] tracking-wide hover:bg-white/5 transition">
          Get the SDK →
        </a>
      </div>
    </div>
  );
}
