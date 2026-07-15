import { Github } from "lucide-react";
import { CircleLogo } from "./CircleLogo";
import { NPM_CORE_URL, REPO_URL } from "@/lib/links";

export function StickyCTA() {
  return (
    <div className="sticky bottom-0 z-20 mx-6 md:mx-10 mb-6 md:mb-8 rounded-md bg-[#0d264f] border border-white/10 px-6 md:px-8 py-4 flex flex-col md:flex-row items-center gap-4 md:gap-6 justify-between backdrop-blur">
      <div className="flex items-center gap-3 text-white">
        <CircleLogo className="h-5 w-5" />
        <span className="text-mono text-[12px] tracking-[0.25em]">CIRCLE PLUGINS</span>
      </div>
      <div className="flex items-center gap-3">
        <a
          href={REPO_URL}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-2 rounded-sm bg-panel text-panel-foreground px-4 py-2.5 text-mono text-[12px] tracking-wide hover:bg-white transition"
        >
          <Github className="h-4 w-4" />
          Star on GitHub
        </a>
        <a
          href={NPM_CORE_URL}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-2 rounded-sm border border-white/25 text-white px-4 py-2.5 text-mono text-[12px] tracking-wide hover:bg-white/5 transition"
        >
          View on npm →
        </a>
      </div>
    </div>
  );
}
